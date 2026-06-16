import os
import json
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime
from dotenv import load_dotenv
import database as db
from langchain_openai import ChatOpenAI

load_dotenv()

LLM_MODEL = os.environ.get("LLM_MODEL", "minimax/minimax-m2.5")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")

llm = None
if LLM_API_KEY:
    try:
        llm = ChatOpenAI(
            model=LLM_MODEL,
            base_url=LLM_BASE_URL,
            api_key=LLM_API_KEY,
        )
    except Exception as e:
        print(f"[WARN] LLM init failed: {e}")

# Find the correct directory
OUT_DIR = None
for d in ['/app/out', './out', 'out', os.path.join(os.path.dirname(__file__), 'out')]:
    if os.path.exists(d):
        OUT_DIR = d
        break
if not OUT_DIR:
    OUT_DIR = os.path.dirname(__file__)

print(f"[STARTUP] Serving from: {OUT_DIR}")
print(f"[STARTUP] Files: {os.listdir(OUT_DIR) if os.path.exists(OUT_DIR) else 'N/A'}")

ROLE_REQUIREMENTS = {
    "Senior Developer": {
        "technical": {"System Design": 75, "Code Quality": 85, "Testing": 70, "Databases": 75, "APIs": 80},
        "soft": {"Mentoring": 40, "Communication": 70, "Problem Solving": 85},
        "tools": {"Git": 90, "CI/CD": 70, "Cloud": 60, "Docker": 65},
        "timeline": "6-12 tháng"
    },
    "Tech Lead": {
        "technical": {"System Design": 85, "Code Quality": 90, "Architecture": 80, "Performance": 75},
        "soft": {"Mentoring": 80, "Communication": 90, "Team Leadership": 85, "Conflict Resolution": 75},
        "tools": {"Project Management": 70, "Documentation": 85},
        "timeline": "12-18 tháng"
    },
    "Staff Engineer": {
        "technical": {"System Design": 90, "Architecture": 90, "Performance": 85, "Security": 80},
        "soft": {"Mentoring": 90, "Communication": 90, "Technical Writing": 85},
        "tools": {"Cross-functional": 85, "Documentation": 90},
        "timeline": "18-24 tháng"
    },
    "Software Architect": {
        "technical": {"System Design": 95, "Architecture": 95, "Security": 90, "Cloud Architecture": 90},
        "soft": {"Strategic Planning": 90, "Communication": 95, "Influencing": 90},
        "tools": {"Enterprise Tools": 85, "Documentation": 95},
        "timeline": "24-36 tháng"
    },
    "Engineering Manager": {
        "technical": {"System Design": 70, "Code Quality": 75},
        "soft": {"Team Leadership": 95, "Communication": 95, "Conflict Resolution": 90, "Hiring": 85},
        "tools": {"Project Management": 90, "HR Systems": 75},
        "timeline": "12-24 tháng"
    }
}

SIGNAL_PATTERNS = {
    "VAGUE": ["đôi khi", "thỉnh thoảng", "nói chung", "thường thì", "thỉnh thoảng", "lúc nào cũng", "mọi lúc"],
    "CONTRADICTION": ["nhưng", "tuy nhiên", "mà", "thế nhưng", "nhưng mà", "một mặt... mặt khác"],
    "EXTERNAL_BLAME": ["sếp không", "công ty không", "đồng nghiệp không", "không ai", "chẳng ai", "họ luôn", "nó không cho phép"],
    "ASSUMPTION": ["chắc là", "tôi biết", "chắc chắn là", "tôi nghĩ là", "có lẽ", "hẳn là", "chắc do"],
    "EMOTIONAL": ["bí", "mệt", "sợ", "không chắc", "lo lắng", "nản", "chán", "thất vọng", "tức giận", "buồn", "sợ hãi", "hoang mang", "bất lực"],
    "STRONG_CLAIM": ["luôn luôn", "không bao giờ", "tất cả", "chẳng có gì", "hoàn toàn", "tuyệt đối"]
}

def personalize_response(text: str, user_name: str) -> str:
    if not user_name:
        return text
    name = user_name.strip()
    replacements = [
        ("Bạn", name),
        ("bạn", name.lower() if len(name.split()) > 1 else name),
        ("của bạn", f"của {name.lower() if len(name.split()) > 1 else name}"),
        ("của Bạn", f"của {name}"),
    ]
    result = text
    for old, new in replacements:
        result = result.replace(old, new)
    return result

def detect_signal(message: str) -> str:
    msg_lower = message.lower()
    
    for signal, patterns in SIGNAL_PATTERNS.items():
        for pattern in patterns:
            if pattern in msg_lower:
                return signal
    
    if any(phrase in msg_lower for phrase in ["tại sao", "vì sao", "tại sao lại", "nguyên nhân là gì"]):
        return "WHY"
    if any(phrase in msg_lower for phrase in ["như thế nào", "làm sao", "làm cách nào", "sao để"]):
        return "HOW"
        
    return "NEUTRAL"

def generate_bridge(message: str, signal: str, user_name: str = "") -> str:
    if signal == "VAGUE":
        return f"Tôi nghe thấy một góc nhìn khá chung — bạn có thể kể cho tôi nghe một tình huống cụ thể gần đây không?"
    
    if signal == "CONTRADICTION":
        return f"Tôi đang nghe hai điều hơi khác nhau trong những gì bạn chia sẻ — có thể làm rõ hơn không?"
    
    if signal == "EXTERNAL_BLAME":
        return f"Tôi hiểu — có nhiều thứ ngoài tầm kiểm soát của bạn trong bức tranh đó."
    
    if signal == "ASSUMPTION":
        return f"Bạn đang có một nhận định khá rõ về chuyện này — điều đó đến từ đâu vậy?"
    
    if signal == "EMOTIONAL":
        return f"Cái cảm giác {message.split()[0] if message.split() else ''} đó — tôi muốn ở lại với nó một chút. Bạn đang cảm thấy thế nào trong chuyện này?"
    
    if signal == "STRONG_CLAIM":
        return f"Bạn nghe khá chắc chắn về điều đó — tôi tò mò điều gì đã khiến bạn nghĩ vậy?"
    
    if signal == "WHY":
        return f"Tôi muốn hiểu rõ hơn về điều bạn vừa chia sẻ..."
    
    if signal == "HOW":
        return f"Điều đó đang ảnh hưởng đến bạn như thế nào?"
    
    return f"Cảm ơn bạn đã chia sẻ. Tôi muốn hiểu thêm về context xung quanh chuyện này."

def generate_question(message: str, signal: str, conversation_history: list) -> str:
    recent_signals = [detect_signal(m.get("content", "")) for m in conversation_history[-3:]]
    
    if signal == "VAGUE":
        return "Bạn có thể kể cho tôi nghe một ví dụ cụ thể gần đây không?"
    
    if signal == "CONTRADICTION":
        return "Điều gì đang xảy ra trong hai tình huống đó vậy?"
    
    if signal == "EXTERNAL_BLAME":
        return "Trong tình huống đó, bạn đang cảm thấy mình có control được gì?"
    
    if signal == "ASSUMPTION":
        return "Bạn dựa vào đâu để kết luận vậy? Có điều gì cụ thể đã xảy ra?"
    
    if signal == "EMOTIONAL":
        return "Điều này đang ảnh hưởng đến bạn trong công việc và cuộc sống hàng ngày như thế nào?"
    
    if signal == "STRONG_CLAIM":
        return "Từ kinh nghiệm nào mà bạn rút ra điều đó?"
    
    if signal == "WHY" or (recent_signals.count("WHY") < 2):
        questions = [
            "Điều đó tạo ra ảnh hưởng gì với bạn?",
            "Bạn nghĩ gốc rễ của vấn đề này là gì?",
            "Có sự kiện nào cụ thể dẫn đến điều này không?"
        ]
        import random
        return random.choice(questions)
    
    if signal == "HOW" or (recent_signals.count("HOW") < 2):
        questions = [
            "Bạn đang xử lý điều đó như thế nào?",
            "Điều này đang ảnh hưởng đến công việc và mối quan hệ với đồng nghiệp ra sao?",
            "Bạn đã thử cách nào chưa?"
        ]
        import random
        return random.choice(questions)
    
    return "Bạn có muốn tôi giúp bạn tổng hợp lại những gì chúng ta đã thảo luận không?"

def should_provide_actionable(content: str) -> bool:
    action_signals = [
        "tôi muốn", "tôi sẽ", "tôi cần", "tôi quyết định",
        "bắt đầu", "thay đổi", "cải thiện", "phát triển",
        "lộ trình", "kế hoạch", "mục tiêu", "sẵn sàng"
    ]
    return any(signal in content.lower() for signal in action_signals)

def generate_gap_analysis(user_profile, skills_progress):
    target_role = user_profile.get("target_role", "Senior Developer")
    current_level = user_profile.get("current_level", "mid")
    target_req = ROLE_REQUIREMENTS.get(target_role, ROLE_REQUIREMENTS["Senior Developer"])
    
    base_skills = {}
    for skill in skills_progress:
        base_skills[skill["skill_name"]] = skill["current_value"]
    
    if not base_skills:
        if "JavaScript" in user_profile.get("main_stack", ""):
            base_skills = {"JavaScript/TypeScript": 50, "React/Next.js": 45, "Node.js": 40}
        elif "Python" in user_profile.get("main_stack", ""):
            base_skills = {"Python": 50, "Django/FastAPI": 35, "APIs": 40}
        else:
            base_skills = {"Programming": 40}
    
    all_skills = {}
    for cat in target_req:
        if cat == "timeline":
            continue
        for skill, target in target_req[cat].items():
            all_skills[skill] = target
    
    result = f"""📊 **PHÂN TÍCH KHOẢNG TRỐNG KỸ NĂNG - {target_role}**

**Level hiện tại:** {current_level.title()} → **Mục tiêu:** {target_role}
**Thời gian dự kiến:** {target_req.get('timeline', '6-12 tháng')}

---

### 🔴 Khoảng trống quan trọng (Ưu tiên học trước)

"""
    
    critical = []
    for skill, current in base_skills.items():
        if not isinstance(current, int):
            continue
        target = all_skills.get(skill, 70)
        gap = target - current
        if gap > 15:
            critical.append((skill, current, target, gap))
    
    if not critical:
        result += "🎉 Tuyệt vời! Bạn đã có nền tảng tốt. Hãy tập trung vào các kỹ năng nâng cao!\n"
    else:
        for skill, current, target, gap in sorted(critical, key=lambda x: x[3], reverse=True)[:5]:
            result += f"• **{skill}**: {current}% → {target}% (Cần cải thiện: {gap}%)\n"
    
    result += f"""

### 🎯 Lộ trình học tập đề xuất

**Giai đoạn 1 (Tuần 1-4): Nền tảng"""
    
    if "System Design" in str(target_req.get("technical", {})):
        result += """
- Học System Design cơ bản (CAP theorem, distributed systems)
- Thực hành thiết kế API và databases"""
    
    result += f"""

**Giai đoạn 2 (Tuần 5-12): Kỹ năng cốt lõi
- Xây dựng dự án production-ready
- Master {user_profile.get('main_stack', 'Tech stack').split('(')[0].strip()}
- Học testing và CI/CD"""

    result += f"""

**Giai đoạn 3 (Tuần 13-24): Nâng cao
- Kỹ năng chuyên sâu cho {target_role}
- Architecture và design patterns
- Leadership và communication

---

💡 **Bước tiếp theo:** Bạn có muốn tôi tạo lịch học chi tiết hàng tuần không?
"""
    
    return result

def generate_roadmap(user_profile):
    target_role = user_profile.get("target_role", "Senior Developer")
    target_req = ROLE_REQUIREMENTS.get(target_role, ROLE_REQUIREMENTS["Senior Developer"])
    
    roadmap = f"""🗺️ **LỘ TRÌNH HỌC TẬP ĐỂ TRỞ THÀNH {target_role.upper()}**

**Thời gian:** {target_req.get('timeline', '6-12 tháng')}

---
"""
    
    phases = [
        ("Giai đoạn 1: Nền tảng (Tháng 1-2)", [
            "Nắm vững core concepts của tech stack",
            "Học System Design basics",
            "Thực hành data structures và algorithms",
            "Đọc 'Clean Code' và 'Design Patterns'"
        ]),
        ("Giai đoạn 2: Kỹ năng cốt lõi (Tháng 3-4)", [
            "Xây dựng 2-3 dự án production-grade",
            "Học testing và test-driven development",
            "Master CI/CD pipelines",
            "Bắt đầu contribute open source"
        ]),
        ("Giai đoạn 3: Nâng cao (Tháng 5-6)", [
            "Deep dive vào architecture",
            "Học microservices patterns",
            "Practice system design interviews",
            "Mentor junior developers"
        ])
    ]
    
    if target_role in ["Tech Lead", "Engineering Manager"]:
        phases.extend([
            ("Giai đoạn 4: Leadership (Tháng 7-9)", [
                "Học project management fundamentals",
                "Practice giving presentations",
                "Study conflict resolution",
                "Lead a small team"
            ]),
            ("Giai đoạn 5: Mastery (Tháng 10-12)", [
                "Strategic planning skills",
                "Hiring và team building",
                "Performance management",
                "Cross-team communication"
            ])
        ])
    
    for phase_title, items in phases:
        roadmap += f"""### {phase_title}

"""
        for item in items:
            roadmap += f"✅ {item}\n"
        roadmap += "\n"
    
    roadmap += """---

🎯 **Theo dõi tiến độ:**
- Hoàn thành mục tiêu hàng tuần
- Track cải thiện kỹ năng
- Nhận feedback 1-on-1

Bạn có muốn tôi tạo lịch học chi tiết hàng tuần không?
"""
    
    return roadmap

CONVERSATION_STAGES = {
    "WELCOME": 0,
    "DISCOVERY": 1,
    "DEEP_DIVE": 2,
    "CHALLENGES": 3,
    "MOTIVATION": 4,
    "ANALYSIS": 5,
}

DISCOVERY_QUESTIONS = {
    0: "Chào {name}! Rất vui được gặp bạn. Bạn có thể kể cho tôi nghe về hành trình nghề nghiệp của mình không? Bạn đã bắt đầu như thế nào và hiện tại đang ở đâu?",
    1: "Thú vị! Vậy điều gì thúc đẩy bạn muốn phát triển hơn nữa? Điều gì khiến bạn nghĩ đến việc thay đổi hay nâng cấp kỹ năng?",
    2: "Bạn có thể mô tả một ngày làm việc điển hình của bạn không? Trong công việc, bạn dành phần lớn thời gian cho những gì?",
    3: "Khi bạn nghĩ về mục tiêu nghề nghiệp trong 1-2 năm tới, điều đầu tiên xuất hiện trong đầu bạn là gì?",
    4: "Bạn đã bao giờ cảm thấy 'bí' hay không biết phải học gì tiếp theo chưa? Điều gì khiến bạn cảm thấy như vậy?",
}

def generate_smart_question(message: str, chat_history: list, user_profile: dict, stage: int) -> str:
    """Generate intelligent follow-up questions based on user's response."""
    if not llm:
        return DISCOVERY_QUESTIONS.get(stage, DISCOVERY_QUESTIONS[0]).format(name=user_profile.get("first_name", "bạn"))
    
    history_text = ""
    for msg in chat_history[-6:]:
        role = "User" if msg.get("role") == "user" else "AI"
        history_text += f"{role}: {msg.get('content', '')}\n"
    
    profile_info = f"""
Current profile:
- Level: {user_profile.get('current_level', 'unknown')}
- Target: {user_profile.get('target_role', 'unknown')}
- Stack: {user_profile.get('main_stack', 'unknown')}
- Challenges: {user_profile.get('challenges', 'unknown')}
"""
    
    prompt = f"""Bạn là một Career Coach chuyên nghiệp. Nhiệm vụ của bạn là đặt một câu hỏi DUY NHẤT để tiếp tục khám phá về user.

{profile_info}
Lịch sử trò chuyện:
{history_text}

User vừa trả lời: "{message}"

YÊU CẦU:
1. Đặt ĐÚNG 1 câu hỏi DUY NHẤT dựa trên những gì user vừa chia sẻ
2. Câu hỏi phải:
   - Xác nhận bạn đã hiểu điều user nói (reflect)
   - Đào sâu hơn vào một khía cạnh cụ thể
   - Không hỏi quá nhiều thông tin cùng lúc
3. KHÔNG dùng ** để format
4. KHÔNG hỏi về level, target, stack trực tiếp - hãy để user tự chia sẻ tự nhiên
5. Ngôn ngữ tự nhiên, thân thiện như đang nói chuyện với bạn bè
6. Câu hỏi phải mở, không phải yes/no

Trả lời bằng tiếng Việt, chỉ có câu hỏi, không có gì khác:"""

    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"[WARN] Smart question failed: {e}")
        return DISCOVERY_QUESTIONS.get(stage, DISCOVERY_QUESTIONS[0]).format(name=user_profile.get("first_name", "bạn"))

def should_move_to_analysis(chat_history: list, user_profile: dict) -> bool:
    """Check if we have enough information to proceed to analysis."""
    profile = user_profile or {}
    history_text = " ".join([msg.get("content", "").lower() for msg in chat_history])
    
    has_goal = bool(profile.get("target_role")) or any(kw in history_text for kw in ["muốn", "hướng đến", "mục tiêu", "target", "senior", "lead", "manager"])
    has_level = bool(profile.get("current_level")) or any(kw in history_text for kw in ["năm kinh nghiệm", "level", "junior", "mid", "senior"])
    has_stack = bool(profile.get("main_stack")) or any(kw in history_text for kw in ["python", "javascript", "java", "react", "node", "stack", "công nghệ"])
    has_challenges = bool(profile.get("challenges")) or any(kw in history_text for kw in ["khó", "thách thức", "vấn đề", "bí", "mệt"])
    
    info_count = sum([has_goal, has_level, has_stack, has_challenges])
    
    conversation_length = len(chat_history)
    
    if conversation_length >= 6 and info_count >= 3:
        return True
    if conversation_length >= 10:
        return True
    
    return False

def get_conversation_turn(chat_history: list, user_profile: dict) -> int:
    """Determine which stage of conversation we're in based on history and profile."""
    profile = user_profile or {}
    
    if should_move_to_analysis(chat_history, profile):
        return CONVERSATION_STAGES["ANALYSIS"]
    
    conversation_length = len([m for m in chat_history if m.get("role") == "user"])
    
    if conversation_length == 0:
        return CONVERSATION_STAGES["WELCOME"]
    elif conversation_length < 5:
        return CONVERSATION_STAGES["DISCOVERY"]
    elif conversation_length < 8:
        return CONVERSATION_STAGES["DEEP_DIVE"]
    elif conversation_length < 10:
        return CONVERSATION_STAGES["CHALLENGES"]
    else:
        return CONVERSATION_STAGES["MOTIVATION"]

def get_llm_coach_response(message: str, user_profile: dict, chat_history: list, user_name: str = ""):
    if not llm:
        return None
    
    stage = get_conversation_turn(chat_history, user_profile)
    
    if stage == CONVERSATION_STAGES["ANALYSIS"]:
        return handle_analysis_phase(message, user_profile, chat_history, user_name, None)
    
    return generate_smart_question(message, chat_history, user_profile, stage)

def extract_profile_from_message(message: str, current_profile: dict) -> dict:
    """Extract profile information from user's message."""
    message_lower = message.lower()
    new_profile = current_profile.copy() if current_profile else {}
    
    target_keywords = {
        "senior": "Senior Developer",
        "junior": "Junior Developer", 
        "mid": "Mid-Level Developer",
        "lead": "Tech Lead",
        "tech lead": "Tech Lead",
        "manager": "Engineering Manager",
        "architect": "Software Architect",
        "staff": "Staff Engineer",
    }
    for kw, role in target_keywords.items():
        if kw in message_lower:
            new_profile["target_role"] = role
            break
    
    level_keywords = {
        "junior": "Junior",
        "mid-level": "Mid-Level",
        "mid level": "Mid-Level",
        "fresher": "Junior",
        "senior": "Senior",
        "năm kinh nghiệm": "Mid-Level",
        "năm": "Mid-Level",
    }
    for kw, level in level_keywords.items():
        if kw in message_lower:
            new_profile["current_level"] = level
            break
    
    stack_keywords = {
        "python": "Python",
        "javascript": "JavaScript/TypeScript",
        "typescript": "JavaScript/TypeScript",
        "js": "JavaScript/TypeScript",
        "java": "Java",
        "c#": "C#",
        "go": "Go",
        "golang": "Go",
        "rust": "Rust",
        "react": "React/Next.js",
        "nextjs": "React/Next.js",
        "node": "Node.js",
        "django": "Django/FastAPI",
        "fastapi": "Django/FastAPI",
    }
    for kw, stack in stack_keywords.items():
        if kw in message_lower:
            new_profile["main_stack"] = stack
            break
    
    return new_profile

def handle_analysis_phase(message: str, user_profile: dict, chat_history: list, user_first_name: str, user_id: int = None):
    """Handle the final phase - generate GAP analysis and roadmap."""
    
    profile = user_profile or {}
    
    profile_text = f"""
User Profile:
- Current Level: {profile.get('current_level', 'Chưa xác định')}
- Target Role: {profile.get('target_role', 'Chưa xác định')}
- Tech Stack: {profile.get('main_stack', 'Chưa xác định')}
- Focus Area: {profile.get('focus_area', 'Chưa xác định')}
"""
    
    system_prompt = f"""Bạn là AI Career Development Coach.

Nhiệm vụ: Tổng hợp thông tin đã thu thập được và tạo GAP analysis + Learning Plan cho user.

{profile_text}

Conversation history:
"""
    for msg in chat_history[-8:]:
        role = "User" if msg.get("role") == "user" else "AI"
        system_prompt += f"{role}: {msg.get('content', '')}\n"

    system_prompt += f"""
User's latest message: {message}

YÊU CẦU:
1. Tạo phân tích GAP (khoảng trống kỹ năng) chi tiết
2. Đề xuất lộ trình học tập cụ thể theo từng giai đoạn
3. Dẫn dắt user đến kết luận rõ ràng về:
   - Khoảng trống kỹ năng cần lấp đầy
   - Thứ tự ưu tiên học tập
   - Timeline cụ thể
4. Kết thúc bằng một câu hỏi xác nhận: "Bạn có muốn tôi lưu phân tích này vào profile không?"

Format:
- Dùng **đậm** cho các từ quan trọng
- Dùng emoji phù hợp
- Section rõ ràng với tiêu đề
- Không dùng ##"""

    try:
        response = llm.invoke(system_prompt)
        return personalize_response(response.content, user_first_name)
    except Exception as e:
        print(f"[WARN] LLM analysis failed: {e}")
        return None

def get_coach_response(message: str, user_profile: dict, user_id: int, chat_history: list, user_name: str = ""):
    message_lower = message.lower()
    user_first_name = user_profile.get("first_name") or user_name.split()[0] if user_name else ""
    
    if not user_profile or not user_profile.get("current_level"):
        response = """Xin chào! Tôi là AI Development Coach.

Để bắt đầu, bạn có thể chia sẻ về mục tiêu nghề nghiệp của mình không?
Bạn đang hướng đến vị trí nào và level hiện tại của bạn là gì?"""
        return personalize_response(response, user_first_name)
    
    bridge = "Tôi hiểu bạn đang muốn nói về việc phát triển sự nghiệp."
    question = "Bạn có thể kể thêm về những thách thức bạn đang gặp phải không?"
    
    return personalize_response(f"{bridge}\n\n{question}", user_first_name)


class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=OUT_DIR, **kwargs)
    
    def do_GET(self):
        path = self.path
        if path == '/health' or path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "Healthy",
                "time_of_last_update": int(datetime.now().timestamp()),
                "out_dir": OUT_DIR,
                "files": os.listdir(OUT_DIR) if os.path.exists(OUT_DIR) else "N/A"
            }).encode())
        elif path == '/debug':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            debug = f"OUT_DIR: {OUT_DIR}\nEXISTS: {os.path.exists(OUT_DIR)}\nFILES: {os.listdir(OUT_DIR) if os.path.exists(OUT_DIR) else 'N/A'}"
            self.wfile.write(debug.encode())
        elif path == '/' or path == '':
            index_file = os.path.join(OUT_DIR, 'index.html')
            if os.path.exists(index_file):
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                with open(index_file, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, 'index.html not found')
        else:
            return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/api/register':
            self.handle_register()
        elif self.path == '/api/login':
            self.handle_login()
        elif self.path == '/api/profile':
            self.handle_profile()
        elif self.path == '/api/training':
            self.handle_training()
        elif self.path == '/api/sessions':
            self.handle_sessions()
        elif self.path == '/api/session-messages':
            self.handle_session_messages()
        elif self.path == '/api/history':
            self.handle_get_history()
        elif self.path == '/api/skills':
            self.handle_get_skills()
        elif self.path == '/invocations':
            self.handle_chat()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_register(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        username = payload.get("username", "")
        password = payload.get("password", "")
        
        success, message = db.register_user(username, password)
        
        self.send_response(200 if success else 400)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"success": success, "message": message}).encode())

    def handle_login(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        username = payload.get("username", "")
        password = payload.get("password", "")
        
        success, user_id, message = db.login_user(username, password)
        
        if success:
            profile = db.get_user_profile(user_id)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True, 
                "message": message,
                "user_id": user_id,
                "profile": profile
            }).encode())
        else:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": message}).encode())

    def handle_profile(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        user_id = payload.get("user_id", 0)
        profile_data = payload.get("profile", {})
        
        success = db.update_user_profile(user_id, profile_data)
        
        self.send_response(200 if success else 400)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"success": success}).encode())

    def handle_training(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        user_id = payload.get("user_id", 0)
        activity_type = payload.get("type", "code")
        title = payload.get("title", "")
        description = payload.get("description", "")
        duration = payload.get("duration", 0)
        score = payload.get("score", 0)
        
        history_id = db.add_training_history(
            user_id, activity_type, title, 
            description, duration, score
        )
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "history_id": history_id}).encode())

    def handle_sessions(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        user_id = payload.get("user_id", 0)
        action = payload.get("action", "list")
        
        if action == "create":
            session_id = db.create_chat_session(user_id)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"session_id": session_id}).encode())
        else:
            sessions = db.get_chat_sessions(user_id)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"sessions": sessions}).encode())

    def handle_session_messages(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        session_id = payload.get("session_id", 0)
        messages = db.get_session_messages(session_id)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"messages": messages}).encode())

    def handle_get_history(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        user_id = payload.get("user_id", 0)
        history = db.get_training_history(user_id)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"history": history}).encode())

    def handle_get_skills(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        user_id = payload.get("user_id", 0)
        skills = db.get_skills_progress(user_id)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"skills": skills}).encode())

    def handle_chat(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode())
        
        message = payload.get("message", "")
        user_profile = payload.get("profile", {})
        user_id = payload.get("user_id", 0)
        session_id = payload.get("session_id")
        chat_history = payload.get("history", [])
        
        if user_id:
            if not session_id:
                session_id = db.create_chat_session(user_id, message[:30] + "...")
            
            db.add_chat_message(user_id, "user", message, session_id)
            
            # Tự động ghi nhận hoạt động dựa trên nội dung chat
            # Nếu user hỏi về lộ trình, phân tích gap hoặc học tập, ghi nhận 1 hoạt động "study"
            if any(k in message.lower() for k in ["lộ trình", "roadmap", "phân tích", "gap", "kỹ năng", "học"]):
                db.add_training_history(
                    user_id=user_id,
                    activity_type="soft_skill",
                    title="Thảo luận định hướng sự nghiệp",
                    description=f"User hỏi về: {message[:50]}...",
                    duration=15,
                    score=5
                )
        
        user_name = ""
        if user_id:
            user_info = db.get_user_profile(user_id)
            if user_info:
                user_name = user_info.get("first_name") or user_info.get("full_name") or ""
        
        extracted_profile = extract_profile_from_message(message, user_profile)
        
        if extracted_profile != user_profile:
            user_profile = extracted_profile
            if user_id:
                db.update_user_profile(user_id, user_profile)
        
        stage = get_conversation_turn(chat_history, user_profile)
        
        if stage == CONVERSATION_STAGES["ANALYSIS"]:
            llm_response = handle_analysis_phase(message, user_profile, chat_history, user_name, user_id)
        else:
            llm_response = generate_smart_question(message, chat_history, user_profile, stage)
        
        if llm_response:
            response = llm_response
        else:
            response = get_coach_response(message, user_profile, user_id, chat_history, user_name)
        
        if user_id:
            db.add_chat_message(user_id, "assistant", response, session_id)
            db.update_chat_session(session_id)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "success",
            "response": response,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }).encode())

if __name__ == "__main__":
    app = HTTPServer(('0.0.0.0', 8080), CustomHandler)
    print("AI Development Coach running on port 8080")
    app.serve_forever()
