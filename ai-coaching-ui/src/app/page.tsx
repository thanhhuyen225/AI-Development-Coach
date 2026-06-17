"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Target, 
  MessageSquare, 
  MapPin,
  LogOut,
  Menu,
  X,
  History,
  User,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  Code2,
  Brain,
  XCircle,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import CoachChat from "@/components/dashboard/CoachChat"
import TrainingHistory from "@/components/dashboard/TrainingHistory"
import Auth from "@/components/dashboard/Auth"
import { StatCard } from "@/components/ui/Progress"

interface UserProfile {
  current_level: string
  target_role: string
  main_stack: string
  focus_area: string
  full_name: string
  first_name: string
  last_name: string
  career_goals: string
  strengths: string
  q1_problem_approach: string
  q2_colleague_ask: string
  q3_motivation: string
  q4_team_role: string
}

interface ProfileContextType {
  profile: UserProfile
  setProfile: (p: UserProfile) => void
  userId: number | null
  username: string
  fetchProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType>({
  profile: { current_level: "", target_role: "", main_stack: "", focus_area: "", full_name: "", first_name: "", last_name: "", career_goals: "", strengths: "", q1_problem_approach: "", q2_colleague_ask: "", q3_motivation: "", q4_team_role: "" },
  setProfile: () => {},
  userId: null,
  username: "",
  fetchProfile: async () => {}
})

export const useProfile = () => useContext(ProfileContext)

const API_URL = typeof window !== "undefined" 
  ? `${window.location.protocol}//${window.location.host}`
  : "http://localhost:8080"

const navItems = [
  { id: "coach", label: "AI Coach", icon: MessageSquare },
]

const levelOptions = [
  "Junior Developer (0-2 years)",
  "Mid-Level Developer (2-4 years)", 
  "Senior Developer (4-6 years)",
  "Tech Lead (6+ years)"
]

const roleOptions = [
  "Senior Developer",
  "Tech Lead",
  "Staff Engineer",
  "Software Architect",
  "Engineering Manager"
]

const goalOptions = [
  { id: "technical_expert", label: "Trở thành chuyên gia kỹ thuật", desc: "Deep dive vào công nghệ, giải quyết vấn đề phức tạp", icon: "💻" },
  { id: "team_leader", label: "Dẫn dắt đội nhóm", desc: "Phát triển kỹ năng quản lý và mentoring", icon: "👥" },
  { id: "architecture", label: "Thiết kế hệ thống", desc: "Thiết kế và tối ưu hạ tầng, kiến trúc", icon: "🏗️" },
  { id: "product", label: "Hiểu sản phẩm kinh doanh", desc: "Gắn kỹ thuật với giá trị kinh doanh", icon: "📈" },
  { id: "fullstack", label: "Full-stack developer", desc: "Phát triển cả frontend và backend", icon: "🔄" },
  { id: "specialist", label: "Chuyên sâu một lĩnh vực", desc: "AI/ML, Security, DevOps, Data...", icon: "🎯" }
]

const assessmentQuestions = [
  {
    key: "q1_problem_approach",
    label: "1. Khi gặp vấn đề mới, bạn thường làm gì trước tiên?",
    options: [
      { id: "q1_analyze", label: "Phân tích dữ liệu, tìm pattern và root cause" },
      { id: "q1_convince", label: "Thuyết phục người khác cùng giải quyết" },
      { id: "q1_ask", label: "Tìm người có kinh nghiệm để tham khảo" },
      { id: "q1_plan", label: "Lập plan và phân chia tasks ngay" }
    ]
  },
  {
    key: "q2_colleague_ask",
    label: "2. Đồng nghiệp thường tìm đến bạn để làm gì?",
    options: [
      { id: "q2_strategy", label: "Xin ý kiến về chiến lược và hướng đi dài hạn" },
      { id: "q2_persuade", label: "Nhờ thuyết phục hoặc present ý tưởng" },
      { id: "q2_connect", label: "Kết nối với người khác hoặc tạo động lực" },
      { id: "q2_execute", label: "Đảm bảo công việc được hoàn thành đúng hạn" }
    ]
  },
  {
    key: "q3_motivation",
    label: "3. Điều gì khiến bạn có hứng thú làm việc nhất?",
    options: [
      { id: "q3_explore", label: "Khám phá ý tưởng mới và học thứ mình chưa biết" },
      { id: "q3_influence", label: "Tạo ảnh hưởng và dẫn dắt người khác" },
      { id: "q3_relationship", label: "Xây dựng mối quan hệ bền vững với đồng đội" },
      { id: "q3_execute", label: "Thực thi và nhìn thấy kết quả cụ thể" }
    ]
  },
  {
    key: "q4_team_role",
    label: "4. Trong một dự án nhóm, bạn thường đóng vai trò gì?",
    options: [
      { id: "q4_strategist", label: "Người đặt câu hỏi chiến lược và nhìn big picture" },
      { id: "q4_motivator", label: "Người motivate và pitch ý tưởng" },
      { id: "q4_executor", label: "Người execute và theo dõi tiến độ" },
      { id: "q4_connector", label: "Người kết nối mọi người và giải quyết xung đột" }
    ]
  }
]

const strengthOptions = [
  { id: "problem_solving", label: "Giải quyết vấn đề", desc: "Phân tích và debug hiệu quả", icon: "🔍" },
  { id: "communication", label: "Giao tiếp", desc: "Trình bày, viết tài liệu tốt", icon: "💬" },
  { id: "learning", label: "Học nhanh", desc: "Tiếp thu công nghệ mới nhanh", icon: "📚" },
  { id: "code_quality", label: "Viết code chất lượng", desc: "Clean code, testing, review kỹ", icon: "✨" },
  { id: "leadership", label: "Lãnh đạo", desc: "Dẫn dắt, mentoring, decision making", icon: "🌟" },
  { id: "system_design", label: "Thiết kế hệ thống", desc: "Scalability, performance", icon: "🏗️" }
]

const stackOptions = [
  "JavaScript/TypeScript (React, Next.js)",
  "Python (Django, FastAPI)",
  "Java (Spring)",
  "Go (Golang)",
  "Other"
]

const focusOptions = [
  "Frontend expertise",
  "Backend/System Design",
  "Full-Stack",
  "DevOps/Cloud",
  "Leadership skills"
]

function ProfileSetup({ onComplete, isEdit = false }: { onComplete: () => void, isEdit?: boolean }) {
  const [step, setStep] = useState(0)
  const [nameInput, setNameInput] = useState("")
  const [profile, setProfile] = useState<UserProfile>({
    current_level: "",
    target_role: "",
    main_stack: "",
    focus_area: "",
    full_name: "",
    first_name: "",
    last_name: "",
    career_goals: "",
    strengths: "",
    q1_problem_approach: "",
    q2_colleague_ask: "",
    q3_motivation: "",
    q4_team_role: ""
  })
  const { userId, fetchProfile } = useProfile()

  const parseFullName = (fullName: string) => {
    const parts = fullName.trim().split(" ")
    if (parts.length === 1) {
      return { first_name: parts[0], last_name: "" }
    }
    const last_name = parts[parts.length - 1]
    const first_name = parts.slice(0, -1).join(" ")
    return { first_name, last_name }
  }

  const questions = [
    { key: "full_name", label: "Tên của bạn là gì?", type: "text" as const },
    { key: "current_level", label: "Bạn đang ở level nào?", options: levelOptions },
    { key: "target_role", label: "Bạn muốn trở thành role gì?", options: roleOptions },
    { key: "main_stack", label: "Tech stack chính của bạn là gì?", options: stackOptions },
    { key: "focus_area", label: "Bạn muốn tập trung vào đâu?", options: focusOptions },
    { key: "q1_problem_approach", label: "1. Khi gặp vấn đề mới, bạn thường làm gì trước tiên?", options: [
      "Phân tích dữ liệu, tìm pattern và root cause",
      "Thuyết phục người khác cùng giải quyết",
      "Tìm người có kinh nghiệm để tham khảo",
      "Lập plan và phân chia tasks ngay"
    ]},
    { key: "q2_colleague_ask", label: "2. Đồng nghiệp thường tìm đến bạn để làm gì?", options: [
      "Xin ý kiến về chiến lược và hướng đi dài hạn",
      "Nhờ thuyết phục hoặc present ý tưởng",
      "Kết nối với người khác hoặc tạo động lực",
      "Đảm bảo công việc được hoàn thành đúng hạn"
    ]},
    { key: "q3_motivation", label: "3. Điều gì khiến bạn có hứng thú làm việc nhất?", options: [
      "Khám phá ý tưởng mới và học thứ mình chưa biết",
      "Tạo ảnh hưởng và dẫn dắt người khác",
      "Xây dựng mối quan hệ bền vững với đồng đội",
      "Thực thi và nhìn thấy kết quả cụ thể"
    ]},
    { key: "q4_team_role", label: "4. Trong một dự án nhóm, bạn thường đóng vai trò gì?", options: [
      "Người đặt câu hỏi chiến lược và nhìn big picture",
      "Người motivate và pitch ý tưởng",
      "Người execute và theo dõi tiến độ",
      "Người kết nối mọi người và giải quyết xung đột"
    ]}
  ]

  const handleSelect = async (option: string) => {
    const key = questions[step].key as keyof UserProfile
    const newProfile = { ...profile, [key]: option }
    setProfile(newProfile)
    
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      await saveProfile(newProfile)
      onComplete()
    }
  }

  const handleNameSubmit = async () => {
    if (!nameInput.trim()) return
    const { first_name, last_name } = parseFullName(nameInput)
    const newProfile = { 
      ...profile, 
      full_name: nameInput.trim(),
      first_name,
      last_name
    }
    setProfile(newProfile)
    
    if (isEdit) {
      await saveProfile(newProfile)
      onComplete()
    } else {
      setStep(1)
    }
  }

  const saveProfile = async (profileData: UserProfile) => {
    try {
      await fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, profile: profileData })
      })
      await fetchProfile()
      window.location.reload()
    } catch (e) {
      console.error("Failed to save profile", e)
    }
  }

  const currentQ = questions[step]
  const isNameStep = currentQ?.key === "full_name"

  const handleClose = () => {
    onComplete()
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">{isEdit ? "Chỉnh sửa Profile" : "Thiết lập Profile"}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEdit && <span className="text-sm text-gray-500">{step + 1}/{questions.length}</span>}
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {!isEdit && (
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}

        <h3 className="text-lg font-semibold mb-4">{currentQ?.label}</h3>

        {isNameStep ? (
          <div className="space-y-3">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              placeholder="Nhập họ và tên của bạn"
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              Tiếp tục
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentQ?.options?.map((opt: any) => (
              <button
                key={opt.id || opt}
                onClick={() => handleSelect(opt.id || opt)}
                className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all border border-transparent hover:border-indigo-300 dark:hover:border-indigo-600"
              >
                {opt.label || opt}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("coach")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [continueSessionId, setContinueSessionId] = useState<number | null>(null)

  const [autoStartMessage, setAutoStartMessage] = useState<string | null>(null)

  const handleContinueChat = (sessionId: number) => {
    setContinueSessionId(sessionId)
    setActiveTab("coach")
  }

  const handleProfileComplete = () => {
    setShowSetup(false)
    const targetRole = profile.target_role
    const currentLevel = profile.current_level
    const message = `Tôi đang ở level ${currentLevel} và muốn phát triển lên ${targetRole}. Điều gì khiến bạn muốn hướng tới vị trí này?`
    setAutoStartMessage(message)
    setActiveTab("coach")
  }
  const [profile, setProfile] = useState<UserProfile>({
    current_level: "",
    target_role: "",
    main_stack: "",
    focus_area: "",
    full_name: "",
    first_name: "",
    last_name: "",
    career_goals: "",
    strengths: "",
    q1_problem_approach: "",
    q2_colleague_ask: "",
    q3_motivation: "",
    q4_team_role: ""
  })
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [username, setUsername] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchProfile = async () => {
    if (!userId) return
    try {
      const savedUsername = localStorage.getItem("username")
      const savedPassword = localStorage.getItem("password")
      if (!savedUsername || !savedPassword) return
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: savedUsername, password: savedPassword })
      })
      const data = await response.json()
      if (data.success && data.profile) {
        const newProfile = {
          current_level: data.profile.current_level || "",
          target_role: data.profile.target_role || "",
          main_stack: data.profile.main_stack || "",
          focus_area: data.profile.focus_area || "",
          full_name: data.profile.full_name || "",
          first_name: data.profile.first_name || "",
          last_name: data.profile.last_name || "",
          career_goals: data.profile.career_goals || "",
          strengths: data.profile.strengths || "",
          q1_problem_approach: data.profile.q1_problem_approach || "",
          q2_colleague_ask: data.profile.q2_colleague_ask || "",
          q3_motivation: data.profile.q3_motivation || "",
          q4_team_role: data.profile.q4_team_role || ""
        }
        setProfile(newProfile)
        setUsername(data.profile.username || savedUsername || "")
        localStorage.setItem("userProfile", JSON.stringify(newProfile))
      }
    } catch (e) {
      console.error("Failed to fetch profile", e)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const savedUserId = localStorage.getItem("userId")
      const savedUsername = localStorage.getItem("username")
      const savedPassword = localStorage.getItem("password")
      
      if (savedUserId && savedUsername && savedPassword) {
        // Fetch profile from server directly
        try {
          const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: savedUsername, password: savedPassword })
          })
          const data = await response.json()
          if (data.success && data.profile) {
            setUserId(data.user_id)
            setUsername(data.profile.username || savedUsername)
            const newProfile = {
              current_level: data.profile.current_level || "",
              target_role: data.profile.target_role || "",
              main_stack: data.profile.main_stack || "",
              focus_area: data.profile.focus_area || "",
              full_name: data.profile.full_name || "",
              first_name: data.profile.first_name || "",
              last_name: data.profile.last_name || "",
              career_goals: data.profile.career_goals || "",
              strengths: data.profile.strengths || "",
              q1_problem_approach: data.profile.q1_problem_approach || "",
              q2_colleague_ask: data.profile.q2_colleague_ask || "",
              q3_motivation: data.profile.q3_motivation || "",
              q4_team_role: data.profile.q4_team_role || ""
            }
            setProfile(newProfile)
            localStorage.setItem("userProfile", JSON.stringify(newProfile))
            setIsAuthenticated(true)
            
            // Show profile setup if not complete
            if (!data.profile.current_level) {
              setShowSetup(true)
            }
          }
        } catch (e) {
          console.error("Failed to fetch profile on init", e)
        }
      }
      setIsLoaded(true)
    }
    
    initAuth()
  }, [])

  const handleLogin = async (newUserId: number, userProfile: any) => {
    setUserId(newUserId)
    setIsAuthenticated(true)
    
    // Fetch latest profile from server
    await fetchProfile()
    
    // Check if profile is complete
    const savedProfile = localStorage.getItem("userProfile")
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile)
      if (parsed.current_level) {
        setProfile(parsed)
      }
    } else if (userProfile?.current_level) {
      setProfile({
        current_level: userProfile.current_level || "",
        target_role: userProfile.target_role || "",
        main_stack: userProfile.main_stack || "",
        focus_area: userProfile.focus_area || "",
        full_name: userProfile.full_name || "",
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        career_goals: userProfile.career_goals || "",
        strengths: userProfile.strengths || "",
        q1_problem_approach: userProfile.q1_problem_approach || "",
        q2_colleague_ask: userProfile.q2_colleague_ask || "",
        q3_motivation: userProfile.q3_motivation || "",
        q4_team_role: userProfile.q4_team_role || ""
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("username")
    localStorage.removeItem("password")
    setIsAuthenticated(false)
    setUserId(null)
    setProfile({
      current_level: "",
      target_role: "",
      main_stack: "",
      focus_area: "",
      full_name: "",
      first_name: "",
      last_name: "",
      career_goals: "",
      strengths: "",
      q1_problem_approach: "",
      q2_colleague_ask: "",
      q3_motivation: "",
      q4_team_role: ""
    })
    setActiveTab("dashboard")
  }

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile)
    localStorage.setItem("userProfile", JSON.stringify(newProfile))
    if (userId) {
      fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, profile: newProfile })
      })
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div 
          className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />
  }

  const renderContent = () => {
    switch (activeTab) {
      case "coach":
        return <CoachChat userId={userId} sessionId={continueSessionId} onSessionLoaded={() => setContinueSessionId(null)} autoStartMessage={autoStartMessage} />
      default:
        return <DashboardHome profile={profile} onSetupProfile={() => setShowSetup(true)} setActiveTab={setActiveTab} userId={userId} />
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile: updateProfile, userId, username, fetchProfile }}>
      <AnimatePresence>
        {showSetup && <ProfileSetup onComplete={handleProfileComplete} />}
        {showEditProfile && <ProfileSetup onComplete={() => setShowEditProfile(false)} isEdit={true} />}
      </AnimatePresence>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    DevCoach AI
                  </h1>
                  <p className="text-xs text-gray-500">Hành trình phát triển của bạn</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        <aside className={cn(
          "fixed left-0 top-[57px] bottom-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold text-sm">Mẹo hay</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Hoàn thành bài tập hàng ngày để duy trì streak của bạn!
              </p>
            </div>
          </div>
        </aside>

        <main className="pt-[57px] lg:pl-64 min-h-screen">
          <div className="p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ProfileContext.Provider>
  )
}

function DashboardHome({ profile, onSetupProfile, setActiveTab, userId }: { profile: UserProfile, onSetupProfile: () => void, setActiveTab?: (tab: string) => void, userId?: number | null }) {
  // Use full_name (Họ và Tên) for Vietnamese users
  const displayName = profile.full_name || profile.first_name || "bạn"
  const stats = [
    { title: "Level hiện tại", value: profile.current_level ? profile.current_level.split(" ")[0] : "Thiết lập", icon: <TrendingUp className="w-5 h-5" />, trend: "neutral" as const },
    { title: "Mục tiêu", value: profile.target_role || "Thiết lập", icon: <Award className="w-5 h-5" />, trend: "neutral" as const },
    { title: "Tech Stack", value: profile.main_stack ? profile.main_stack.split(" ")[0] : "Thiết lập", icon: <Code2 className="w-5 h-5" />, trend: "neutral" as const },
    { title: "Focus", value: profile.focus_area ? profile.focus_area.split("/")[0] : "Thiết lập", icon: <Target className="w-5 h-5" />, trend: "neutral" as const },
  ]

  return (
    <div className="space-y-8">
      <motion.div 
        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Chào {displayName}! 👋
            </h1>
            <p className="mt-2 text-white/80">
              {profile.target_role 
                ? `${displayName} đang trên đường trở thành ${profile.target_role}. Tiếp tục nhé!`
                : "Trò chuyện với AI Coach để nhận hướng dẫn phù hợp cho mục tiêu nghề nghiệp của bạn."}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard 
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {profile.current_level && (
        <GapAnalysisContent profile={profile} setActiveTab={setActiveTab} userId={userId} />
      )}
    </div>
  )
}

function GapAnalysisContent({ profile, setActiveTab, compact = false, userId }: { profile: UserProfile, setActiveTab?: (tab: string) => void, compact?: boolean, userId?: number | null }) {
  const currentUserId = userId
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getProfileHash = () => {
    return `${profile.current_level}-${profile.target_role}-${profile.q1_problem_approach}-${profile.q2_colleague_ask}-${profile.q3_motivation}-${profile.q4_team_role}`
  }

  useEffect(() => {
    if (!profile.current_level || !profile.target_role) {
      setLoading(false)
      return
    }

    const profileHash = getProfileHash()
    const cacheKey = `gap_analysis_${currentUserId || 'anonymous'}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached)
        if (cachedData.profileHash === profileHash) {
          setAnalysis(cachedData.analysis)
          setLoading(false)
          return
        }
      } catch {}
    }

    setLoading(true)
    setError(null)
    
    fetch(`${API_URL}/api/gap-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error)
      } else {
        setAnalysis(data)
        localStorage.setItem(cacheKey, JSON.stringify({
          profileHash,
          analysis: data,
          timestamp: Date.now()
        }))
      }
    })
    .catch(err => {
      console.error("Gap analysis error:", err)
      setError("Không thể phân tích. Vui lòng thử lại.")
    })
    .finally(() => setLoading(false))
  }, [profile.current_level, profile.target_role, profile.q1_problem_approach, profile.q2_colleague_ask, profile.q3_motivation, profile.q4_team_role])

  const behaviorChanges = analysis?.behaviorChanges || []
  const learningRecommendations = analysis?.learningRecommendations || []

  if (compact) {
    const displayItems = [...behaviorChanges, ...learningRecommendations].slice(0, 3)
    return (
      <motion.div 
        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Kế hoạch phát triển của bạn</h3>
            {loading ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                <p className="text-sm text-gray-500">AI đang phân tích...</p>
              </div>
            ) : error ? (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            ) : displayItems.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {displayItems.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-amber-500" />
                    <span>{item.title || item.courseName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Hoàn thành profile để nhận kế hoạch</p>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Phân tích khoảng trống kỹ năng
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          AI phân tích profile của bạn để đưa ra gợi ý cá nhân hóa
        </p>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-6 h-6" />
          <span className="font-semibold">Mục tiêu: {profile.target_role || "Chưa thiết lập"}</span>
        </div>
        <p className="text-white/80">Level hiện tại: {profile.current_level || "Chưa thiết lập"}</p>
      </div>

      {profile.q1_problem_approach && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold mb-4">📊 Đánh giá phong cách làm việc</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <p>Khi gặp vấn đề: <span className="font-medium">{profile.q1_problem_approach}</span></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <p>Đồng nghiệp tìm bạn để: <span className="font-medium">{profile.q2_colleague_ask}</span></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <p>Bạn hứng thú với: <span className="font-medium">{profile.q3_motivation}</span></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <p>Vai trò trong nhóm: <span className="font-medium">{profile.q4_team_role}</span></p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-500">AI đang phân tích profile của bạn...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          {analysis?.behaviorChanges && analysis.behaviorChanges.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🔄</span> Thay đổi hành vi cần thực hiện
              </h3>
              <div className="space-y-4">
                {analysis.behaviorChanges.map((behavior: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-blue-700 dark:text-blue-400">{behavior.title}</h4>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                        Check: {behavior.checkpointDays} ngày
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{behavior.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {behavior.frequency}
                      </span>
                      <span>Deadline: {behavior.deadlineDays} ngày</span>
                    </div>
                    {behavior.mappedGap && (
                      <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                        → Lấp đầy: {behavior.mappedGap}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis?.learningRecommendations && analysis.learningRecommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📚</span> Khóa học đề xuất
              </h3>
              <div className="space-y-4">
                {analysis.learningRecommendations.map((course: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-purple-700 dark:text-purple-400">{course.courseName}</h4>
                        <p className="text-sm text-gray-500 mt-1">{course.instructor} • {course.platform}</p>
                      </div>
                      {course.estimatedHours && (
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full">
                          {course.estimatedHours}h
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{course.reason}</p>
                    {course.mappedCompetency && (
                      <div className="mt-2 text-xs text-pink-600 dark:text-pink-400">
                        → Năng lực: {course.mappedCompetency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!analysis?.behaviorChanges?.length && !analysis?.learningRecommendations?.length) && (
            <p className="text-gray-500 text-center py-4">Hoàn thành profile để nhận kế hoạch phát triển</p>
          )}
        </>
      )}

      {setActiveTab && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Lộ trình phát triển</h3>
          </div>
          <p className="text-gray-500">
            Dựa trên mục tiêu <strong>{profile.target_role}</strong> và phong cách làm việc của bạn, 
            hãy trò chuyện với AI Coach để nhận lộ trình chi tiết!
          </p>
          <button 
            onClick={() => setActiveTab("coach")}
            className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium"
          >
            Nhận lộ trình chi tiết
          </button>
        </div>
      )}
    </div>
  )
}

function GapAnalysisSimplified({ userId }: { userId: number | null }) {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetch(`${API_URL}/api/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      })
      .then(res => res.json())
      .then(data => {
        setSkills(data.skills || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
    }
  }, [userId])

  if (loading) {
    return <div className="text-center py-10">Đang tải...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.slice(0, 9).map((skill: any, idx: number) => {
        const progress = (skill.current_value / skill.target_value) * 100
        const isCritical = progress < 60
        
        return (
          <motion.div 
            key={idx}
            className={cn(
              "p-4 rounded-xl border",
              isCritical ? "bg-red-50 dark:bg-red-900/10 border-red-200" : "bg-white dark:bg-gray-800 border-gray-200"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm">{skill.skill_name}</span>
              {isCritical && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                  Cần cải thiện
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  isCritical ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{skill.current_value}%</span>
              <span>Mục tiêu: {skill.target_value}%</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function RoadmapSection({ profile }: { profile: UserProfile }) {
  const target_role = profile.target_role || "Senior Developer"
  const roleReq = {
    "Senior Developer": { timeline: "6-12 tháng", phases: ["Nền tảng", "Kỹ năng cốt lõi", "Nâng cao"] },
    "Tech Lead": { timeline: "12-18 tháng", phases: ["Nền tảng", "Kỹ năng cốt lõi", "Leadership"] },
    "Staff Engineer": { timeline: "18-24 tháng", phases: ["Nền tảng", "Kỹ năng chuyên sâu", "Technical Leadership"] },
    "Software Architect": { timeline: "24-36 tháng", phases: ["Nền tảng", "Architecture", "Enterprise"] },
    "Engineering Manager": { timeline: "12-24 tháng", phases: ["Leadership cơ bản", "Quản lý đội", "Strategic"] },
  }[target_role] || { timeline: "6-12 tháng", phases: ["Nền tảng", "Kỹ năng cốt lõi", "Nâng cao"] }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Lộ trình học tập
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Lộ trình để trở thành {target_role}
        </p>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Thời gian dự kiến: {roleReq.timeline}</h3>
        <div className="flex flex-wrap gap-3">
          {roleReq.phases.map((phase, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-medium">
                {idx + 1}
              </div>
              <span>{phase}</span>
              {idx < roleReq.phases.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-gray-500 text-center">
        Sử dụng AI Coach để xem lộ trình chi tiết hơn
      </p>
    </div>
  )
}

function Lightbulb({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
  )
}
