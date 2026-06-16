package handler

import (
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/ai-development-coach/backend/internal/data"
	"github.com/ai-development-coach/backend/internal/middleware"
	"github.com/ai-development-coach/backend/internal/model"
	"github.com/ai-development-coach/backend/internal/repository"
	"github.com/ai-development-coach/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	repo      *repository.SessionRepository
	strengths *repository.StrengthProfileRepository
	users     *repository.UserRepository
	coaching  *service.CoachingService
	analysis  *service.AnalysisService
	followup  *service.FollowUpService
	framework *service.FrameworkService
}

func NewHandler(
	repo *repository.SessionRepository,
	strengths *repository.StrengthProfileRepository,
	users *repository.UserRepository,
	coaching *service.CoachingService,
	analysis *service.AnalysisService,
	followup *service.FollowUpService,
	framework *service.FrameworkService,
) *Handler {
	return &Handler{
		repo: repo, strengths: strengths, users: users, coaching: coaching, analysis: analysis,
		followup: followup, framework: framework,
	}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) GetStaticData(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"strengthQuestions": data.StrengthQuestions,
		"guidedOptions":     data.GuidedOptions,
		"careerLevels":      data.CareerLevels,
		"dims":              data.Dims,
		"dimLabels":         data.DimLabels,
	})
}

func (h *Handler) CreateSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id := uuid.New().String()
	session := model.NewSession(id, userID)
	if latest, err := h.strengths.GetLatestByUser(userID); err == nil {
		session.Strength.Primary = latest.PrimaryDomain
		session.Strength.Secondary = latest.SecondaryDomain
		session.Strength.PrimaryDomain = latest.PrimaryDomain
		session.Strength.SecondaryDomain = latest.SecondaryDomain
		session.Strength.TopStrengths = latest.TopStrengths
		session.Strength.Source = latest.Source
		session.Strength.Answers = latest.Answers
	}
	h.repo.Create(session)
	if session.Strength.Source != "" {
		now := time.Now()
		_ = h.strengths.Save(&model.StrengthProfileRecord{
			ID:              uuid.New().String(),
			SessionID:       session.ID,
			UserID:          session.UserID,
			TopStrengths:    session.Strength.TopStrengths,
			PrimaryDomain:   session.Strength.PrimaryDomain,
			SecondaryDomain: session.Strength.SecondaryDomain,
			Source:          session.Strength.Source,
			Answers:         session.Strength.Answers,
			CreatedAt:       now,
			UpdatedAt:       now,
		})
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "session": session})
}

func (h *Handler) GetSession(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}
	c.JSON(http.StatusOK, session)
}

func (h *Handler) DeleteSession(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	if _, err := h.repo.GetOwned(id, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "session deleted"})
}

func (h *Handler) UpdateOnboarding(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	var req model.OnboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session.CurrentRole = req.CurrentRole
	session.TargetRole = req.TargetRole
	session.Feedback = req.Feedback
	if req.CareerLevel == "" {
		session.CareerLevel = "L1"
	} else {
		session.CareerLevel = req.CareerLevel
	}
	session.AppState = "ONBOARD"
	session.UpdatedAt = time.Now()

	if user, err := h.users.GetByID(session.UserID); err == nil {
		if user.CurrentRole == "" || user.TargetRole == "" ||
			user.CurrentRole != req.CurrentRole || user.TargetRole != req.TargetRole {
			user.CurrentRole = req.CurrentRole
			user.TargetRole = req.TargetRole
			_ = h.users.Save(user)
		}
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, session)
}

func (h *Handler) SubmitStrength(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	var req model.StrengthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session.Strength.Answers = req.Answers
	result := service.ComputeStrength(req.Answers)
	session.Strength.Primary = result.Primary
	session.Strength.Secondary = result.Secondary
	session.Strength.PrimaryDomain = result.PrimaryDomain
	session.Strength.SecondaryDomain = result.SecondaryDomain
	session.Strength.TopStrengths = result.TopStrengths
	session.Strength.Source = result.Source

	now := time.Now()
	profile := &model.StrengthProfileRecord{
		ID:              uuid.New().String(),
		SessionID:       session.ID,
		UserID:          session.UserID,
		TopStrengths:    result.TopStrengths,
		PrimaryDomain:   result.PrimaryDomain,
		SecondaryDomain: result.SecondaryDomain,
		Source:          result.Source,
		Answers:         req.Answers,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	if err := h.strengths.Save(profile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, gin.H{"strength": result, "profile": profile, "session": session})
}

func (h *Handler) saveSession(c *gin.Context, session *model.Session) {
	touchSession(session)
	h.repo.Save(session)
}

func (h *Handler) StartCoaching(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}
	if session.Strength.Source == "" || session.Strength.PrimaryDomain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "strength profile is required before starting coaching"})
		return
	}

	reply, err := h.coaching.StartCoaching(session)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, gin.H{"reply": reply, "session": session})
}

func (h *Handler) GetStrengthProfile(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}
	profile, err := h.strengths.GetBySession(session.ID, session.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "strength profile not found"})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *Handler) UploadFramework(c *gin.Context) {
	userID := middleware.GetUserID(c)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	sourceFormat := c.PostForm("format")
	if sourceFormat == "" {
		sourceFormat = strings.TrimPrefix(strings.ToLower(filepath.Ext(file.Filename)), ".")
	}
	if sourceFormat != "json" && sourceFormat != "csv" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only json and csv framework uploads are supported now"})
		return
	}

	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	defer opened.Close()

	framework, err := h.framework.Upload(userID, sourceFormat, opened)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, framework)
}

func (h *Handler) ListFrameworks(c *gin.Context) {
	userID := middleware.GetUserID(c)
	frameworks, err := h.framework.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"frameworks": frameworks})
}

func (h *Handler) SendCoachMessage(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	var req model.CoachMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reply, err := h.coaching.SendMessage(session, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, gin.H{"reply": reply, "session": session})
}

func (h *Handler) SubmitGuided(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	var req model.GuidedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session.GuidedSelections = req.Selections
	h.saveSession(c, session)
	c.JSON(http.StatusOK, session)
}

func (h *Handler) RunAnalysis(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	plan, err := h.analysis.RunAnalysis(session)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, gin.H{"plan": plan, "session": session})
}

func (h *Handler) CommitBehaviors(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	var req model.CommitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var committed []model.Behavior
	for _, idx := range req.Indices {
		if idx >= 0 && idx < len(session.Plan.Behaviors) {
			committed = append(committed, session.Plan.Behaviors[idx])
		}
	}
	if len(committed) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "select at least one behavior"})
		return
	}

	session.Committed = committed
	h.saveSession(c, session)
	c.JSON(http.StatusOK, session)
}

func (h *Handler) StartFollowUp(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	reply, err := h.followup.StartFollowUp(session)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, gin.H{"reply": reply, "session": session})
}

func (h *Handler) SendFollowUp(c *gin.Context) {
	session, err := h.getSession(c)
	if err != nil {
		return
	}

	var req model.FollowUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reply, err := h.followup.SendMessage(session, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.saveSession(c, session)
	c.JSON(http.StatusOK, gin.H{"reply": reply, "session": session})
}

func (h *Handler) getSession(c *gin.Context) (*model.Session, error) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	session, err := h.repo.GetOwned(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return nil, err
	}
	return session, nil
}

func touchSession(session *model.Session) {
	session.UpdatedAt = time.Now()
}
