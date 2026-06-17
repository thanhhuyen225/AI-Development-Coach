"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Lock, Mail, ArrowRight, LogIn, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = typeof window !== "undefined" 
  ? `${window.location.protocol}//${window.location.host}`
  : "http://localhost:8080"

interface AuthProps {
  onLogin: (userId: number, profile: any) => void
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = isLogin ? "/api/login" : "/api/register"
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        if (isLogin) {
          // Clear old data before setting new user
          localStorage.removeItem("userId")
          localStorage.removeItem("username")
          localStorage.removeItem("password")
          localStorage.removeItem("userProfile")
          
          localStorage.setItem("userId", data.user_id.toString())
          localStorage.setItem("username", username)
          localStorage.setItem("password", password)
          onLogin(data.user_id, data.profile)
        } else {
          setIsLogin(true)
          setError("Đăng ký thành công! Vui lòng đăng nhập.")
        }
      } else {
        setError(data.message || "Đã xảy ra lỗi")
      }
    } catch (err) {
      setError("Không thể kết nối server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">DevCoach AI</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isLogin ? "Đăng nhập để tiếp tục" : "Tạo tài khoản mới"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nhập mật khẩu"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <motion.p 
              className={cn(
                "text-sm p-3 rounded-xl",
                error.includes("thành công") 
                  ? "bg-green-50 text-green-600" 
                  : "bg-red-50 text-red-600"
              )}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div 
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <>
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isLogin ? "Đăng nhập" : "Đăng ký"}
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-gray-400">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError("") }}
            className="text-indigo-500 hover:underline font-medium"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
