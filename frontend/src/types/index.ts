export interface User {
  id: string
  email: string
  name: string
  currentRole: string
  targetRole: string
  department: string
  createdAt: string
}

export interface UserStats {
  totalSessions: number
  completedPlans: number
  activeFollowUps: number
}

export interface SessionSummary {
  id: string
  title: string
  status: string
  statusLabel: string
  currentRole: string
  targetRole: string
  careerLevel: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  appState: string
  currentRole: string
  targetRole: string
  feedback: string
  careerLevel: string
  strength: StrengthProfile
  convo: Conversation
  guidedSelections: string[]
  plan: DevelopmentPlan
  committed: Behavior[]
  fuHistory: Message[]
}

export interface StrengthProfile {
  primary: string
  secondary: string
  primaryDomain: string
  secondaryDomain: string
  topStrengths: string[]
  source: string
  answers: Record<string, number>
}

export interface Conversation {
  messages: Message[]
  questionCount: number
  dims: Record<string, string>
  completedDims: Record<string, boolean>
  lastDim: string
}

export interface Message {
  role: string
  content: string
}

export interface DevelopmentPlan {
  gaps: Gap[]
  behaviors: Behavior[]
  courses: Course[]
}

export interface Gap {
  title: string
  rootCause: string
}

export interface Behavior {
  title: string
  description: string
  strengthLeverage: string
  frequency: string
  checkpointDays: number
  deadlineDays: number
}

export interface Course {
  courseName: string
  instructor: string
  platform: string
  reason: string
  competency: string
}

export interface CoachReply {
  dimension?: string
  question?: string
  extractedInfo?: string
  readyForAnalysis?: boolean
  triggerGuided?: boolean
  reflectionNote?: string
  systemNote?: string
  hideChatInput?: boolean
  showAnalyze?: boolean
}

export interface StrengthQuestion {
  id: string
  text: string
  opts: string[]
}

export interface StaticData {
  strengthQuestions: StrengthQuestion[]
  guidedOptions: string[]
  careerLevels: Record<string, { label: string; focus: string }>
  dims: string[]
  dimLabels: Record<string, string>
}

export interface ChatMessage {
  role: string
  content: string
  dimension?: string
  timestamp?: string
}

export type Step = 0 | 1 | 2 | 3 | 4

export const DIM_ICONS: Record<string, string> = {
  goal: 'ti-target',
  current_state: 'ti-activity',
  evidence: 'ti-clipboard-list',
  constraint: 'ti-lock',
  motivation: 'ti-heart',
}

export const CAREER_LEVELS_UI = [
  { level: 'L1', title: 'Individual Contributor (L1)', sub: 'Tự thực hiện, phát triển chuyên môn' },
  { level: 'L2', title: 'First-line Manager (L2)', sub: 'Quản lý nhóm IC trực tiếp' },
  { level: 'L3', title: 'Middle Manager (L3)', sub: 'Quản lý function / department' },
  { level: 'L4', title: 'Company Leader (L4)', sub: 'Định hướng chiến lược tổ chức' },
]

// Action Plan types
export interface ActionItem {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: string
  completedAt?: string
  weekNumber: number // 1-12 for 60-day plan
}

export interface ActionPlan {
  id: string
  sessionId: string
  userId: string
  createdAt: string
  updatedAt: string
  currentWeek: number
  totalWeeks: number
  items: ActionItem[]
  goals: {
    current: string
    target: string
  }
}
