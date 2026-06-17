"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Target, 
  Zap, 
  Brain, 
  Code2, 
  Database, 
  Cloud, 
  GitBranch, 
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Search,
  Sparkles,
  TrendingUp,
  BookOpen,
  Lightbulb,
  Users,
  Terminal,
  Layout,
  Server,
  Shield,
  Workflow
} from "lucide-react"
import { ProgressRing, SkillBar, StatusBadge, AlertBanner } from "@/components/ui/Progress"
import { cn } from "@/lib/utils"

const skillCategories = {
  technical: {
    title: "Technical Skills",
    icon: Code2,
    skills: [
      { name: "JavaScript/TypeScript", current: 75, target: 90 },
      { name: "React/Next.js", current: 70, target: 90 },
      { name: "Node.js", current: 65, target: 85 },
      { name: "Python", current: 45, target: 80 },
      { name: "System Design", current: 40, target: 85 },
      { name: "Databases", current: 60, target: 80 },
    ]
  },
  soft: {
    title: "Soft Skills",
    icon: Users,
    skills: [
      { name: "Communication", current: 70, target: 85 },
      { name: "Problem Solving", current: 80, target: 95 },
      { name: "Team Collaboration", current: 75, target: 90 },
      { name: "Time Management", current: 60, target: 80 },
      { name: "Mentoring", current: 30, target: 70 },
    ]
  },
  tools: {
    title: "Tools & Platforms",
    icon: Terminal,
    skills: [
      { name: "Git/CI/CD", current: 80, target: 90 },
      { name: "Docker/K8s", current: 35, target: 75 },
      { name: "AWS/GCP", current: 40, target: 80 },
      { name: "Testing", current: 55, target: 85 },
      { name: "Linux", current: 50, target: 75 },
    ]
  }
}

const rolePaths = [
  { 
    id: "senior-dev", 
    title: "Senior Developer", 
    currentLevel: "Mid-Level Developer",
    timeline: "6 months",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500"
  },
  { 
    id: "tech-lead", 
    title: "Tech Lead", 
    currentLevel: "Senior Developer",
    timeline: "12 months",
    icon: Target,
    color: "from-purple-500 to-pink-500"
  },
  { 
    id: "architect", 
    title: "Software Architect", 
    currentLevel: "Tech Lead",
    timeline: "18 months",
    icon: Brain,
    color: "from-cyan-500 to-blue-500"
  },
]

export default function GapAnalysis() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeSkills = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 2000)
  }

  const filteredSkills: Record<string, typeof skillCategories.technical> = {}
  Object.entries(skillCategories).forEach(([category, data]) => {
    filteredSkills[category] = {
      ...data,
      skills: data.skills.filter(skill => 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  })

  const totalCurrent = Object.values(skillCategories).reduce((sum, cat) => 
    sum + cat.skills.reduce((s, skill) => s + skill.current, 0), 0
  )
  const totalTarget = Object.values(skillCategories).reduce((sum, cat) => 
    sum + cat.skills.reduce((s, skill) => s + skill.target, 0), 0
  )
  const overallProgress = Math.round((totalCurrent / totalTarget) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Gap Analysis Engine
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Identify skill gaps and create personalized learning paths
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={analyzeSkills}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            {isAnalyzing ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ProgressRing value={overallProgress} size={140} strokeWidth={10} />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(skillCategories).map(([key, category], idx) => {
              const categoryCurrent = category.skills.reduce((s, sk) => s + sk.current, 0)
              const categoryTarget = category.skills.reduce((s, sk) => s + sk.target, 0)
              const categoryProgress = Math.round((categoryCurrent / categoryTarget) * 100)
              
              return (
                <div key={key} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <category.icon className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                  <p className="text-2xl font-bold">{categoryProgress}%</p>
                  <p className="text-xs text-gray-500">{category.title}</p>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Alert Banner */}
      <AlertBanner 
        type="info"
        message="Your profile shows 45% skill gap overall. Focus on Python and System Design to accelerate your path to Senior Developer."
      />

      {/* Skill Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(filteredSkills).map(([categoryKey, category], categoryIdx) => (
          <motion.div
            key={categoryKey}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIdx * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
                <category.icon className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="font-semibold">{category.title}</h3>
            </div>
            <div className="space-y-4">
              {category.skills.map((skill, idx) => {
                const gap = skill.target - skill.current
                const isCritical = gap >= 30
                
                return (
                  <motion.div 
                    key={skill.name}
                    className={cn(
                      "p-3 rounded-xl border",
                      isCritical 
                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" 
                        : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: categoryIdx * 0.1 + idx * 0.05 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{skill.name}</span>
                      {isCritical && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          Critical Gap
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            isCritical ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${(skill.current / skill.target) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {skill.current}% → {skill.target}%
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role Paths */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Target Role Paths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rolePaths.map((role, idx) => (
            <motion.button
              key={role.id}
              onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
              className={cn(
                "p-5 rounded-2xl text-left transition-all border",
                selectedRole === role.id
                  ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-xl bg-gradient-to-br", role.color)}>
                  <role.icon className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-gray-400 transition-transform",
                  selectedRole === role.id && "rotate-90"
                )} />
              </div>
              <h4 className="font-semibold mt-3">{role.title}</h4>
              <p className="text-sm text-gray-500 mt-1">From: {role.currentLevel}</p>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 font-medium">{role.timeline}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Selected Role Details */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Recommended Learning Path for {rolePaths.find(r => r.id === selectedRole)?.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { phase: "Phase 1", title: "Foundation", duration: "4 weeks", items: ["Complete Python basics", "Learn System Design fundamentals", "Practice data structures"] },
                { phase: "Phase 2", title: "Core Skills", duration: "6 weeks", items: ["Build full-stack projects", "Master CI/CD pipelines", "Learn containerization"] },
                { phase: "Phase 3", title: "Advanced", duration: "8 weeks", items: ["Design distributed systems", "Implement microservices", "Lead team projects"] },
              ].map((phase, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                      {phase.phase}
                    </span>
                    <span className="text-xs text-gray-500">{phase.duration}</span>
                  </div>
                  <h5 className="font-semibold">{phase.title}</h5>
                  <ul className="mt-3 space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
