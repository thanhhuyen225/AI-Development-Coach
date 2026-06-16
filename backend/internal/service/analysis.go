package service

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/ai-development-coach/backend/internal/data"
	"github.com/ai-development-coach/backend/internal/model"
)

type AnalysisService struct {
	anthropic *AnthropicService
	framework *FrameworkService
}

func NewAnalysisService(anthropic *AnthropicService, framework *FrameworkService) *AnalysisService {
	return &AnalysisService{anthropic: anthropic, framework: framework}
}

func (s *AnalysisService) RunAnalysis(session *model.Session) (*model.DevelopmentPlan, error) {
	session.AppState = "GAP_ANALYSIS"

	var convoLines []string
	for _, m := range session.Convo.Messages {
		role := "Coach"
		if m.Role == "user" {
			role = "Người dùng"
		}
		convoLines = append(convoLines, fmt.Sprintf("%s: %s", role, m.Content))
	}

	guidedStr := ""
	if len(session.GuidedSelections) > 0 {
		guidedStr = "\nNgữ cảnh bổ sung (Guided Mode): " + strings.Join(session.GuidedSelections, ", ")
	}

	frameworkStr := s.framework.BuildContextForUser(session.UserID, session.CurrentRole, session.TargetRole, session.CareerLevel)
	feedback := session.Feedback
	if feedback == "" {
		feedback = "Không có"
	}

	lvl := data.CareerLevels[session.CareerLevel]
	if lvl.Label == "" {
		lvl = data.CareerLevels["L1"]
	}

	prompt := fmt.Sprintf(`Phân tích gap và tạo development plan. Trả về JSON thuần (không markdown, không backtick):

{
  "gaps": [{"title":"Tên năng lực cụ thể từ framework","rootCause":"Nguyên nhân thực sự, không phải triệu chứng"}],
  "behaviors": [{
    "title":"Hành vi observable và measurable (động từ + object + tần suất)",
    "description":"Mô tả chi tiết cách thực hiện",
    "strengthLeverage":"Cách dùng %s để thực hiện behavior này",
    "frequency":"Tần suất cụ thể",
    "checkpointDays":14,
    "deadlineDays":60
  }],
  "courses": [{
    "courseName":"TÊN CHÍNH XÁC khóa học",
    "instructor":"Tên instructor chính xác",
    "platform":"Tên platform",
    "reason":"Lý do cụ thể liên quan đến gap",
    "competency":"Tên năng lực từ framework"
  }]
}

DỮ LIỆU:
- Vai trò: %s → %s
- Cấp độ: %s (%s)
- Điểm mạnh: %s (chính), %s (phụ)
- Feedback: %s
- Coaching conversation:
%s%s

%s

QUY TẮC NGHIÊM NGẶT — LỘ TRÌNH HÀNH ĐỘNG 60 NGÀY:
1. Tối đa 3 gaps, 3 behaviors, 3 courses
2. Gaps PHẢI mapping competency từ framework, rootCause = nguyên nhân gốc (không triệu chứng)
3. Behaviors = HÀNH ĐỘNG CỤ THỂ có thể bắt đầu tuần sau:
   - Format: [Động từ] + [đối tượng cụ thể] + [tần suất] + [ai feedback]
   - VD: "Schedule 1:1 với manager mỗi tháng để review career progress"
   - VD: "Lead 1 RFC review với ít nhất 1 engineer từ team khác mỗi sprint"
4. Mỗi behavior phải có firstStep trong description — bước đầu tiên trong 7 ngày tới
5. KHÔNG behavior chung chung: "cải thiện giao tiếp", "học thêm", "chủ động hơn"
6. Courses: chỉ khóa/sách có thật, liên kết trực tiếp với gap
7. strengthLeverage: nêu rõ cách dùng %s trong từng behavior
8. Ưu tiên behaviors tạo VISIBILITY với manager/stakeholder và MEASURABLE output
9. Context: công ty tech VN, level %s. Plan phải realistic với bandwidth IC hiện tại.`,
		session.Strength.Primary,
		session.CurrentRole, session.TargetRole,
		session.CareerLevel, lvl.Label,
		session.Strength.Primary, session.Strength.Secondary,
		feedback,
		strings.Join(convoLines, "\n"), guidedStr,
		frameworkStr,
		session.Strength.Primary,
		session.CareerLevel,
	)

	raw, err := s.anthropic.Call([]model.Message{{Role: "user", Content: prompt}}, "", 1600)
	if err != nil {
		plan := defaultPlan(session)
		session.Plan = *plan
		session.AppState = "DEVELOPMENT_PLAN"
		return plan, nil
	}

	plan, err := parsePlan(raw)
	if err != nil {
		plan = defaultPlan(session)
	}

	session.Plan = *plan
	session.AppState = "DEVELOPMENT_PLAN"
	return plan, nil
}

func parsePlan(raw string) (*model.DevelopmentPlan, error) {
	cleaned := strings.TrimSpace(raw)
	cleaned = strings.ReplaceAll(cleaned, "```json", "")
	cleaned = strings.ReplaceAll(cleaned, "```", "")
	cleaned = strings.TrimSpace(cleaned)

	var plan model.DevelopmentPlan
	if err := json.Unmarshal([]byte(cleaned), &plan); err != nil {
		return nil, err
	}
	return &plan, nil
}

func defaultPlan(session *model.Session) *model.DevelopmentPlan {
	return &model.DevelopmentPlan{
		Gaps: []model.Gap{
			{Title: "Technical Leadership & Scope Expansion", RootCause: "Chưa có cơ hội demonstrate impact ngoài phạm vi team — thiếu visibility với leadership và cross-functional stakeholders"},
			{Title: "Stakeholder Influence", RootCause: "Chưa build được trust với non-technical stakeholders, khó translate technical decisions thành business value"},
		},
		Behaviors: []model.Behavior{
			{
				Title:            "Dẫn dắt 1 cross-team technical discussion mỗi sprint",
				Description:      "Propose và facilitate một buổi technical review/RFC với ít nhất 1 người từ team khác. Document kết quả và send summary.",
				StrengthLeverage: fmt.Sprintf("Dùng %s để frame discussion theo hướng strategic — đặt câu hỏi về long-term impact thay vì chỉ tactical.", session.Strength.Primary),
				Frequency:        "1 lần/2 tuần", CheckpointDays: 14, DeadlineDays: 60,
			},
			{
				Title:            "Present 1 technical proposal mỗi tháng cho manager",
				Description:      "Chuẩn bị 1-page proposal cho một technical decision, bao gồm trade-offs và business impact. Present trực tiếp.",
				StrengthLeverage: fmt.Sprintf("Leverage %s để structure proposal theo business outcomes, không chỉ technical specs.", session.Strength.Primary),
				Frequency:        "1 lần/tháng", CheckpointDays: 14, DeadlineDays: 60,
			},
			{
				Title:            "Request structured feedback sau mỗi stakeholder interaction",
				Description:      "Sau mỗi meeting với stakeholder, send follow-up email tóm tắt và hỏi 1 câu feedback cụ thể.",
				StrengthLeverage: fmt.Sprintf("Dùng %s để tổng hợp feedback thành patterns và improvement areas.", session.Strength.Primary),
				Frequency:        "Sau mỗi stakeholder meeting", CheckpointDays: 14, DeadlineDays: 60,
			},
		},
		Courses: []model.Course{
			{CourseName: "The Staff Engineer's Path", Instructor: "Tanya Reilly", Platform: "O'Reilly / Sách", Reason: "Roadmap chi tiết cho IC leadership path, áp dụng trực tiếp cho tech companies VN", Competency: "Technical Leadership"},
			{CourseName: "Influence Without Authority", Instructor: "Allan Cohen & David Bradford", Platform: "Sách", Reason: "Framework thực tiễn để influence stakeholders không có direct authority", Competency: "Stakeholder Influence"},
			{CourseName: "Communication for Engineers", Instructor: "Lara Hogan", Platform: "larahogan.me / Sách", Reason: "Tactical guide về engineering communication — proposals, RFCs, presentations", Competency: "Engineering Communication"},
		},
	}
}
