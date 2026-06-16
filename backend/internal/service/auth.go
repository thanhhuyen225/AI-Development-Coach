package service

import (
	"errors"
	"time"

	"github.com/ai-development-coach/backend/internal/config"
	"github.com/ai-development-coach/backend/internal/model"
	"github.com/ai-development-coach/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

type AuthService struct {
	users  *repository.UserRepository
	secret []byte
}

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func NewAuthService(users *repository.UserRepository, cfg config.Config) *AuthService {
	secret := cfg.JWTSecret
	if secret == "" {
		secret = "dev-secret-change-in-production"
	}
	return &AuthService{users: users, secret: []byte(secret)}
}

func (s *AuthService) Register(req model.RegisterRequest) (*model.User, string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user := &model.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
		CreatedAt:    time.Now(),
	}

	if err := s.users.Create(user); err != nil {
		return nil, "", err
	}

	token, err := s.issueToken(user)
	return user, token, err
}

func (s *AuthService) Login(req model.LoginRequest) (*model.User, string, error) {
	user, err := s.users.GetByEmail(req.Email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return nil, "", ErrInvalidCredentials
	}
	token, err := s.issueToken(user)
	return user, token, err
}

func (s *AuthService) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (s *AuthService) UpdateProfile(userID string, req model.UpdateProfileRequest) (*model.User, error) {
	user, err := s.users.GetByID(userID)
	if err != nil {
		return nil, err
	}
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.CurrentRole != "" {
		user.CurrentRole = req.CurrentRole
	}
	if req.TargetRole != "" {
		user.TargetRole = req.TargetRole
	}
	if req.Department != "" {
		user.Department = req.Department
	}
	if err := s.users.Save(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) issueToken(user *model.User) (string, error) {
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func ToSessionSummary(s *model.Session) model.SessionSummary {
	title := "Coaching session mới"
	if s.CurrentRole != "" && s.TargetRole != "" {
		title = s.CurrentRole + " → " + s.TargetRole
	} else if s.CurrentRole != "" {
		title = s.CurrentRole
	}
	return model.SessionSummary{
		ID:           s.ID,
		Title:        title,
		Status:       s.AppState,
		StatusLabel:  model.SessionStatusLabel(s.AppState),
		CurrentRole:  s.CurrentRole,
		TargetRole:   s.TargetRole,
		CareerLevel:  s.CareerLevel,
		MessageCount: len(s.Convo.Messages),
		CreatedAt:    s.CreatedAt,
		UpdatedAt:    s.UpdatedAt,
	}
}
