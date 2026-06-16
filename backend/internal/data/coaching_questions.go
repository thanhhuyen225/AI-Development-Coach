package data

import (
	"fmt"
	"strings"
)

// SignalType represents the type of signal detected in user response
type SignalType string

const (
	SignalVAGUE          SignalType = "vague"
	SignalCONTRADICTION  SignalType = "contradiction"
	SignalEXTERNALBLAME SignalType = "external_blame"
	SignalASSUMPTION     SignalType = "assumption"
	SignalEMOTIONAL      SignalType = "emotional"
	SignalSTRONGCLAIM    SignalType = "strong_claim"
)

// SignalDetectionRules contains patterns and bridging strategies
type SignalDetectionRules struct {
	Patterns  []string
	Bridge    string
	Dimension string // WHY / HOW / MISC
}

var SignalRules = map[SignalType]SignalDetectionRules{
	SignalVAGUE: {
		Patterns:  []string{"không biết", "bình thường", "ổn thôi", "tạm được", "chung chung", "không rõ"},
		Bridge:    "Tôi nghe thấy một câu khá chung — bạn có thể kể cho tôi nghe một ví dụ cụ thể gần đây không?",
		Dimension: "WHY",
	},
	SignalCONTRADICTION: {
		Patterns:  []string{"nhưng", "tuy nhiên", "mà", "một mặt"},
		Bridge:    "Tôi đang nghe hai điều song song — [X] và [Y]. Bạn có thể giúp tôi hiểu rõ hơn không?",
		Dimension: "WHY",
	},
	SignalEXTERNALBLAME: {
		Patterns:  []string{"sếp không", "công ty không", "team không", "họ không", "manager không", "không có cơ hội"},
		Bridge:    "Tôi hiểu môi trường đó không dễ... Điều gì trong tầm kiểm soát của bạn trong tình huống này?",
		Dimension: "HOW",
	},
	SignalASSUMPTION: {
		Patterns:  []string{"chắc do", "tôi biết", "chắc hẳn", "nhất định là", "tất nhiên là"},
		Bridge:    "Bạn đang có một nhận định khá rõ về điều đó. Điều đó đến từ đâu, tôi tự hỏi?",
		Dimension: "WHY",
	},
	SignalEMOTIONAL: {
		Patterns:  []string{"bí", "mệt", "sợ", "không chắc", "có lẽ", "không hợp", "nản", "chán", "lo lắng"},
		Bridge:    "Cái cảm giác [EMO] đó — tôi muốn ở lại với nó một chút. Điều này đang ảnh hưởng đến bạn như thế nào?",
		Dimension: "HOW",
	},
	SignalSTRONGCLAIM: {
		Patterns:  []string{"tôi làm tốt lắm", "rất giỏi", "hoàn hảo", "xuất sắc", "không có gì phải lo"},
		Bridge:    "Bạn nghe khá chắc chắn về điều đó... Tôi muốn thấy điều đó qua mắt bạn, bạn có thể kể một ví dụ cụ thể không?",
		Dimension: "WHY",
	},
}

// DimMeta describes what "sufficient" looks like for each coaching dimension.
type DimMeta struct {
	Label      string
	Icon       string
	Purpose    string
	MustHave   []string
	ProbeHints []string
}

var DimMetaMap = map[string]DimMeta{
	"goal": {
		Label:   "Mục tiêu cụ thể",
		Icon:    "ti-target",
		Purpose: "Xác định kết quả mong muốn có thể đo được và mốc thời gian",
		MustHave: []string{
			"Vị trí/scope cụ thể muốn đạt (không chung chung)",
			"Mốc thời gian (3 tháng / 6 tháng / 12 tháng)",
			"1 tiêu chí đo lường: impact, scope, hoặc trách nhiệm mới",
		},
		ProbeHints: []string{
			"Trong 6 tháng tới, bạn muốn nhìn thấy điều gì khác trong công việc hàng ngày?",
			"Ai sẽ là người đánh giá bạn đã đạt mục tiêu này?",
		},
	},
	"current_state": {
		Label:   "Hiện trạng",
		Icon:    "ti-activity",
		Purpose: "Nắm năng lực và phạm vi ảnh hưởng hiện tại",
		MustHave: []string{
			"1 dự án hoặc deliverable cụ thể gần đây",
			"Phạm vi trách nhiệm: team size, stakeholder, hoặc business metric",
			"Điểm mạnh đang thể hiện ở đâu trong công việc",
		},
		ProbeHints: []string{
			"Dự án gần nhất bạn tự hào nhất là gì? Bạn đóng vai trò gì trong đó?",
			"Kết quả đo lường được là gì (latency giảm, revenue, adoption, v.v.)?",
		},
	},
	"evidence": {
		Label:   "Bằng chứng gap",
		Icon:    "ti-clipboard-list",
		Purpose: "Tìm tình huống thực tế chứng minh khoảng cách năng lực",
		MustHave: []string{
			"Tình huống cụ thể (STAR: Situation + Task)",
			"Hành vi hoặc quyết định bạn đã làm",
			"Kết quả chưa như mong đợi và lý do",
		},
		ProbeHints: []string{
			"Chuyện gì đã xảy ra trong meeting/dự án đó? Bạn đã nói/làm gì?",
			"Nếu quay lại, bạn sẽ làm khác điều gì?",
		},
	},
	"constraint": {
		Label:   "Rào cản thực tế",
		Icon:    "ti-lock",
		Purpose: "Phân biệt thiếu kỹ năng, thiếu cơ hội, hay thiếu rõ kỳ vọng",
		MustHave: []string{
			"Rào cản cụ thể (không đổ lỗi chung chung)",
			"Ảnh hưởng tới hành động nào",
			"Đã thử gì để vượt qua chưa",
		},
		ProbeHints: []string{
			"Tuần trước bạn bị cản ở điểm nào cụ thể?",
			"Điều gì trong tầm kiểm soát của bạn vs ngoài tầm kiểm soát?",
		},
	},
	"motivation": {
		Label:   "Cam kết hành động",
		Icon:    "ti-heart",
		Purpose: "Chốt 1–2 hành động có thể bắt đầu trong 2 tuần tới",
		MustHave: []string{
			"Hành động đầu tiên cụ thể (động từ + đối tượng + tần suất)",
			"Ai sẽ biết / ai sẽ feedback",
			"Rủi ro hoặc điều kiện cần để bắt đầu",
		},
		ProbeHints: []string{
			"Tuần sau bạn có thể làm gì trong 30 phút để bắt đầu?",
			"Ai là người bạn sẽ nhờ feedback sau hành động đầu tiên?",
		},
	},
}

// DetectSignal analyzes user message and returns detected signal type
func DetectSignal(message string) (SignalType, string) {
	lower := strings.ToLower(message)
	
	for signalType, rules := range SignalRules {
		for _, pattern := range rules.Patterns {
			if strings.Contains(lower, pattern) {
				return signalType, rules.Bridge
			}
		}
	}
	return "", ""
}

// GetBridgeForSignal returns the bridge text for a detected signal
func GetBridgeForSignal(signalType SignalType) string {
	if rules, ok := SignalRules[signalType]; ok {
		return rules.Bridge
	}
	return ""
}

// GetDimensionForSignal returns the recommended dimension for a signal
func GetDimensionForSignal(signalType SignalType) string {
	if rules, ok := SignalRules[signalType]; ok {
		return rules.Dimension
	}
	return "WHY"
}

// CoachingQuestionTemplates — câu hỏi mở đầu theo dimension, inject role.
// Format mới: BRIDGE + QUESTION (mỗi response chỉ có đúng 2 phần)
func CoachingQuestionTemplates(currentRole, targetRole, strength string) map[string]string {
	return map[string]string{
		"goal": fmt.Sprintf(
			`BRIDGE: Bạn đang nhắm đến việc chuyển từ %s lên %s — đó là một bước tiến rõ ràng.
QUESTION: Điều KHÁC BIỆT CỤ THỂ nhất bạn muốn thấy trong công việc hàng ngày sau 6-12 tháng nữa là gì?
(Ví dụ: dẫn dắt 1 initiative cross-team, own metric X, present cho leadership...)?`,
			currentRole, targetRole,
		),
		"current_state": fmt.Sprintf(
			`BRIDGE: Để hiểu năng lực hiện tại của bạn, tôi muốn nhìn vào một tình huống cụ thể.
QUESTION: Kể 1 dự án/deliverable gần đây mà bạn tự hào nhất trong vai trò %s:
(1) Bạn làm gì cụ thể? (2) Phạm vi ảnh hưởng (team, stakeholder, metric)? (3) Điểm mạnh "%s" giúp bạn thế nào trong đó?`,
			currentRole, strength,
		),
		"evidence": fmt.Sprintf(
			`BRIDGE: Để chuẩn bị cho vị trí %s, tôi cần hiểu khoảng cách năng lực thực sự.
QUESTION: Kể 1 tình huống cụ thể trong 3 tháng qua khi bạn cảm thấy CHƯA ĐỦ để xử lý như một %s:
(1) Chuyện gì xảy ra? (2) Bạn đã làm/nói gì? (3) Kết quả ra sao và thiếu gì?`,
			targetRole, targetRole,
		),
		"constraint": fmt.Sprintf(
			`BRIDGE: Tôi hiểu rằng hành trình lên %s không phải lúc nào cũng suôn sẻ.
QUESTION: Điều gì đang THỰC SỰ cản bạn tiến lên?
Chọn và giải thích cụ thể: thiếu kỹ năng / thiếu cơ hội exposure / chưa rõ kỳ vọng level tiếp theo / thiếu feedback.
Bạn đã thử làm gì để vượt qua chưa?`,
			targetRole,
		),
		"motivation": fmt.Sprintf(
			`BRIDGE: Sau tất cả những gì chúng ta đã nói, điều quan trọng là bạn sẵn sàng bắt đầu.
QUESTION: Nếu bắt đầu hành trình lên %s ngay tuần sau, 1 HÀNH ĐỘNG CỤ THỂ đầu tiên bạn sẽ làm là gì?
Format: [Động từ] + [đối tượng] + [tần suất/thời điểm]. Ai sẽ biết và cho bạn feedback?`,
			targetRole,
		),
	}
}

// ProbeQuestionTemplates — câu hỏi đào sâu khi trả lời còn mơ hồ.
// Format mới: BRIDGE + QUESTION
func ProbeQuestionTemplates(dim, currentRole, targetRole string) string {
	probes := map[string]string{
		"goal": fmt.Sprintf(
			`BRIDGE: Câu trả lời của bạn còn khái quát, tôi muốn cụ thể hơn một chút.
QUESTION: Trong 6 tháng tới, bạn muốn OWN điều gì mà một %s hiện tại chưa làm?
Nêu 1 deliverable hoặc metric cụ thể.`,
			targetRole,
		),
		"current_state": fmt.Sprintf(
			`BRIDGE: Để hiểu rõ hơn năng lực hiện tại của bạn, tôi cần thêm chi tiết.
QUESTION: Dự án gần nhất bạn lead/contribute là gì? Team có mấy người? Kết quả đo được (số liệu, timeline, adoption)?`,
		),
		"evidence": fmt.Sprintf(
			`BRIDGE: Tôi muốn hiểu rõ tình huống đó hơn.
QUESTION: Hãy mô tả chi tiết hơn theo STAR: Tình huống (ai, project gì) → Việc bạn phải làm → Hành động bạn chọn → Kết quả và điều bạn thiếu để xử lý như %s.`,
			targetRole,
		),
		"constraint": fmt.Sprintf(
			`BRIDGE: Tôi muốn giúp bạn phân biệt rõ hơn giữa những gì trong tầm kiểm soát và ngoài tầm kiểm soát.
QUESTION: Rào cản bạn nêu — nó xuất hiện lần cuối KHI NÀO, ở đâu? Bạn kiểm soát được phần nào và phần nào cần hỗ trợ từ manager/mentor?`,
		),
		"motivation": fmt.Sprintf(
			`BRIDGE: Để hành động đầu tiên thực sự xảy ra, nó cần cụ thể và có người theo dõi.
QUESTION: Tuần sau (thứ mấy), bạn sẽ [làm gì] với [ai], trong bao lâu? Ai sẽ confirm bạn đã làm?`,
		),
	}
	if q, ok := probes[dim]; ok {
		return q
	}
	return probes["evidence"]
}

// ActionPlanTemplates - Templates for action plan generation
var ActionPlanTemplates = map[string]string{
	"60_days": `60 NGÀY HÀNH ĐỘNG

🎯 Tuần 1-2: Xây dựng nền tảng
- [Hành động cụ thể 1]
- [Hành động cụ thể 2]

📈 Tuần 3-4: Phát triển kỹ năng
- [Hành động cụ thể 3]
- [Hành động cụ thể 4]

🚀 Tuần 5-8: Thực hành & Feedback
- [Hành động cụ thể 5]
- [Hành động cụ thể 6]

🏆 Tuần 9-12: Đánh giá & Điều chỉnh
- [Hành động cụ thể 7]
- [Hành động cụ thể 8]`,
}
