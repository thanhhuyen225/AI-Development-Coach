package model

import "time"

type StrengthProfileRecord struct {
	ID              string         `json:"id"`
	SessionID       string         `json:"sessionId"`
	UserID          string         `json:"userId"`
	TopStrengths    []string       `json:"topStrengths"`
	PrimaryDomain   string         `json:"primaryDomain"`
	SecondaryDomain string         `json:"secondaryDomain"`
	Source          string         `json:"source"`
	Answers         map[string]int `json:"answers,omitempty"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

type CompetencyFramework struct {
	ID           string       `json:"id"`
	UserID       string       `json:"userId"`
	Role         string       `json:"role"`
	TargetLevel  string       `json:"targetLevel"`
	SourceFormat string       `json:"sourceFormat"`
	Competencies []Competency `json:"competencies"`
	IsActive     bool         `json:"isActive"`
	CreatedAt    time.Time    `json:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt"`
}

type Competency struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type FrameworkUploadPayload struct {
	Role         string       `json:"role"`
	TargetLevel  string       `json:"targetLevel"`
	Competencies []Competency `json:"competencies"`
}
