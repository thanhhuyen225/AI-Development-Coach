package main

import (
	"log"

	"github.com/ai-development-coach/backend/internal/config"
	"github.com/ai-development-coach/backend/internal/handler"
	"github.com/ai-development-coach/backend/internal/middleware"
	"github.com/ai-development-coach/backend/internal/repository"
	"github.com/ai-development-coach/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	store, err := repository.NewStore(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()

	sessionRepo := store.Sessions()
	userRepo := store.Users()
	strengthRepo := store.StrengthProfiles()
	frameworkRepo := store.Frameworks()
	authSvc := service.NewAuthService(userRepo, cfg)
	anthropic := service.NewAnthropicService(cfg)
	framework := service.NewFrameworkService(frameworkRepo)
	coaching := service.NewCoachingService(anthropic)
	analysis := service.NewAnalysisService(anthropic, framework)
	followup := service.NewFollowUpService(anthropic)

	h := handler.NewHandler(sessionRepo, strengthRepo, userRepo, coaching, analysis, followup, framework)
	authH := handler.NewAuthHandler(authSvc, userRepo, sessionRepo)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/health", h.Health)

	// Backward-friendly aliases for people testing auth manually without /api/v1.
	r.POST("/auth/register", authH.Register)
	r.POST("/auth/login", authH.Login)

	api := r.Group("/api/v1")
	{
		api.GET("/static", h.GetStaticData)

		auth := api.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(authSvc))
		{
			protected.GET("/auth/me", authH.Me)
			protected.PATCH("/auth/profile", authH.UpdateProfile)
			protected.POST("/auth/logout", authH.Logout)
			protected.GET("/history", authH.History)
			protected.GET("/frameworks", h.ListFrameworks)
			protected.POST("/admin/frameworks/upload", h.UploadFramework)

			protected.POST("/sessions", h.CreateSession)
			protected.GET("/sessions/:id", h.GetSession)
			protected.DELETE("/sessions/:id", h.DeleteSession)
			protected.PATCH("/sessions/:id/onboarding", h.UpdateOnboarding)
			protected.POST("/sessions/:id/strength", h.SubmitStrength)
			protected.POST("/sessions/:id/strength/quick", h.SubmitStrength)
			protected.GET("/sessions/:id/strength", h.GetStrengthProfile)
			protected.POST("/sessions/:id/coach/start", h.StartCoaching)
			protected.POST("/sessions/:id/coach/message", h.SendCoachMessage)
			protected.POST("/sessions/:id/coach/guided", h.SubmitGuided)
			protected.POST("/sessions/:id/analysis", h.RunAnalysis)
			protected.POST("/sessions/:id/commit", h.CommitBehaviors)
			protected.POST("/sessions/:id/followup/start", h.StartFollowUp)
			protected.POST("/sessions/:id/followup/message", h.SendFollowUp)
		}
	}

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
