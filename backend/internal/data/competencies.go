package data

import "github.com/ai-development-coach/backend/internal/model"

var CareerLevels = map[string]struct {
	Label string
	Focus string
}{
	"L1": {Label: "Individual Contributor", Focus: "Functional expertise, communication, critical thinking, problem solving. Scope: lead themselves."},
	"L2": {Label: "First-line Manager", Focus: "Coaching, delegation, EQ, conflict management. Scope: lead a team of ICs."},
	"L3": {Label: "Middle Manager", Focus: "Systems thinking, strategic planning, stakeholder influence, managing managers. Scope: lead a function or department."},
	"L4": {Label: "Company Leader", Focus: "Enterprise leadership, strategic decisions, external influence, org design. Scope: lead multiple functions or verticals."},
}

type CoreCompetency struct {
	Name   string
	Levels map[string]string
}

var CoreCompetencies = []CoreCompetency{
	{Name: "Action orientation", Levels: map[string]string{"Competent": "Drives projects, overcomes obstacles."}},
	{Name: "Adaptability", Levels: map[string]string{"Competent": "Anticipates change, prepares teams."}},
	{Name: "Critical thinking", Levels: map[string]string{"Competent": "Evaluates complex problems."}},
	{Name: "Strategic thinking", Levels: map[string]string{"Competent": "Crafts multi-driver strategies."}},
	{Name: "Impact and influence", Levels: map[string]string{"Competent": "Persuades peers and managers."}},
	{Name: "Ownership", Levels: map[string]string{"Competent": "Proactively addresses issues, drives improvements."}},
	{Name: "Innovation", Levels: map[string]string{"Competent": "Leads team innovation."}},
	{Name: "Leadership", Levels: map[string]string{"Competent": "Leads teams, sets strategic goals."}},
}

type FunctionalCompetency struct {
	Name string
	Desc string
}

var FunctionalCompetencies = map[string][]FunctionalCompetency{
	"Engineering": {
		{Name: "Quality assurance", Desc: "Ensure products/services meet or exceed standards."},
		{Name: "Project planning", Desc: "Develop and implement plans for achieving project goals."},
		{Name: "Design and analysis", Desc: "Analyze problems, design solutions, evaluate impact."},
		{Name: "Technical writing", Desc: "Communicate technical information clearly."},
		{Name: "Programming language", Desc: "Write code in various languages for software development and automation."},
		{Name: "Database management", Desc: "Design, implement, and optimize databases."},
		{Name: "Cloud computing", Desc: "Use cloud technologies for data and application management."},
		{Name: "Web development", Desc: "Create responsive and visually appealing web applications."},
		{Name: "System design", Desc: "Architect scalable, reliable systems appropriate for scale."},
	},
	"Product management": {
		{Name: "User research", Desc: "Gather and analyze user data to plan design and development."},
		{Name: "Roadmapping", Desc: "Define strategic vision and direction for a product."},
		{Name: "Stakeholder management", Desc: "Engage and collaborate with internal and external stakeholders."},
		{Name: "Agile and product management frameworks", Desc: "Apply agile methodologies and product management frameworks."},
		{Name: "Negotiation", Desc: "Make trade-offs and reach agreements to ensure product success."},
		{Name: "Product analytics", Desc: "Analyze data related to product usage and customer behavior."},
		{Name: "Wireframing tools", Desc: "Use wireframing and prototyping tools for product interfaces."},
	},
	"Marketing": {
		{Name: "Brand strategy and positioning", Desc: "Develop and execute brand strategies aligned with business objectives."},
		{Name: "Content strategy", Desc: "Develop strategy for creating and distributing valuable content."},
		{Name: "Social media marketing", Desc: "Create and implement strategies to leverage social media platforms."},
		{Name: "Marketing analytics", Desc: "Track, analyze, and interpret data related to marketing activities."},
		{Name: "Creativity and innovation", Desc: "Generate original and impactful campaigns."},
		{Name: "Generative AI", Desc: "Use generative AI for marketing insights and innovative solutions."},
	},
	"Sales": {
		{Name: "Pipeline management and account planning", Desc: "Create and optimize the entire sales plan."},
		{Name: "Lead generation", Desc: "Identify and attract potential customers through various strategies."},
		{Name: "Negotiation", Desc: "Discuss strategically to reach mutually beneficial agreements."},
		{Name: "Product knowledge", Desc: "Understand product features and communicate them effectively."},
		{Name: "Market knowledge", Desc: "Understand market trends, competitors, and customer demographics."},
		{Name: "Customer relationship management (CRM)", Desc: "Effectively use CRM software to manage customer interactions."},
	},
	"HR / L&D": {
		{Name: "Talent acquisition", Desc: "Identify, attract, and hire top talent through effective recruitment."},
		{Name: "Learning and development", Desc: "Design, deliver, and evaluate learning programs."},
		{Name: "Talent management", Desc: "Identify, attract, develop, and retain high-performing individuals."},
		{Name: "Change management", Desc: "Support transitions and implement changes effectively."},
		{Name: "Employee relations", Desc: "Maintain positive relationships between employer and employees."},
		{Name: "Data analysis", Desc: "Collect, process, and analyze HR data to inform decisions."},
	},
	"Customer Success": {
		{Name: "Product and service knowledge", Desc: "Understand, communicate, and support company products."},
		{Name: "Customer focus", Desc: "Understand and anticipate customer needs and provide excellent service."},
		{Name: "Upselling and cross-selling", Desc: "Offer additional products or services to customers."},
		{Name: "Customer outreach", Desc: "Engage proactively with customers to understand their needs."},
		{Name: "Customer success analytics", Desc: "Analyze data related to customer interactions, satisfaction, and lifecycle."},
		{Name: "Customer journey mapping", Desc: "Create detailed maps of the customer journey."},
	},
}

var DomainMap = map[int]string{
	0: "Strategic Thinking",
	1: "Influencing",
	2: "Relationship Building",
	3: "Executing",
}

var StrengthQuestions = []model.StrengthQuestion{
	{
		ID:   "q1",
		Text: "Khi nhận một yêu cầu mới chưa rõ scope, bạn thường bắt đầu bằng cách nào?",
		Opts: []string{
			"Phân tích dữ liệu, tìm pattern và root cause trước khi đề xuất",
			"Thuyết phục stakeholder align hướng đi trước khi triển khai",
			"Kết nối đúng người có kinh nghiệm để học nhanh",
			"Lập plan, chia task và đảm bảo tiến độ ngay",
		},
	},
	{
		ID:   "q2",
		Text: "Đồng nghiệp hoặc manager thường nhờ bạn vì điều gì nhất?",
		Opts: []string{
			"Tư vấn chiến lược, nhìn big picture và trade-off dài hạn",
			"Present ý tưởng, thuyết phục và đại diện team trước leadership",
			"Giải quyết conflict, kết nối các bên và giữ team ổn định",
			"Đảm bảo chất lượng deliverable và deadline được giữ",
		},
	},
	{
		ID:   "q3",
		Text: "Điều gì khiến bạn hứng thú nhất trong công việc hàng ngày?",
		Opts: []string{
			"Khám phá giải pháp mới, học domain chưa biết",
			"Tạo ảnh hưởng tới quyết định và dẫn dắt hướng đi",
			"Xây dựng trust với đồng đội và stakeholder",
			"Thấy kết quả cụ thể: ship feature, đạt metric, hoàn thành cam kết",
		},
	},
	{
		ID:   "q4",
		Text: "Trong dự án nhóm gần đây, bạn đóng vai trò nào rõ nhất?",
		Opts: []string{
			"Người đặt câu hỏi chiến lược và định hướng kỹ thuật/sản phẩm",
			"Người pitch, advocate và thuyết phục các bên liên quan",
			"Người kết nối team, mentor junior và giải quyết friction",
			"Người drive execution, review quality và unblock tiến độ",
		},
	},
}

var GuidedOptions = []string{
	"Chưa có cơ hội lead initiative hoặc dự án có visibility với leadership",
	"Chưa tự tin trình bày/đàm phán với stakeholder non-tech hoặc cấp cao",
	"Không rõ tiêu chí promotion/level tiếp theo — chưa có career conversation với manager",
	"Thiếu kỹ năng cụ thể (system design, stakeholder mgmt, data, people mgmt...)",
	"Làm tốt trong team nhưng chưa demonstrate impact cross-team hoặc business-level",
	"Ít nhận feedback có cấu trúc — không biết mình đang đi đúng hướng chưa",
	"Quá tải task hiện tại — không có bandwidth cho việc phát triển năng lực mới",
	"Chưa có mentor/sponsor trong tổ chức hỗ trợ career path",
}

var Dims = []string{"goal", "current_state", "evidence", "constraint", "motivation"}

var DimLabels = map[string]string{
	"goal": "Mục tiêu cụ thể", "current_state": "Hiện trạng",
	"evidence": "Bằng chứng gap", "constraint": "Rào cản", "motivation": "Cam kết hành động",
}
