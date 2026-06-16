package config

import (
	"os"
	"strings"
)

type Config struct {
	Port            string
	AIProvider      string
	AnthropicAPIKey string
	ClaudeModel     string
	AllowedOrigins  []string
	JWTSecret       string
	DBPath          string
}

func Load() Config {
	loadDotEnv(".env", "../.env")

	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		origins = "http://localhost:5173,http://localhost:3000"
	}

	model := os.Getenv("CLAUDE_MODEL")
	if model == "" {
		model = "claude-sonnet-4-6"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/app.db"
	}

	aiProvider := os.Getenv("AI_PROVIDER")
	if aiProvider == "" {
		if os.Getenv("ANTHROPIC_API_KEY") != "" {
			aiProvider = "anthropic"
		} else {
			aiProvider = "free"
		}
	}

	return Config{
		Port:            port,
		AIProvider:      aiProvider,
		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),
		ClaudeModel:     model,
		AllowedOrigins:  strings.Split(origins, ","),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		DBPath:          dbPath,
	}
}

func loadDotEnv(paths ...string) {
	for _, path := range paths {
		content, err := os.ReadFile(path)
		if err != nil {
			continue
		}

		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}

			key, value, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}

			key = strings.TrimSpace(key)
			value = strings.Trim(strings.TrimSpace(value), `"'`)
			if key == "" || os.Getenv(key) != "" {
				continue
			}
			_ = os.Setenv(key, value)
		}
		return
	}
}
