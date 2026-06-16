package service

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/ai-development-coach/backend/internal/data"
	"github.com/ai-development-coach/backend/internal/model"
)

type CoachingService struct {
	anthropic *AnthropicService
}

func NewCoachingService(anthropic *AnthropicService) *CoachingService {
	return &CoachingService{anthropic: anthropic}
}

type parsedCoachReply struct {
	Dimension        string `json:"dimension"`
	Question         string `json:"question"`
	ExtractedInfo    string `json:"extractedInfo"`
	AnswerQuality    string `json:"answerQuality"`
	ReflectionNote   string `json:"reflectionNote"`
	ReadyForAnalysis bool   `json:"readyForAnalysis"`
}

const maxCoachQuestions = 8

func (s *CoachingService) BuildCoachSysPrompt(session *model.Session) string {
	var dimStatus []string
	for _, d := range data.Dims {
		meta := data.DimMetaMap[d]
		status := "chưa có"
		if session.Convo.CompletedDims[d] {
			status = "✓ đủ — " + session.Convo.Dims[d]
		} else if v := session.Convo.Dims[d]; v != "" {
			status = "đang thu thập — " + v
		}
		dimStatus = append(dimStatus, fmt.Sprintf("[%s] %s: %s", d, meta.Label, status))
	}

	nextDim := nextIncompleteDim(session)
	feedback := session.Feedback
	if feedback == "" {
		feedback = "Không có"
	}

	templates := data.CoachingQuestionTemplates(session.CurrentRole, session.TargetRole, session.Strength.Primary)
	var exampleBlock strings.Builder
	for _, d := range data.Dims {
		meta := data.DimMetaMap[d]
		fmt.Fprintf(&exampleBlock, "\n▸ %s (%s):\n  Câu mẫu: %s\n  Phải có: %s\n",
			meta.Label, d, templates[d], strings.Join(meta.MustHave, "; "))
	}

	return fmt.Sprintf(`Bạn là AI Career Development Coach — phong cách GROW + STAR, thúc đẩy HÀNH ĐỘNG THỰC TẾ.

THÔNG TIN NGƯỜI DÙNG:
- Vai trò hiện tại: %s → Mục tiêu: %s
- Cấp độ: %s | Điểm mạnh: %s (chính), %s (phụ)
- Feedback từ manager/mentor: %s

TRẠNG THÁI THU THẬP (%d/%d câu):
%s

DIMENSION TIẾP THEO: %s

BỘ CÂU HỎI CHUẨN THEO DIMENSION:%s

QUY TẮC COACHING (BRIDGE + QUESTION):
1. Mỗi response PHẢI có đúng 2 phần TÁCH BIỆT:
   - reflectionNote: CHỈ chứa BRIDGE (1 câu acknowledge/góc nhìn mới từ câu trả lời user)
   - question: CHỈ chứa QUESTION (1 câu hỏi drill-down, KHÔNG có BRIDGE)
2. KHÔNG bao gồm BRIDGE trong trường question. KHÔNG lặp lại nội dung user trong question.
3. QUESTION phải drill-down từ đúng dimension: WHY / HOW / MISCELLANEOUS.

VÍ DỤ ĐÚNG:
{
  "reflectionNote": "Mình ghi nhận việc bạn đã lead dự án đó thành công — đó là một thành tựu đáng kể.",
  "question": "Bạn có thể cho mình biết cụ thể team bạn dẫn dắt có bao nhiêu người và metric đo lường là gì?"
}

VÍ DỤ SAI (KHÔNG LÀM):
{
  "question": "Mình ghi nhận... QUESTION: Bạn có thể..."  // ❌ BRIDGE và QUESTION trong cùng field
}

DETECT SIGNAL trong response của user:
- VAGUE: Ngôn ngữ chung → dùng WHY: "Tôi nghe thấy một câu khá chung — bạn có thể kể cho tôi nghe một ví dụ cụ thể gần đây không?"
- CONTRADICTION: Tự mâu thuẫn → dùng WHY: "Tôi đang nghe hai điều song song — bạn có thể giúp tôi hiểu rõ hơn không?"
- EXTERNAL BLAME: Luôn đổ lỗi người khác → dùng HOW: "Tôi hiểu môi trường đó không dễ... Điều gì trong tầm kiểm soát của bạn?"
- ASSUMPTION: Kết luận không có evidence → dùng WHY: "Bạn đang có một nhận định khá rõ về điều đó. Điều đó đến từ đâu?"
- EMOTIONAL: Từ có tải cảm xúc → dùng HOW: acknowledge cảm xúc trước rồi hỏi về trải nghiệm
- STRONG CLAIM: Tự đánh giá cao không có ví dụ → dùng WHY: "Bạn nghe khá chắc chắn... tôi muốn thấy điều đó qua mắt bạn"

QUY TẮC CƠ BẢN (vẫn giữ):
1. Mỗi lượt CHỈ 1 câu hỏi, thuộc đúng 1 dimension.
2. Câu hỏi PHẢI yêu cầu thông tin CỤ THỂ: tên dự án, số liệu, timeline, stakeholder, hành động.
3. KHÔNG dùng: "Hãy chia sẻ thêm", "Nói rõ hơn", "Tiếp tục nhé", câu hỏi yes/no đơn thuần.
4. Khi user trả lời: (a) reflectionNote 1 câu ghi nhận cụ thể điều họ nói, (b) đánh giá answerQuality.
5. answerQuality = "sufficient" CHỈ KHI có ≥2 trong: tên dự án/sản phẩm, số liệu/metric, timeline, vai trò cụ thể, hành động động từ.
6. answerQuality = "needs_probe" → hỏi tiếp CÙNG dimension, đào sâu phần còn thiếu (dùng ProbeHints).
7. CHỈ đánh dấu dimension hoàn thành khi answerQuality = "sufficient".
8. Cần đủ 4 dimension: goal + current_state + evidence + motivation (constraint khuyến khích).
9. Khi đủ context → readyForAnalysis: true, tóm tắt 3 điểm chính đã thu thập.
10. Tối đa %d câu hỏi. Leverage strength "%s" khi phù hợp.
11. Luôn hướng user về HÀNH ĐỘNG: "tuần sau bạn sẽ làm gì?", "ai sẽ feedback?"
12. KHÔNG BAO GIỜ dùng: "Hãy chia sẻ thêm", "Nói rõ hơn", "Tiếp tục nhé", "Bạn nên..."
13. DỪNG coaching khi user tự nhiên bắt đầu nói về điều họ muốn thay đổi hoặc sẵn sàng làm khác đi.

FORMAT JSON thuần (không markdown):
{
  "dimension": "goal|current_state|evidence|constraint|motivation",
  "reflectionNote": "BRIDGE: 1 câu acknowledge điều user vừa nói, tạo góc nhìn mới (để trống nếu câu mở đầu)",
  "question": "CHỈ QUESTION: 1 câu hỏi drill-down từ đúng dimension, không bao gồm BRIDGE",
  "extractedInfo": "tóm tắt structured: Mục tiêu/Dự án/Tình huống/Rào cản/Hành động — để trống nếu chưa có câu trả lời",
  "answerQuality": "sufficient|needs_probe|pending",
  "readyForAnalysis": false
}`,
		session.CurrentRole, session.TargetRole,
		session.CareerLevel, session.Strength.Primary, session.Strength.Secondary, feedback,
		session.Convo.QuestionCount, maxCoachQuestions,
		strings.Join(dimStatus, "\n"),
		nextDim,
		exampleBlock.String(),
		maxCoachQuestions,
		session.Strength.Primary,
	)
}

func nextIncompleteDim(session *model.Session) string {
	for _, d := range data.Dims {
		if !session.Convo.CompletedDims[d] {
			return d
		}
	}
	return "done"
}

func ParseCoachReply(raw string) *parsedCoachReply {
	cleaned := strings.TrimSpace(raw)
	cleaned = strings.ReplaceAll(cleaned, "```json", "")
	cleaned = strings.ReplaceAll(cleaned, "```", "")
	cleaned = strings.TrimSpace(cleaned)

	var parsed parsedCoachReply
	if err := json.Unmarshal([]byte(cleaned), &parsed); err == nil {
		return &parsed
	}

	re := regexp.MustCompile(`"question"\s*:\s*"([^"]+)"`)
	if m := re.FindStringSubmatch(raw); len(m) > 1 {
		return &parsedCoachReply{
			Dimension: "goal", Question: m[1], AnswerQuality: "pending", ReadyForAnalysis: false,
		}
	}
	return nil
}

func (s *CoachingService) StartCoaching(session *model.Session) (*model.CoachReply, error) {
	session.AppState = "NORMAL_COACHING"

	templates := data.CoachingQuestionTemplates(session.CurrentRole, session.TargetRole, session.Strength.Primary)
	// Opening message with BRIDGE + QUESTION format
	opening := fmt.Sprintf(
		"Chào bạn! Mình sẽ đồng hành cùng bạn qua %d–%d câu hỏi để hiểu rõ tình huống và giúp bạn có kế hoạch hành động cụ thể. Hãy trả lời với ví dụ thực tế (dự án, số liệu, timeline) nhé.\n\n%s",
		5, maxCoachQuestions, templates["goal"],
	)

	session.Convo.LastDim = "goal"
	session.Convo.QuestionCount++
	session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "assistant", Content: opening})

	return &model.CoachReply{
		Dimension: "goal",
		Question:  opening,
	}, nil
}

func (s *CoachingService) SendMessage(session *model.Session, message string) (*model.CoachReply, error) {
	session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "user", Content: message})

	// Probe locally if answer is clearly insufficient before calling AI
	lastDim := session.Convo.LastDim
	if lastDim != "" && !IsAnswerSufficient(message, lastDim) && !session.Convo.CompletedDims[lastDim] {
		probe := data.ProbeQuestionTemplates(lastDim, session.CurrentRole, session.TargetRole)
		reflection := buildLocalReflection(message, lastDim)
		fullQ := reflection + "\n\n" + probe
		session.Convo.QuestionCount++
		session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "assistant", Content: fullQ})
		return &model.CoachReply{
			Dimension:      lastDim,
			Question:       fullQ,
			ReflectionNote: reflection,
		}, nil
	}

	if DetectLowAwareness(session) {
		session.AppState = "GUIDED_REFLECTION"
		return &model.CoachReply{
			TriggerGuided: true,
			SystemNote:    "Câu trả lời còn khá chung. Hãy chọn các vấn đề gần với bạn nhất — sau đó mình sẽ hỏi thêm để làm rõ.",
			HideChatInput: true,
		}, nil
	}

	var apiMsgs []model.Message
	for _, m := range session.Convo.Messages {
		if m.Role == "user" || m.Role == "assistant" {
			apiMsgs = append(apiMsgs, m)
		}
	}

	raw, err := s.anthropic.Call(apiMsgs, s.BuildCoachSysPrompt(session), 1200)
	if err != nil {
		return s.fallbackReply(session), nil
	}

	parsed := ParseCoachReply(raw)
	if parsed == nil {
		return s.fallbackReply(session), nil
	}

	return s.handleCoachReply(session, parsed, true), nil
}

func (s *CoachingService) fallbackReply(session *model.Session) *model.CoachReply {
	dim := nextIncompleteDim(session)
	templates := data.CoachingQuestionTemplates(session.CurrentRole, session.TargetRole, session.Strength.Primary)
	q := templates[dim]
	session.Convo.LastDim = dim
	session.Convo.QuestionCount++
	session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "assistant", Content: q})
	return &model.CoachReply{Dimension: dim, Question: q}
}

func (s *CoachingService) handleCoachReply(session *model.Session, parsed *parsedCoachReply, isResponse bool) *model.CoachReply {
	dim := parsed.Dimension
	if dim == "" {
		dim = nextIncompleteDim(session)
	}

	// Build full message: reflection + question
	fullContent := parsed.Question
	if parsed.ReflectionNote != "" && isResponse {
		fullContent = parsed.ReflectionNote + "\n\n" + parsed.Question
	}

	if isResponse && session.Convo.LastDim != "" {
		quality := parsed.AnswerQuality
		if quality == "" {
			// infer from last user message
			var lastUser string
			for i := len(session.Convo.Messages) - 1; i >= 0; i-- {
				if session.Convo.Messages[i].Role == "user" {
					lastUser = session.Convo.Messages[i].Content
					break
				}
			}
			if IsAnswerSufficient(lastUser, session.Convo.LastDim) {
				quality = "sufficient"
			} else {
				quality = "needs_probe"
			}
		}

		if quality == "sufficient" && parsed.ExtractedInfo != "" {
			session.Convo.Dims[session.Convo.LastDim] = parsed.ExtractedInfo
			session.Convo.CompletedDims[session.Convo.LastDim] = true
		}
	}

	requiredComplete := session.Convo.CompletedDims["goal"] &&
		session.Convo.CompletedDims["current_state"] &&
		session.Convo.CompletedDims["evidence"] &&
		session.Convo.CompletedDims["motivation"]
	hitLimit := session.Convo.QuestionCount >= maxCoachQuestions

	if parsed.ReadyForAnalysis || (requiredComplete && session.Convo.QuestionCount >= 5) || hitLimit {
		summary := buildSessionSummary(session)
		note := "Đã thu thập đủ thông tin để phân tích.\n\n" + summary + "\n\nNhấn \"Phân tích & tạo kế hoạch\" để nhận lộ trình hành động 60 ngày."
		reply := &model.CoachReply{
			ReadyForAnalysis: true,
			SystemNote:       note,
			HideChatInput:    true,
			ShowAnalyze:      true,
		}
		if parsed.Question != "" && parsed.ReadyForAnalysis {
			reply.Question = parsed.Question
			reply.Dimension = dim
			session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "assistant", Content: parsed.Question})
		} else {
			session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "assistant", Content: note})
		}
		return reply
	}

	if fullContent != "" {
		session.Convo.LastDim = dim
		session.Convo.QuestionCount++
		session.Convo.Messages = append(session.Convo.Messages, model.Message{Role: "assistant", Content: fullContent})
		return &model.CoachReply{
			Dimension:      dim,
			Question:       fullContent,
			ReflectionNote: parsed.ReflectionNote,
		}
	}

	return &model.CoachReply{}
}

func buildSessionSummary(session *model.Session) string {
	labels := map[string]string{
		"goal": "🎯 Mục tiêu", "current_state": "📍 Hiện trạng",
		"evidence": "📋 Gap", "constraint": "🔒 Rào cản", "motivation": "🚀 Hành động",
	}
	var lines []string
	for _, d := range data.Dims {
		if v := session.Convo.Dims[d]; v != "" {
			lines = append(lines, fmt.Sprintf("%s: %s", labels[d], v))
		}
	}
	if len(lines) == 0 {
		return "Đã ghi nhận thông tin từ cuộc trò chuyện."
	}
	return strings.Join(lines, "\n")
}

func buildLocalReflection(message, dim string) string {
	snippets := map[string]string{
		"goal":          "Mình ghi nhận mục tiêu của bạn.",
		"current_state": "Cảm ơn bạn đã chia sẻ về kinh nghiệm hiện tại.",
		"evidence":      "Tình huống bạn mô tả rất hữu ích.",
		"constraint":    "Mình hiểu rào cản bạn đang gặp.",
		"motivation":    "Ý định hành động của bạn là bước đầu tốt.",
	}
	prefix := snippets[dim]
	if prefix == "" {
		prefix = "Cảm ơn bạn."
	}
	trimmed := strings.TrimSpace(message)
	if len(trimmed) > 80 {
		trimmed = trimmed[:80] + "..."
	}
	return fmt.Sprintf("%s Để lên kế hoạch cụ thể, mình cần thêm chi tiết:", prefix)
}

// IsAnswerSufficient checks if user answer has enough concrete detail.
func IsAnswerSufficient(message, dimension string) bool {
	msg := strings.TrimSpace(message)
	if len(msg) < 20 {
		return false
	}

	words := len(strings.Fields(msg))
	if words < 12 {
		return false
	}

	lower := strings.ToLower(msg)
	vagueOnly := []string{"không biết", "không rõ", "bình thường", "ổn thôi", "tạm được", "chưa có", "không có gì"}
	vagueHits := 0
	for _, v := range vagueOnly {
		if strings.Contains(lower, v) {
			vagueHits++
		}
	}
	if vagueHits >= 2 {
		return false
	}

	concreteSignals := 0

	// Has numbers or time references
	if regexp.MustCompile(`\d`).MatchString(msg) {
		concreteSignals++
	}
	timeWords := []string{"tháng", "tuần", "ngày", "quý", "năm", "sprint", "q1", "q2", "q3", "q4"}
	for _, t := range timeWords {
		if strings.Contains(lower, t) {
			concreteSignals++
			break
		}
	}

	// Action verbs
	actionVerbs := []string{"lead", "dẫn", "present", "trình bày", "ship", "deliver", "propose", "đề xuất",
		"facilitate", "mentor", "review", "own", "đảm nhiệm", "phụ trách", "thực hiện", "triển khai"}
	for _, v := range actionVerbs {
		if strings.Contains(lower, v) {
			concreteSignals++
			break
		}
	}

	// Project/context words
	contextWords := []string{"dự án", "project", "team", "sprint", "feature", "metric", "stakeholder",
		"manager", "meeting", "initiative", "release", "sản phẩm", "khách hàng", "user"}
	for _, w := range contextWords {
		if strings.Contains(lower, w) {
			concreteSignals++
			break
		}
	}

	// Named entities: capitalized words or quoted text
	if regexp.MustCompile(`[A-Z][a-z]{2,}`).MatchString(msg) {
		concreteSignals++
	}

	minSignals := 2
	if dimension == "motivation" {
		minSignals = 3 // action dimension needs more specificity
	}

	return concreteSignals >= minSignals
}

func DetectLowAwareness(session *model.Session) bool {
	var userMsgs []string
	for _, m := range session.Convo.Messages {
		if m.Role == "user" {
			userMsgs = append(userMsgs, m.Content)
		}
	}
	if len(userMsgs) < 3 {
		return false
	}

	flags := 0
	for _, m := range userMsgs {
		if !IsAnswerSufficient(m, "") {
			flags++
		}
	}

	// All 3 recent answers insufficient
	if flags >= 3 {
		return true
	}

	blame := []string{"manager không", "công ty không", "team không", "không có cơ hội", "họ không", "sếp không"}
	blameCount := 0
	for _, m := range userMsgs {
		lower := strings.ToLower(m)
		for _, b := range blame {
			if strings.Contains(lower, b) {
				blameCount++
				break
			}
		}
	}
	return blameCount >= 2
}

// wordCount helper for unicode
func wordCount(s string) int {
	return len(strings.FieldsFunc(s, func(r rune) bool {
		return unicode.IsSpace(r)
	}))
}
