"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ProgressRing({ value, size = 120, strokeWidth = 8, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  
  const getColor = () => {
    if (value >= 80) return "#10b981"
    if (value >= 60) return "#f59e0b"
    return "#ef4444"
  }
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value}%
        </motion.span>
      </div>
    </div>
  )
}

interface SkillBarProps {
  name: string
  value: number
  category: "technical" | "soft" | "tools"
}

export function SkillBar({ name, value, category }: SkillBarProps) {
  const getCategoryColor = () => {
    switch (category) {
      case "technical": return "from-blue-500 to-cyan-400"
      case "soft": return "from-purple-500 to-pink-400"
      case "tools": return "from-amber-500 to-orange-400"
    }
  }
  
  const getCategoryBg = () => {
    switch (category) {
      case "technical": return "bg-blue-500"
      case "soft": return "bg-purple-500"
      case "tools": return "bg-amber-500"
    }
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-gray-500">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getCategoryColor())}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-emerald-500" />
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }
  
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon()}
              <span className={cn(
                "text-sm font-medium",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-gray-400"
              )}>
                {change > 0 ? "+" : ""}{change}%
              </span>
              <span className="text-sm text-gray-400">vs last week</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

interface StatusBadgeProps {
  status: "completed" | "in-progress" | "not-started" | "blocked"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    "in-progress": { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    "not-started": { icon: Minus, color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-800" },
    blocked: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
  }
  
  const { icon: Icon, color, bg } = config[status]
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", bg, color)}>
      <Icon className="w-3.5 h-3.5" />
      {status === "in-progress" ? "In Progress" : status.replace("-", " ").charAt(0).toUpperCase() + status.replace("-", " ").slice(1)}
    </span>
  )
}

interface AlertBannerProps {
  type: "warning" | "error" | "success" | "info"
  message: string
}

export function AlertBanner({ type, message }: AlertBannerProps) {
  const config = {
    warning: { icon: AlertCircle, bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200" },
    error: { icon: XCircle, bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" },
    success: { icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" },
    info: { icon: AlertCircle, bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" },
  }
  
  const { icon: Icon, bg } = config[type]
  
  return (
    <motion.div 
      className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", bg)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </motion.div>
  )
}
