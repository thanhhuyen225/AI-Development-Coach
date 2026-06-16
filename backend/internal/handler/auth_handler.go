package handler

import (
	"net/http"

	"github.com/ai-development-coach/backend/internal/middleware"
	"github.com/ai-development-coach/backend/internal/model"
	"github.com/ai-development-coach/backend/internal/repository"
	"github.com/ai-development-coach/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth  *service.AuthService
	users *repository.UserRepository
	repo  *repository.SessionRepository
}

func NewAuthHandler(auth *service.AuthService, users *repository.UserRepository, repo *repository.SessionRepository) *AuthHandler {
	return &AuthHandler{auth: auth, users: users, repo: repo}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, token, err := h.auth.Register(req)
	if err != nil {
		if err == repository.ErrUserExists {
			c.JSON(http.StatusConflict, gin.H{"error": "email đã được sử dụng"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, token, err := h.auth.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email hoặc mật khẩu không đúng"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.users.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	sessions := h.repo.ListByUser(userID)
	stats := gin.H{
		"totalSessions":   len(sessions),
		"completedPlans":  0,
		"activeFollowUps": 0,
	}
	for _, s := range sessions {
		if s.AppState == "DEVELOPMENT_PLAN" || s.AppState == "FOLLOW_UP" {
			stats["completedPlans"] = stats["completedPlans"].(int) + 1
		}
		if s.AppState == "FOLLOW_UP" {
			stats["activeFollowUps"] = stats["activeFollowUps"].(int) + 1
		}
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "stats": stats})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := h.auth.UpdateProfile(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func (h *AuthHandler) History(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessions := h.repo.ListByUser(userID)

	var summaries []model.SessionSummary
	for _, s := range sessions {
		summaries = append(summaries, service.ToSessionSummary(s))
	}
	if summaries == nil {
		summaries = []model.SessionSummary{}
	}

	c.JSON(http.StatusOK, gin.H{"sessions": summaries})
}
