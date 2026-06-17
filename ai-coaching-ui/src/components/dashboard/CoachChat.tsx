"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Target,
  BookOpen,
  Lightbulb,
  History,
  RefreshCw,
  MoreVertical,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProfile } from "@/app/page"
import TrainingHistory from "./TrainingHistory"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

const API_URL = typeof window !== "undefined" 
  ? `${window.location.protocol}//${window.location.host}`
  : "http://localhost:8080"

interface CoachChatProps {
  userId: number | null
  sessionId?: number | null
  onSessionLoaded?: () => void
  autoStartMessage?: string | null
}

export default function CoachChat({ userId, sessionId: initialSessionId, onSessionLoaded, autoStartMessage }: CoachChatProps) {
  const { profile, setProfile } = useProfile()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const [profileStep, setProfileStep] = useState(0)
  const [assessmentAnswers, setAssessmentAnswers] = useState<string[]>([])
  const [showAssessment, setShowAssessment] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [coachPhase, setCoachPhase] = useState<"profile" | "chat" | "assessment" | "coaching">("profile")
  const [coachQuestionCount, setCoachQuestionCount] = useState(0)
  const [strengthAnalysis, setStrengthAnalysis] = useState<any>(null)
  
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
    "Principal Engineer",
    "Architect"
  ]
  
  const assessmentQuestions = [
    {
      key: "q1",
      question: "Khi gặp vấn đề kỹ thuật khó, bạn thường:",
      options: [
        "Tự phân tích root cause và tìm giải pháp",
        "Tìm người có kinh nghiệm để hỏi",
        "Thuyết phục team theo hướng của mình",
        "Lập plan và hoàn thành đúng hạn"
      ]
    },
    {
      key: "q2", 
      question: "Đồng nghiệp thường tìm bạn để:",
      options: [
        "Hỏi về technical details",
        "Giải thích và thuyết phục",
        "Xin kinh nghiệm",
        "Hoàn thành đúng deadline"
      ]
    },
    {
      key: "q3",
      question: "Điều gì thúc đẩy bạn làm việc tốt nhất?",
      options: [
        "Khám phá công nghệ mới",
        "Tạo ảnh hưởng trong team",
        "Xây dựng mối quan hệ",
        "Thực thi và hoàn thành công việc"
      ]
    },
    {
      key: "q4",
      question: "Bạn thấy mình phù hợp với vai trò nào trong team?",
      options: [
        "Người nhìn big picture, chiến lược",
        "Người giải quyết vấn đề khó",
        "Người kết nối và motivate team",
        "Người code và delivery"
      ]
    }
  ]

  const updateProfile = async (updates: Partial<typeof profile>) => {
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile)
    if (userId) {
      try {
        await fetch(`${API_URL}/api/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, profile: newProfile })
        })
      } catch (err) {
        console.error("Failed to save profile:", err)
      }
    }
  }

  useEffect(() => {
    if (!userId || isLoaded) return
    
    if (initialSessionId) {
      loadSession(initialSessionId)
    } else {
      loadLatestSession()
    }
  }, [userId, initialSessionId, isLoaded])

  useEffect(() => {
    if (autoStartMessage && isLoaded && !isTyping) {
      const timer = setTimeout(() => {
        sendMessage(autoStartMessage)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoStartMessage, isLoaded, isTyping])

  useEffect(() => {
    if (autoStartMessage && messages.length > 0 && !isTyping) {
      const timer = setTimeout(() => {
        sendMessage(autoStartMessage)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [messages.length])

  useEffect(() => {
    if (messages.length === 0 && isLoaded) {
      startProfileCollection()
    }
  }, [isLoaded, profile])

  const startProfileCollection = () => {
    const userName = profile.full_name || profile.first_name || "bạn"
    const initialMessage: Message = {
      id: "1",
      role: "assistant",
      content: `👋 **CHÀO ${userName.toUpperCase()}!**\n\nTôi là AI Development Coach của bạn.\n\nHãy hỏi tôi về:\n• Phân tích khoảng trống kỹ năng\n• Lộ trình học tập\n• Cách đạt mục tiêu nghề nghiệp\n\nBạn muốn bắt đầu từ đâu?`,
      timestamp: new Date()
    }
    setMessages([initialMessage])
  }

  const getInitialMessage = () => {
    const userName = profile.full_name || profile.first_name || "bạn"
    return `👋 **CHÀO ${userName.toUpperCase()}!**\n\nTôi là AI Development Coach - trợ lý huấn luyện phát triển sự nghiệp của bạn.\n\nHãy trả lời một số câu hỏi để tôi có thể hỗ trợ bạn tốt nhất:\n\n**Câu hỏi 1/3:**\n${getQuestionText(0)}`
  }

  const getQuestionText = (step: number) => {
    switch(step) {
      case 0: return "Bạn đang ở **level nào** trong sự nghiệp?"
      case 1: return "Bạn muốn lên **level nào** tiếp theo?"
      case 2: return "Theo bạn, **điểm mạnh** của bạn là gì?"
      default: return ""
    }
  }

  const handleProfileAnswer = async (answer: string) => {
    const step = profileStep
    
    if (step < 2) {
      let fieldValue = answer
      if (step === 0) {
        const matched = levelOptions.find(l => answer.toLowerCase().includes(l.split(" ")[0].toLowerCase()))
        if (matched) fieldValue = matched
      } else if (step === 1) {
        const matched = roleOptions.find(r => answer.toLowerCase().includes(r.split(" ")[0].toLowerCase()))
        if (matched) fieldValue = matched
      }
      await updateProfile(step === 0 ? { current_level: fieldValue } : { target_role: fieldValue })
      
      const nextStep = step + 1
      setProfileStep(nextStep)
      
      const response: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Đã lưu!\n\n**Câu hỏi ${nextStep + 1}/3:**\n${getQuestionText(nextStep)}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
    } else {
      const matchedStrength = findMatchingOption(answer, assessmentQuestions[0].options)
      if (matchedStrength) {
        setAssessmentAnswers([matchedStrength])
        setShowAssessment(true)
      } else {
        setShowAssessment(true)
      }
    }
  }

  const findMatchingOption = (answer: string, options: string[]) => {
    for (const opt of options) {
      if (answer.toLowerCase().includes(opt.split(" ")[0].toLowerCase())) {
        return opt
      }
    }
    return null
  }

  const handleAssessmentSelect = async (questionIdx: number, option: string) => {
    const newAnswers = [...assessmentAnswers]
    newAnswers[questionIdx] = option
    setAssessmentAnswers(newAnswers)
    
    if (questionIdx < 3) {
      const response: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Đã chọn: *${option}*\n\n**Câu hỏi ${questionIdx + 2}/4:**\n${assessmentQuestions[questionIdx + 1].question}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
    } else {
      setShowAssessment(false)
      
      setProfileCompleted(true)
      const response: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Hoàn thành bài đánh giá! Tôi đang phân tích điểm mạnh của bạn...`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
      setIsTyping(true)
      
      try {
        const analysisResponse = await fetch(`${API_URL}/api/gap-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: {
              ...profile,
              q1_problem_approach: newAnswers[0],
              q2_colleague_ask: newAnswers[1],
              q3_motivation: newAnswers[2],
              q4_team_role: newAnswers[3]
            }
          })
        })
        const analysis = await analysisResponse.json()
        
        await updateProfile({
          q1_problem_approach: newAnswers[0],
          q2_colleague_ask: newAnswers[1],
          q3_motivation: newAnswers[2],
          q4_team_role: newAnswers[3]
        })
        
        const strengths = analysis.behaviorChanges?.map((b: any) => b.leveragedStrength).filter(Boolean) || []
        const strengthText = strengths.length > 0 
          ? strengths.slice(0, 3).join(", ")
          : "phân tích từ câu trả lời của bạn"
        
        setStrengthAnalysis(analysis)
        setCoachPhase("coaching")
        
        const finalResponse: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `🎯 **PHÂN TÍCH ĐIỂM MẠNH CỦA BẠN:**\n\nDựa trên 4 câu trả lời, tôi nhận thấy điểm mạnh của bạn là: **${strengthText}**\n\n---\n\nBây giờ, để hiểu bạn sâu hơn, tôi muốn hỏi bạn một câu:\n\n*Gần đây bạn có feedback nào từ sếp hoặc đồng nghiệp khiến bạn suy nghĩ không?*\n\nBạn có thể chia sẻ một feedback mà bạn còn đang băn khoăn nhé.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, finalResponse])
      } catch (err) {
        console.error("Analysis error:", err)
        setCoachPhase("coaching")
        const errorResponse: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `✅ Đã lưu câu trả lời của bạn!\n\nBây giờ tôi muốn hiểu bạn hơn:\n\n*Gần đây bạn có feedback nào từ sếp hoặc đồng nghiệp khiến bạn suy nghĩ không?*\n\nChia sẻ một feedback mà bạn còn đang băn khoăn nhé.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorResponse])
      }
      setIsTyping(false)
    }
  }

  const loadSession = async (sid: number) => {
    try {
      setSessionId(sid)
      const response = await fetch(`${API_URL}/api/session-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid })
      })
      const data = await response.json()
      const loadedMessages = (data.messages || []).map((m: any) => ({
        id: m.id.toString(),
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at)
      }))
      setMessages(loadedMessages)
      setIsLoaded(true)
      onSessionLoaded?.()
    } catch (err) {
      console.error("Failed to load session:", err)
      setIsLoaded(true)
      onSessionLoaded?.()
    }
  }

  const createNewSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "create" })
      })
      const data = await response.json()
      setSessionId(data.session_id)
      setMessages([])
    } catch (err) {
      console.error("Failed to create session:", err)
    }
  }

  const loadLatestSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "list" })
      })
      const data = await response.json()
      const sessions = data.sessions || []
      
      if (sessions.length > 0) {
        const latestSession = sessions[0]
        setSessionId(latestSession.id)
        
        const messagesResponse = await fetch(`${API_URL}/api/session-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: latestSession.id })
        })
        const messagesData = await messagesResponse.json()
        const loadedMessages = (messagesData.messages || []).map((m: any) => ({
          id: m.id.toString(),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at)
        }))
        
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages)
          setIsLoaded(true)
          return
        }
      }
      
      setIsLoaded(true)
    } catch (err) {
      console.error("Failed to load session:", err)
      setIsLoaded(true)
    }
  }

  const quickActions = coachPhase === "coaching"
    ? [
        { icon: Target, label: "💬 Feedback gần đây", prompt: "Tôi muốn chia sẻ một feedback" },
        { icon: BookOpen, label: "⏭️ Bỏ qua", prompt: "Tôi muốn hỏi về lộ trình học tập" },
        { icon: Lightbulb, label: "📊 Xem phân tích", prompt: "Cho tôi xem phân tích điểm mạnh của tôi" },
      ]
    : [
        { icon: Target, label: "📊 Phân tích Gap", prompt: "Phân tích khoảng trống kỹ năng của tôi" },
        { icon: BookOpen, label: "🗺️ Lộ trình", prompt: "Cho tôi lộ trình học tập để trở thành " + (profile.target_role || "Senior Developer") },
        { icon: Lightbulb, label: "💡 Gợi ý", prompt: "Tôi nên học gì tiếp theo để đạt mục tiêu?" },
      ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string = input) => {
    if (!content.trim() || isTyping) return

    if (showAssessment) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    }

    const newUserMessageCount = profileCompleted ? userMessageCount + 1 : userMessageCount
    setUserMessageCount(newUserMessageCount)
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    setError(null)

    try {
      let currentSessionId = sessionId
      
      if (!currentSessionId) {
        const createResponse = await fetch(`${API_URL}/api/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, action: "create" })
        })
        const createData = await createResponse.json()
        currentSessionId = createData.session_id
        setSessionId(currentSessionId)
      }
      
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      
      const response = await fetch(`${API_URL}/invocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          profile: profile,
          user_id: userId,
          session_id: currentSessionId,
          history: history,
          coach_phase: coachPhase
        })
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        suggestions: coachPhase === "coaching" 
          ? ["Đúng rồi", "Chưa đúng lắm", "Tôi muốn chia sẻ thêm"]
          : ["Cho tôi biết thêm", "Xem lộ trình của tôi", "Tôi nên tập trung vào đâu?"]
      }
      setMessages(prev => [...prev, assistantMessage])

      if (coachPhase === "coaching") {
        const questionCount = (data.response.match(/\?/g) || []).length
        if (questionCount > 0) {
          setCoachQuestionCount(prev => prev + 1)
        }
      }

      if (profileCompleted && newUserMessageCount >= 3 && !showAssessment && assessmentAnswers.length === 0) {
        setTimeout(() => {
          setShowAssessment(true)
          const assessmentMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `📋 **BÀI ĐÁNH GIÁ**\n\nĐể hiểu bạn tốt hơn, hãy trả lời 4 câu hỏi ngắn nhé!`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, assessmentMsg])
        }, 1000)
      }
    } catch (err) {
      setError("Không thể kết nối với Coach. Vui lòng thử lại sau.")
      console.error(err)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      <div className="relative mb-4 -mx-4 -mt-4 px-6 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">🤖 AI Development Coach</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/80">Online • Always ready to help</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={createNewSession}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="Cuộc trò chuyện mới"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setMessages([])}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="Làm mới"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message, idx) => (
          <motion.div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" && "flex-row-reverse"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
              message.role === "assistant" 
                ? "bg-gradient-to-br from-indigo-500 to-purple-500" 
                : "bg-gray-100 dark:bg-gray-800"
            )}>
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>

            <div className={cn(
              "max-w-[75%] rounded-2xl p-4",
              message.role === "assistant" 
                ? "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700" 
                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            )}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{renderContent(message.content)}</p>
              </div>
              
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button 
                    onClick={() => copyMessage(message.content)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Sao chép"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Tốt"
                  >
                    <ThumbsUp className="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Chưa tốt"
                  >
                    <ThumbsDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}

              {message.suggestions && message.role === "assistant" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                <div className="flex gap-1">
                  <motion.span className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} />
                  <motion.span className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} />
                  <motion.span className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {coachPhase === "coaching" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
          <span className="text-xs text-purple-600 dark:text-purple-400">Câu hỏi còn lại</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < coachQuestionCount
                    ? "bg-purple-300 dark:bg-purple-700 opacity-40"
                    : "bg-purple-500 dark:bg-purple-400"
                }`}
              />
            ))}
          </div>
          {coachQuestionCount >= 5 && (
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium ml-auto">Đang tổng kết...</span>
          )}
        </div>
      )}

      <div className="flex gap-2 pb-4 overflow-x-auto">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(action.prompt)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all whitespace-nowrap"
          >
            <action.icon className="w-4 h-4 text-indigo-500" />
            {action.label}
          </button>
        ))}
      </div>

      {showAssessment && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold mb-3 text-purple-700 dark:text-purple-400">
            📋 Câu hỏi {assessmentAnswers.length + 1}/4: {assessmentQuestions[assessmentAnswers.length]?.question}
          </h4>
          <div className="space-y-2">
            {assessmentQuestions[assessmentAnswers.length]?.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAssessmentSelect(assessmentAnswers.length, option)}
                disabled={isTyping}
                className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-end gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={coachPhase === "coaching" ? "Chia sẻ suy nghĩ của bạn..." : "Hỏi tôi về hành trình phát triển của bạn..."}
            className="flex-1 min-h-[44px] max-h-32 bg-transparent border-0 focus:ring-0 resize-none py-2 px-2"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {userId && (
        <div className="mt-6">
          <TrainingHistory userId={userId} onContinueChat={(sid) => {
            setSessionId(sid)
            onSessionLoaded?.()
          }} />
        </div>
      )}
    </div>
  )
}
