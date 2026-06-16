package model

import "time"

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	CurrentRole  string    `json:"currentRole"`
	TargetRole   string    `json:"targetRole"`
	Department   string    `json:"department"`
	CreatedAt    time.Time `json:"createdAt"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UpdateProfileRequest struct {
	Name        string `json:"name"`
	CurrentRole string `json:"currentRole"`
	TargetRole  string `json:"targetRole"`
	Department  string `json:"department"`
}

type SessionSummary struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Status       string    `json:"status"`
	StatusLabel  string    `json:"statusLabel"`
	CurrentRole  string    `json:"currentRole"`
	TargetRole   string    `json:"targetRole"`
	CareerLevel  string    `json:"careerLevel"`
	MessageCount int       `json:"messageCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func SessionStatusLabel(appState string) string {
	labels := map[string]string{
		"ONBOARD":           "Thông tin cá nhân",
		"NORMAL_COACHING":   "Đang coaching",
		"GUIDED_REFLECTION": "Guided reflection",
		"GAP_ANALYSIS":      "Đang phân tích",
		"DEVELOPMENT_PLAN":  "Kế hoạch phát triển",
		"FOLLOW_UP":         "Follow-up",
	}
	if l, ok := labels[appState]; ok {
		return l
	}
	return appState
}
