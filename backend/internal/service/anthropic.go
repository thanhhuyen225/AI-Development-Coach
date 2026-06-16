package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/ai-development-coach/backend/internal/config"
	"github.com/ai-development-coach/backend/internal/model"
)

type AnthropicService struct {
	provider string
	apiKey   string
	model    string
	client   *http.Client
}

func NewAnthropicService(cfg config.Config) *AnthropicService {
	return &AnthropicService{
		provider: strings.ToLower(cfg.AIProvider),
		apiKey:   cfg.AnthropicAPIKey,
		model:    cfg.ClaudeModel,
		client:   &http.Client{},
	}
}

type anthropicRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	System    string          `json:"system,omitempty"`
	Messages  []model.Message `json:"messages"`
}

type anthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (s *AnthropicService) Call(messages []model.Message, system string, maxTokens int) (string, error) {
	if s.provider == "" || s.provider == "free" {
		return "", fmt.Errorf("AI_PROVIDER=free: using rule-based fallback")
	}
	if s.provider != "anthropic" {
		return "", fmt.Errorf("unsupported AI_PROVIDER %q", s.provider)
	}
	if s.apiKey == "" {
		return "", fmt.Errorf("ANTHROPIC_API_KEY is not configured; set AI_PROVIDER=free to run without paid AI")
	}
	if maxTokens == 0 {
		maxTokens = 900
	}

	body, err := json.Marshal(anthropicRequest{
		Model:     s.model,
		MaxTokens: maxTokens,
		System:    system,
		Messages:  messages,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result anthropicResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse anthropic response: %w", err)
	}
	if result.Error != nil {
		return "", fmt.Errorf("anthropic API error: %s", result.Error.Message)
	}
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("anthropic API returned status %d", resp.StatusCode)
	}

	var text string
	for _, c := range result.Content {
		text += c.Text
	}
	return text, nil
}
