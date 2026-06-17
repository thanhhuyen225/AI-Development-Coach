"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  History, 
  Clock, 
  TrendingUp, 
  Award,
  Code2,
  Brain,
  Database,
  GitBranch,
  MessageSquare,
  TestTube,
  Container,
  Cloud,
  X,
  Bot,
  User,
  MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = typeof window !== "undefined" 
  ? `${window.location.protocol}//${window.location.host}`
  : "http://localhost:8080"

interface TrainingHistoryProps {
  userId: number
  onContinueChat?: (sessionId: number) => void
}

interface HistoryItem {
  id: number
  activity_type: string
  title: string
  description: string
  duration_minutes: number
  score: number
  completed_at: string
}

interface ChatSession {
  id: number
  title: string
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: number
  role: string
  content: string
  created_at: string
}

const activityIcons: Record<string, React.ReactNode> = {
  code: <Code2 className="w-5 h-5" />,
  system_design: <Brain className="w-5 h-5" />,
  frontend: <Container className="w-5 h-5" />,
  backend: <Database className="w-5 h-5" />,
  devops: <Cloud className="w-5 h-5" />,
  soft_skill: <MessageSquare className="w-5 h-5" />,
  test: <TestTube className="w-5 h-5" />,
}

const activityLabels: Record<string, string> = {
  code: "Lập trình",
  system_design: "System Design",
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps",
  soft_skill: "Kỹ năng mềm",
  test: "Testing",
}

export default function TrainingHistory({ userId, onContinueChat }: TrainingHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStats, setTotalStats] = useState({ activities: 0, minutes: 0, avgScore: 0 })
  const [activeTab, setActiveTab] = useState<"activity" | "chat">("activity")
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    fetchHistory()
    fetchSessions()
  }, [userId])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      })
      const data = await response.json()
      setHistory(data.history || [])
      
      const activities = data.history?.length || 0
      const minutes = data.history?.reduce((sum: number, h: HistoryItem) => sum + (h.duration_minutes || 0), 0) || 0
      const avgScore = activities > 0 
        ? data.history?.reduce((sum: number, h: HistoryItem) => sum + (h.score || 0), 0) / activities 
        : 0
      
      setTotalStats({ activities, minutes, avgScore: Math.round(avgScore) })
    } catch (err) {
      console.error("Failed to fetch history:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "list" })
      })
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error("Failed to fetch sessions:", err)
    }
  }

  const fetchSessionMessages = async (sessionId: number) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`${API_URL}/api/session-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      })
      const data = await response.json()
      setSessionMessages(data.messages || [])
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSessionClick = async (session: ChatSession) => {
    setSelectedSession(session)
    await fetchSessionMessages(session.id)
  }

  const closeSessionDetail = () => {
    setSelectedSession(null)
    setSessionMessages([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Lịch sử
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi tiến độ học tập và cuộc trò chuyện
          </p>
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "activity" 
                ? "bg-white dark:bg-gray-700 shadow-md" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Hoạt động
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "chat" 
                ? "bg-white dark:bg-gray-700 shadow-md" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Trò chuyện
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        sessions.length === 0 ? (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Chưa có cuộc trò chuyện nào</h3>
            <p className="text-gray-500">Bắt đầu trò chuyện với AI Coach để xem lịch sử!</p>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {sessions.map((session, idx) => (
                <motion.button
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <MessageCircle className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{session.title || "Cuộc trò chuyện mới"}</h4>
                      <p className="text-sm text-gray-500">
                        {session.updated_at?.slice(0, 16)?.replace("T", " ") || ""}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )
      ) : (
      <>
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <History className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-500">Tổng hoạt động</span>
          </div>
          <p className="text-3xl font-bold">{totalStats.activities}</p>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-gray-500">Phút đã học</span>
          </div>
          <p className="text-3xl font-bold">{totalStats.minutes}</p>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-gray-500">Điểm TB</span>
          </div>
          <p className="text-3xl font-bold">{totalStats.avgScore}%</p>
        </motion.div>
      </div>

      {history.length === 0 ? (
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Chưa có hoạt động nào</h3>
          <p className="text-gray-500">Bắt đầu học tập để theo dõi tiến độ của bạn!</p>
        </motion.div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {history.map((item, idx) => (
              <motion.div 
                key={item.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    item.activity_type === "code" && "bg-blue-100 dark:bg-blue-900/30 text-blue-500",
                    item.activity_type === "system_design" && "bg-purple-100 dark:bg-purple-900/30 text-purple-500",
                    item.activity_type === "frontend" && "bg-pink-100 dark:bg-pink-900/30 text-pink-500",
                    item.activity_type === "backend" && "bg-green-100 dark:bg-green-900/30 text-green-500",
                    item.activity_type === "devops" && "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500",
                    item.activity_type === "soft_skill" && "bg-orange-100 dark:bg-orange-900/30 text-orange-500",
                    item.activity_type === "test" && "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500"
                  )}>
                    {activityIcons[item.activity_type] || <Code2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{item.title}</h4>
                      <span className="text-sm text-gray-500">
                        {item.completed_at?.slice(0, 10) || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.duration_minutes}p
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {item.score}%
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                        {activityLabels[item.activity_type] || item.activity_type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      <AnimatePresence>
        {selectedSession && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSessionDetail}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold">
                  {selectedSession.title || "Cuộc trò chuyện"}
                </h3>
                <button
                  onClick={closeSessionDetail}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-160px)] space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div 
                      className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : sessionMessages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có tin nhắn nào</p>
                ) : (
                  sessionMessages.map((msg, idx) => (
                    <motion.div
                      key={msg.id || idx}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" && "flex-row-reverse"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                        msg.role === "assistant" 
                          ? "bg-gradient-to-br from-indigo-500 to-purple-500" 
                          : "bg-gray-100 dark:bg-gray-700"
                      )}>
                        {msg.role === "assistant" ? (
                          <Bot className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl p-3",
                        msg.role === "assistant" 
                          ? "bg-gray-50 dark:bg-gray-700" 
                          : "bg-indigo-500 text-white"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              {onContinueChat && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => {
                      onContinueChat(selectedSession.id)
                      closeSessionDetail()
                    }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                  >
                    Tiếp tục trò chuyện
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
