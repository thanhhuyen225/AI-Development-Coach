package model

import "time"

type Session struct {
	ID               string          `json:"id"`
	UserID           string          `json:"userId,omitempty"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
	AppState         string          `json:"appState"`
	CurrentRole      string          `json:"currentRole"`
	TargetRole       string          `json:"targetRole"`
	Feedback         string          `json:"feedback"`
	CareerLevel      string          `json:"careerLevel"`
	Strength         StrengthProfile `json:"strength"`
	Convo            Conversation    `json:"convo"`
	GuidedSelections []string        `json:"guidedSelections"`
	Plan             DevelopmentPlan `json:"plan"`
	Committed        []Behavior      `json:"committed"`
	FUHistory        []Message       `json:"fuHistory"`
}

type StrengthProfile struct {
	Primary         string         `json:"primary"`
	Secondary       string         `json:"secondary"`
	PrimaryDomain   string         `json:"primaryDomain"`
	SecondaryDomain string         `json:"secondaryDomain"`
	TopStrengths    []string       `json:"topStrengths"`
	Source          string         `json:"source"`
	Answers         map[string]int `json:"answers"`
}

type Conversation struct {
	Messages      []Message         `json:"messages"`
	QuestionCount int               `json:"questionCount"`
	Dims          map[string]string `json:"dims"`
	CompletedDims map[string]bool   `json:"completedDims"`
	LastDim       string            `json:"lastDim"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DevelopmentPlan struct {
	Gaps      []Gap      `json:"gaps"`
	Behaviors []Behavior `json:"behaviors"`
	Courses   []Course   `json:"courses"`
}

type Gap struct {
	Title     string `json:"title"`
	RootCause string `json:"rootCause"`
}

type Behavior struct {
	Title            string `json:"title"`
	Description      string `json:"description"`
	StrengthLeverage string `json:"strengthLeverage"`
	Frequency        string `json:"frequency"`
	CheckpointDays   int    `json:"checkpointDays"`
	DeadlineDays     int    `json:"deadlineDays"`
}

type Course struct {
	CourseName string `json:"courseName"`
	Instructor string `json:"instructor"`
	Platform   string `json:"platform"`
	Reason     string `json:"reason"`
	Competency string `json:"competency"`
}

func NewSession(id, userID string) *Session {
	now := time.Now()
	return &Session{
		ID:          id,
		UserID:      userID,
		CreatedAt:   now,
		UpdatedAt:   now,
		AppState:    "ONBOARD",
		CareerLevel: "L1",
		Strength: StrengthProfile{
			Answers: make(map[string]int),
		},
		Convo: Conversation{
			Messages: []Message{},
			Dims: map[string]string{
				"goal": "", "current_state": "", "evidence": "",
				"constraint": "", "motivation": "",
			},
			CompletedDims: make(map[string]bool),
		},
		GuidedSelections: []string{},
		Plan: DevelopmentPlan{
			Gaps:      []Gap{},
			Behaviors: []Behavior{},
			Courses:   []Course{},
		},
		Committed: []Behavior{},
		FUHistory: []Message{},
	}
}
