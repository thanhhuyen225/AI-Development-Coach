package service

import (
	"fmt"
	"strings"

	"github.com/ai-development-coach/backend/internal/model"
)

type FollowUpService struct {
	anthropic *AnthropicService
}

func NewFollowUpService(anthropic *AnthropicService) *FollowUpService {
	return &FollowUpService{anthropic: anthropic}
}

func (s *FollowUpService) StartFollowUp(session *model.Session) (string, error) {
	session.AppState = "FOLLOW_UP"

	var behTitles []string
	for _, b := range session.Committed {
		behTitles = append(behTitles, b.Title)
	}
	behs := strings.Join(behTitles, ", ")

	sys := fmt.Sprintf(`Bạn là AI Development Coach — check-in cam kết hành động.
Người dùng vừa commit %d behaviors: %s
Role: %s → %s | Strength: %s

Hỏi check-in ĐẦU TIÊN — cụ thể, thúc đẩy action:
1. Trong %d behaviors, cái nào họ sẽ làm TRONG 7 NGÀY TỚI? (hỏi tên behavior + ngày cụ thể)
2. Có obstacle nào chặn bước đầu tiên không?
3. Ai sẽ biết họ đã làm?

Ngắn gọn (3-4 câu), warm, tiếng Việt. KHÔNG generic. KHÔNG "Hãy chia sẻ thêm".`,
		len(session.Committed), behs,
		session.CurrentRole, session.TargetRole, session.Strength.Primary,
		len(session.Committed),
	)

	reply, err := s.anthropic.Call(
		[]model.Message{{Role: "user", Content: "Bắt đầu follow-up check-in"}},
		sys, 600,
	)
	if err != nil {
		if len(session.Committed) > 0 {
			reply = fmt.Sprintf(
				"Chu kỳ 60 ngày bắt đầu! Trong các hành vi bạn cam kết — \"%s\" — bạn dự định thực hiện lần đầu vào ngày nào tuần này? Ai sẽ là người cho bạn feedback sau lần đầu đó?",
				session.Committed[0].Title,
			)
		} else {
			reply = "Chu kỳ phát triển đã bắt đầu! Hành vi nào bạn sẽ thử đầu tiên trong 7 ngày tới?"
		}
	}

	session.FUHistory = append(session.FUHistory, model.Message{Role: "assistant", Content: reply})
	return reply, nil
}

func (s *FollowUpService) SendMessage(session *model.Session, message string) (string, error) {
	session.FUHistory = append(session.FUHistory, model.Message{Role: "user", Content: message})

	var behTitles []string
	for _, b := range session.Committed {
		behTitles = append(behTitles, "- "+b.Title+" ("+b.Frequency+")")
	}

	sys := fmt.Sprintf(`AI Development Coach — follow-up accountability.

Committed behaviors:
%s

Role: %s → %s | Strength: %s

NHIỆM VỤ:
- Nếu user đã làm: ghi nhận cụ thể + hỏi kết quả/feedback nhận được + gợi ý iteration
- Nếu chưa làm: không blame — hỏi obstacle cụ thể + đề xuất 1 bước nhỏ hơn trong 48h
- Luôn kết thúc bằng 1 câu hỏi có deadline rõ (tuần này, ngày mai...)
- Tiếng Việt, ngắn gọn, actionable. KHÔNG "Hãy chia sẻ thêm".`,
		strings.Join(behTitles, "\n"),
		session.CurrentRole, session.TargetRole, session.Strength.Primary,
	)

	reply, err := s.anthropic.Call(session.FUHistory, sys, 700)
	if err != nil {
		reply = "Tuần này bạn có thể thử 1 bước nhỏ nhất của hành vi đã cam kết — ví dụ 15 phút chuẩn bị hoặc nhắn 1 message cho stakeholder. Bạn chọn bước nào?"
	}

	session.FUHistory = append(session.FUHistory, model.Message{Role: "assistant", Content: reply})
	return reply, nil
}
