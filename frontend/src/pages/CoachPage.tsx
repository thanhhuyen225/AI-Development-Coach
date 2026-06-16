import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { OnboardingStep } from '../components/steps/OnboardingStep'
import { StrengthStep } from '../components/steps/StrengthStep'
import { CoachingStep } from '../components/steps/CoachingStep'
import { PlanStep } from '../components/steps/PlanStep'
import { FollowUpStep } from '../components/steps/FollowUpStep'
import type { ChatMessage, CoachReply, Session, SessionSummary, StaticData, Step } from '../types'

function buildChatMessages(session: Session | null, extra: ChatMessage[] = []): ChatMessage[] {
  if (!session) return extra
  const msgs: ChatMessage[] = session.convo.messages.map((m) => ({
    role: m.role === 'assistant' ? 'ai' : m.role,
    content: m.content,
    timestamp: new Date().toISOString(),
  }))
  return [...msgs, ...extra]
}

function stepFromSession(session: Session): Step {
  if (session.appState === 'FOLLOW_UP') return 4
  if (session.appState === 'DEVELOPMENT_PLAN') return 3
  if (
    session.appState === 'NORMAL_COACHING' ||
    session.appState === 'GUIDED_REFLECTION' ||
    session.appState === 'GAP_ANALYSIS' ||
    session.convo.messages.length > 0
  ) return 2
  if (session.strength.source || session.strength.primaryDomain) return 1
  return 0
}

export function CoachPage() {
  const { user, refreshProfile } = useAuth()
  const { sessionId: routeSessionId } = useParams()
  const [searchParams] = useSearchParams()
  const forceNewSession = searchParams.get('new') === '1'
  const [step, setStep] = useState<Step>(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [staticData, setStaticData] = useState<StaticData | null>(null)
  const [chatExtra, setChatExtra] = useState<ChatMessage[]>([])
  const [fuMessages, setFuMessages] = useState<ChatMessage[]>([])
  const [hideChatInput, setHideChatInput] = useState(false)
  const [showAnalyze, setShowAnalyze] = useState(false)
  const [showGuided, setShowGuided] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const restoreSession = useCallback((loadedSession: Session) => {
    setSessionId(loadedSession.id)
    setSession(loadedSession)
    setStep(stepFromSession(loadedSession))
    setChatExtra([])
    setShowGuided(false)
    setHideChatInput(loadedSession.appState === 'DEVELOPMENT_PLAN' || loadedSession.appState === 'FOLLOW_UP')
    setShowAnalyze(loadedSession.appState === 'GAP_ANALYSIS')
    if (loadedSession.appState === 'FOLLOW_UP') {
      setFuMessages(loadedSession.fuHistory.map((m) => ({
        role: m.role === 'assistant' ? 'ai' : m.role,
        content: m.content,
        timestamp: loadedSession.updatedAt,
      })))
    } else {
      setFuMessages([])
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const staticRes = await api.getStaticData()
        setStaticData(staticRes)

        if (forceNewSession) {
          setSessionId(null)
          setSession(null)
          setStep(0)
          setChatExtra([])
          setFuMessages([])
          setHideChatInput(false)
          setShowAnalyze(false)
          setShowGuided(false)
          return
        }

        if (routeSessionId) {
          const loadedSession = await api.getSession(routeSessionId)
          restoreSession(loadedSession)
          return
        }

        const history = await api.getHistory().catch(() => ({ sessions: [] as SessionSummary[] }))
        const sameGoalSession = history.sessions.find((s) =>
          user?.currentRole &&
          user?.targetRole &&
          s.currentRole === user.currentRole &&
          s.targetRole === user.targetRole,
        )
        const latestSession = sameGoalSession ?? history.sessions[0]
        if (latestSession) {
          const loadedSession = await api.getSession(latestSession.id)
          restoreSession(loadedSession)
          return
        }
      } catch (e) {
        setInitError(e instanceof Error ? e.message : 'Failed to initialize')
      }
    }
    void init()
  }, [forceNewSession, restoreSession, routeSessionId, user?.currentRole, user?.targetRole])

  const handleCoachReply = useCallback((reply: CoachReply) => {
    // Note: Messages are already stored in session.convo.messages by backend
    // We only need chatExtra for system notes and warnings, not for regular AI responses
    const extras: ChatMessage[] = []
    const ts = new Date().toISOString()

    if (reply.triggerGuided) {
      extras.push({
        role: 'warning-note',
        content: 'Bạn có thể chọn các vấn đề gần với mình nhất bên dưới.',
        timestamp: ts,
      })
      setShowGuided(true)
      setHideChatInput(true)
      setChatExtra(extras)
      return
    }

    // Only add system notes and special messages to chatExtra
    // Regular AI questions are already in session.convo.messages from backend
    if (reply.systemNote) {
      extras.push({ role: 'system-note', content: reply.systemNote, timestamp: ts })
    }
    if (reply.hideChatInput) setHideChatInput(true)
    if (reply.showAnalyze) setShowAnalyze(true)
    
    if (extras.length > 0) {
      setChatExtra(extras)
    }
  }, [])

  const handleOnboarding = async (data: {
    currentRole: string; targetRole: string; feedback: string; careerLevel: string
  }) => {
    let activeSessionId = sessionId
    const goalChanged = Boolean(
      session &&
      (session.currentRole || session.targetRole) &&
      (session.currentRole !== data.currentRole || session.targetRole !== data.targetRole),
    )
    if (!activeSessionId || goalChanged) {
      const created = await api.createSession()
      activeSessionId = created.id
      setSessionId(created.id)
      setSession(created.session)
    }
    const updated = await api.updateOnboarding(activeSessionId, data)
    setSession(updated)
    await refreshProfile().catch(() => {})
    setStep(1)
  }

  const handleStrength = async (answers: Record<string, number>) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const { session: updated } = await api.submitStrength(sessionId, answers)
      setSession(updated)
      setStep(2)
      setChatExtra([])
      setHideChatInput(false)
      setShowAnalyze(false)
      setShowGuided(false)
      const { reply, session: coached } = await api.startCoaching(sessionId)
      setSession(coached)
      handleCoachReply(reply)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi khi bắt đầu coaching')
    } finally {
      setLoading(false)
    }
  }

  const handleUseSavedStrength = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      setStep(2)
      setChatExtra([])
      setHideChatInput(false)
      setShowAnalyze(false)
      setShowGuided(false)
      const { reply, session: coached } = await api.startCoaching(sessionId)
      setSession(coached)
      handleCoachReply(reply)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi khi bắt đầu coaching')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!sessionId) return
    setLoading(true)
    // Don't add user message to chatExtra - it will come from session.convo.messages after API returns
    try {
      const { reply, session: updated } = await api.sendCoachMessage(sessionId, message)
      setSession(updated)
      handleCoachReply(reply)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi khi gửi tin nhắn')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitGuided = async (selections: string[]) => {
    if (!sessionId) return
    await api.submitGuided(sessionId, selections)
    setShowGuided(false)
    setChatExtra((prev) => [
      ...prev,
      { role: 'system-note', content: 'Đã ghi nhận. Tiến hành phân tích...', timestamp: new Date().toISOString() },
    ])
    setShowAnalyze(true)
    void handleAnalyze()
  }

  const handleAnalyze = async () => {
    if (!sessionId) return
    setAnalyzing(true)
    try {
      const { session: updated } = await api.runAnalysis(sessionId)
      setSession(updated)
      setStep(3)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Có lỗi, vui lòng thử lại.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCommit = async (indices: number[]) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const updated = await api.commitBehaviors(sessionId, indices)
      setSession(updated)
      setStep(4)
      const { reply } = await api.startFollowUp(sessionId)
      setFuMessages([{ role: 'ai', content: reply, timestamp: new Date().toISOString() }])
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi khi cam kết')
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUp = async (message: string) => {
    if (!sessionId) return
    setLoading(true)
    const ts = new Date().toISOString()
    setFuMessages((prev) => [...prev, { role: 'user', content: message, timestamp: ts }])
    try {
      const { reply } = await api.sendFollowUp(sessionId, message)
      setFuMessages((prev) => [...prev, { role: 'ai', content: reply, timestamp: new Date().toISOString() }])
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi follow-up')
    } finally {
      setLoading(false)
    }
  }

  if (initError) {
    return (
      <div className="page">
        <div className="card">
          <p>Không thể kết nối backend: {initError}</p>
        </div>
      </div>
    )
  }

  if (!staticData || (step !== 0 && !session)) {
    return <div className="page"><div className="card">Đang tải...</div></div>
  }

  const chatMessages = buildChatMessages(session, chatExtra)

  return (
    <div className="coach-page">
      {step === 0 && <OnboardingStep onNext={handleOnboarding} defaultRole={user?.currentRole} defaultTarget={user?.targetRole} />}
      {step === 1 && (
        <StrengthStep
          questions={staticData.strengthQuestions}
          savedStrength={session?.strength}
          onBack={() => setStep(0)}
          onNext={handleStrength}
          onUseSaved={handleUseSavedStrength}
        />
      )}
      {step === 2 && (
        <CoachingStep
          session={session!}
          dimLabels={staticData.dimLabels}
          dims={staticData.dims}
          guidedOptions={staticData.guidedOptions}
          chatMessages={chatMessages}
          hideChatInput={hideChatInput}
          showAnalyze={showAnalyze}
          showGuided={showGuided}
          loading={loading}
          analyzing={analyzing}
          userName={user?.name}
          onSendMessage={handleSendMessage}
          onSubmitGuided={handleSubmitGuided}
          onAnalyze={handleAnalyze}
        />
      )}
      {step === 3 && (
        <PlanStep session={session!} onBack={() => setStep(2)} onCommit={handleCommit} />
      )}
      {step === 4 && (
        <FollowUpStep
          session={session!}
          messages={fuMessages}
          loading={loading}
          userName={user?.name}
          onSend={handleFollowUp}
        />
      )}
    </div>
  )
}
