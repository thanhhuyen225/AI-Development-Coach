package model

type OnboardingRequest struct {
	CurrentRole string `json:"currentRole" binding:"required"`
	TargetRole  string `json:"targetRole" binding:"required"`
	Feedback    string `json:"feedback"`
	CareerLevel string `json:"careerLevel"`
}

type StrengthRequest struct {
	Answers map[string]int `json:"answers" binding:"required"`
}

type CoachMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

type GuidedRequest struct {
	Selections []string `json:"selections" binding:"required"`
}

type CommitRequest struct {
	Indices []int `json:"indices" binding:"required"`
}

type FollowUpRequest struct {
	Message string `json:"message" binding:"required"`
}

type CoachReply struct {
	Dimension        string `json:"dimension"`
	Question         string `json:"question"`
	ExtractedInfo    string `json:"extractedInfo,omitempty"`
	ReadyForAnalysis bool   `json:"readyForAnalysis"`
	TriggerGuided    bool   `json:"triggerGuided,omitempty"`
	ReflectionNote   string `json:"reflectionNote,omitempty"`
	SystemNote       string `json:"systemNote,omitempty"`
	HideChatInput    bool   `json:"hideChatInput,omitempty"`
	ShowAnalyze      bool   `json:"showAnalyze,omitempty"`
}

type StrengthResult struct {
	Primary         string   `json:"primary"`
	Secondary       string   `json:"secondary"`
	PrimaryDomain   string   `json:"primaryDomain"`
	SecondaryDomain string   `json:"secondaryDomain"`
	TopStrengths    []string `json:"topStrengths"`
	Source          string   `json:"source"`
}

type StrengthQuestion struct {
	ID   string   `json:"id"`
	Text string   `json:"text"`
	Opts []string `json:"opts"`
}

type ChatMessage struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	Dimension string `json:"dimension,omitempty"`
}
