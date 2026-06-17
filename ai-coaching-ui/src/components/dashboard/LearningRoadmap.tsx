"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play,
  BookOpen,
  GraduationCap,
  Trophy,
  Star,
  Target,
  Flame,
  Calendar,
  ChevronRight,
  MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Milestone {
  id: string
  title: string
  description: string
  duration: string
  skills: string[]
  status: "completed" | "in-progress" | "locked" | "available"
  progress: number
  lessons: number
  completedLessons: number
}

interface LearningPathProps {
  role: string
  totalDuration: string
  milestones: Milestone[]
}

const samplePaths: LearningPathProps[] = [
  {
    role: "Senior Full-Stack Developer",
    totalDuration: "6 months",
    milestones: [
      {
        id: "m1",
        title: "Advanced JavaScript & TypeScript",
        description: "Master modern JS patterns, TypeScript generics, and advanced types",
        duration: "4 weeks",
        skills: ["TypeScript", "Design Patterns", "Testing"],
        status: "completed",
        progress: 100,
        lessons: 12,
        completedLessons: 12
      },
      {
        id: "m2",
        title: "System Design Fundamentals",
        description: "Learn to design scalable systems, APIs, and data models",
        duration: "6 weeks",
        skills: ["Scalability", "API Design", "Database Design"],
        status: "in-progress",
        progress: 65,
        lessons: 18,
        completedLessons: 12
      },
      {
        id: "m3",
        title: "Cloud & DevOps Essentials",
        description: "Master Docker, Kubernetes, and CI/CD pipelines",
        duration: "6 weeks",
        skills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
        status: "available",
        progress: 0,
        lessons: 20,
        completedLessons: 0
      },
      {
        id: "m4",
        title: "Advanced Frontend Architecture",
        description: "Build scalable React applications with modern patterns",
        duration: "4 weeks",
        skills: ["React", "State Management", "Performance"],
        status: "locked",
        progress: 0,
        lessons: 15,
        completedLessons: 0
      },
      {
        id: "m5",
        title: "Leadership & Mentoring",
        description: "Develop soft skills for leading technical teams",
        duration: "4 weeks",
        skills: ["Communication", "Mentoring", "Technical Writing"],
        status: "locked",
        progress: 0,
        lessons: 10,
        completedLessons: 0
      }
    ]
  }
]

const weeklyStats = [
  { day: "Mon", hours: 2.5, target: 2 },
  { day: "Tue", hours: 1.8, target: 2 },
  { day: "Wed", hours: 3.2, target: 2 },
  { day: "Thu", hours: 2.1, target: 2 },
  { day: "Fri", hours: 1.5, target: 2 },
  { day: "Sat", hours: 4.0, target: 2 },
  { day: "Sun", hours: 2.8, target: 2 },
]

export default function LearningRoadmap() {
  const [selectedPath, setSelectedPath] = useState<LearningPathProps>(samplePaths[0])
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>("m2")

  const totalProgress = Math.round(
    selectedPath.milestones.reduce((sum, m) => sum + (m.completedLessons / m.lessons) * 100, 0) / 
    selectedPath.milestones.length
  )

  const completedCount = selectedPath.milestones.filter(m => m.status === "completed").length
  const inProgressCount = selectedPath.milestones.filter(m => m.status === "in-progress").length

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-5 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Target Role</span>
          </div>
          <p className="font-semibold text-lg">{selectedPath.role}</p>
          <p className="text-sm opacity-80 mt-1">{selectedPath.totalDuration} program</p>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">Progress</span>
          </div>
          <p className="font-semibold text-2xl">{totalProgress}%</p>
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-500">Completed</span>
          </div>
          <p className="font-semibold text-2xl">{completedCount} <span className="text-sm text-gray-400 font-normal">/ {selectedPath.milestones.length}</span></p>
          <p className="text-sm text-emerald-600 mt-1">Milestones done</p>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">This Week</span>
          </div>
          <p className="font-semibold text-2xl">13.9h</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm text-emerald-600">+15% vs last week</span>
          </div>
        </motion.div>
      </div>

      {/* Weekly Activity */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Weekly Learning Activity
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyStats.map((day, idx) => (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
              <motion.div 
                className={cn(
                  "w-full rounded-t-lg relative overflow-hidden",
                  day.hours >= day.target 
                    ? "bg-gradient-to-t from-emerald-500 to-emerald-400" 
                    : "bg-gradient-to-t from-orange-500 to-orange-400"
                )}
                initial={{ height: 0 }}
                animate={{ height: `${Math.min((day.hours / 4) * 100, 100)}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                {day.hours >= day.target && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>
              <span className="text-xs text-gray-500">{day.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Learning Path Timeline */}
      <div className="relative">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-500" />
          Learning Path Timeline
        </h3>
        
        <div className="space-y-0">
          {selectedPath.milestones.map((milestone, idx) => {
            const isSelected = selectedMilestone === milestone.id
            const isCompleted = milestone.status === "completed"
            const isInProgress = milestone.status === "in-progress"
            const isLocked = milestone.status === "locked"
            
            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline Line */}
                {idx < selectedPath.milestones.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                
                <div 
                  className={cn(
                    "flex gap-4 pb-8 cursor-pointer group",
                    isSelected && "bg-indigo-50/50 dark:bg-indigo-900/10 -mx-4 px-4 rounded-2xl"
                  )}
                  onClick={() => !isLocked && setSelectedMilestone(milestone.id)}
                >
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all",
                    isCompleted && "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
                    isInProgress && "bg-gradient-to-br from-indigo-500 to-purple-500 text-white animate-pulse",
                    isLocked && "bg-gray-100 dark:bg-gray-800 text-gray-400",
                    !isLocked && !isCompleted && !isInProgress && "bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-500"
                  )}>
                    {isCompleted && <CheckCircle2 className="w-6 h-6" />}
                    {isInProgress && <Play className="w-5 h-5" />}
                    {isLocked && <Lock className="w-5 h-5" />}
                    {!isLocked && !isCompleted && !isInProgress && <Circle className="w-6 h-6" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "font-semibold",
                            isLocked && "text-gray-400",
                            isInProgress && "text-indigo-600 dark:text-indigo-400"
                          )}>
                            {milestone.title}
                          </h4>
                          {isInProgress && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {milestone.duration}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">
                          {milestone.completedLessons} / {milestone.lessons} lessons
                        </span>
                        <span className="font-medium">{milestone.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          className={cn(
                            "h-full rounded-full",
                            isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {milestone.skills.map(skill => (
                        <span 
                          key={skill}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  {!isLocked && (
                    <ChevronRight className={cn(
                      "w-5 h-5 text-gray-300 dark:text-gray-600 transition-transform",
                      isSelected && "rotate-90 text-indigo-500"
                    )} />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Selected Milestone Details */}
      <AnimatePresence>
        {selectedMilestone && (
          <motion.div
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">
                  {selectedPath.milestones.find(m => m.id === selectedMilestone)?.title}
                </h4>
                <p className="text-sm text-gray-500">
                  {selectedPath.milestones.find(m => m.id === selectedMilestone)?.duration} •{" "}
                  {selectedPath.milestones.find(m => m.id === selectedMilestone)?.lessons} lessons
                </p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                <Play className="w-4 h-4" />
                Continue Learning
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Next Lesson", value: "API Design Patterns", icon: BookOpen },
                { label: "Est. Time", value: "45 minutes", icon: Clock },
                { label: "Difficulty", value: "Intermediate", icon: GraduationCap },
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <p className="font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
