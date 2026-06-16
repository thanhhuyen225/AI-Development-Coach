package repository

import (
	"database/sql"
	"errors"
	"strings"

	"github.com/ai-development-coach/backend/internal/model"
)

var ErrUserNotFound = errors.New("user not found")
var ErrUserExists = errors.New("user already exists")

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	email := strings.ToLower(strings.TrimSpace(user.Email))
	_, err := r.db.Exec(
		`INSERT INTO users (
			id, email, password_hash, name, current_role, target_role, department, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		user.ID,
		email,
		user.PasswordHash,
		user.Name,
		user.CurrentRole,
		user.TargetRole,
		user.Department,
		user.CreatedAt.Format(timeLayout),
	)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return ErrUserExists
		}
		return err
	}
	user.Email = email
	return nil
}

func (r *UserRepository) GetByID(id string) (*model.User, error) {
	return r.get(`SELECT id, email, password_hash, name, current_role, target_role, department, created_at FROM users WHERE id = ?`, id)
}

func (r *UserRepository) GetByEmail(email string) (*model.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	return r.get(`SELECT id, email, password_hash, name, current_role, target_role, department, created_at FROM users WHERE email = ?`, email)
}

func (r *UserRepository) Save(user *model.User) error {
	result, err := r.db.Exec(
		`UPDATE users
		 SET name = ?, current_role = ?, target_role = ?, department = ?
		 WHERE id = ?`,
		user.Name,
		user.CurrentRole,
		user.TargetRole,
		user.Department,
		user.ID,
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *UserRepository) get(query string, args ...any) (*model.User, error) {
	var user model.User
	var createdAt string
	err := r.db.QueryRow(query, args...).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.CurrentRole,
		&user.TargetRole,
		&user.Department,
		&createdAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	user.CreatedAt = parseTime(createdAt)
	return &user, nil
}
