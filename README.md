# AI Development Coach
> Your 24/7 Growth Partner — Clarity today. Growth tomorrow.

---

## Problem

Nhân viên không biết mình đang thiếu gì để lên level tiếp theo. Feedback từ manager thường chung chung, khó chuyển thành hành động cụ thể. Development plan thì dài và không ai thực hiện đến cùng.

Ba bài toán cốt lõi:
- **Nhân viên** không thể translate feedback thành behavior change cụ thể
- **Manager** tốn nhiều thời gian coaching mà không scale được
- **L&D team** không cá nhân hóa được ở quy mô lớn và không đo được hiệu quả thực sự

---

## Users

**Primary**
- Junior, Mid-level, Senior employee tại các công ty tech (VNG, ZaloPay, MoMo, Shopee, Tiki) muốn phát triển lên level tiếp theo

**Secondary**
- New Hire cần onboard và ramp up nhanh
- Internal Mobility Candidate chuẩn bị chuyển vị trí

---

## Solution

AI Development Coach là conversational AI agent dẫn dắt một coaching session thực sự — không phải form điền, không phải survey — và tạo ra personalized 60-day behavior change plan trong 15 phút.

**Cách agent hoạt động:**

1. User nhập current role và target role
2. Hoàn thành Clifton Strengths quick discovery (4 câu hỏi)
3. AI coaching conversation với rule-based drill-down (tối đa 5 câu)
4. Agent tự detect low self-awareness → auto-switch sang Guided Reflection mode
5. Gap analysis dựa trên competency framework + strength profile + manager feedback
6. Output: 3 critical behavior changes + 3 curated learning resources + 60-day roadmap
7. Follow-up check-in tại Day 14 và Day 60

**Giá trị mang lại:**

Agent chạy hàng ngày giúp nhân viên biết chính xác cần thay đổi gì ngay tuần này — thay vì chờ performance review 6 tháng một lần. Manager tiết kiệm thời gian coaching 1-1. L&D đo được behavior change thực tế theo từng cá nhân, không phải điểm số hay số lượt học.

---

## How to Run

**Yêu cầu**
- Trình duyệt hiện đại bất kỳ
- Anthropic API key (Claude Sonnet)

**Chạy ngay — không cần cài đặt**

```bash
# 1. Clone repo
git clone https://github.com/your-repo/ai-development-coach.git

# 2. Mở file trực tiếp trên trình duyệt
open ai_development_coach_v2.html
```

> Không cần server. Không cần npm install. Không cần build. Mở file là chạy được.

**Cài API Key**

Nếu chạy ngoài môi trường claude.ai, thêm key vào phần fetch header trong script:

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_API_KEY_HERE',
  'anthropic-version': '2023-06-01'
}
```

---

## What to Customize

| Phần | Vị trí trong code | Cách chỉnh |
|------|-------------------|------------|
| Coaching logic & signal rules | `buildCoachSysPrompt()` | Sửa drill-down rules, forbidden phrases, dimension priority |
| Câu hỏi Strength Discovery | `SQS` array | Thay bằng câu hỏi Clifton của tổ chức bạn |
| Guided Mode checklist | `GUIDED_OPTS` array | Thêm/bớt options phù hợp với blockers phổ biến trong công ty |
| Competency framework | Prompt trong `runAnalysis()` | Inject framework nội bộ của công ty vào context |
| Danh sách khóa học | Trong analysis prompt | Thêm curated catalog để giảm hallucination risk |
| Follow-up questions | `startFollowup()` / `sendFU()` | Điều chỉnh checkpoint timing và style câu hỏi |
| Màu sắc thương hiệu | CSS variables đầu file | Thay `#534AB7` bằng brand color của tổ chức |
| Ngôn ngữ | Toàn bộ prompt strings | Hiện tại tiếng Việt — swap sang tiếng Anh hoặc ngôn ngữ khác |

---

## Built With

- Vanilla HTML / CSS / JavaScript — zero dependencies
- Anthropic Claude Sonnet API via GreenNode AgentBase
- Tabler Icons (CDN)

---

*Compatible with Claude, GPT-4, Gemini hoặc bất kỳ LLM nào hỗ trợ system prompt.*
