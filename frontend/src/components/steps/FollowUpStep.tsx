import type { ChatMessage, Session } from '../../types'
import { CoachChat } from '../chat/CoachChat'
import { ProgressBar, StepHeader } from '../layout/StepHeader'

interface Props {
  session: Session
  messages: ChatMessage[]
  loading: boolean
  userName?: string
  onSend: (msg: string) => void
}

export function FollowUpStep({ session, messages, loading, userName, onSend }: Props) {
  const behTitles = session.committed.map((b) => b.title).join(' · ')

  return (
    <div className="followup-step">
      <StepHeader
        step={4}
        title="Follow-up với Coach Agent"
        subtitle="Check-in cam kết hành động — chu kỳ 60 ngày"
      />
      <ProgressBar step={4} />
      <div className="plan-banner">
        <p>
          <strong>Chu kỳ 60 ngày đã bắt đầu!</strong>
          <br />
          Cam kết <strong>{session.committed.length} hành vi</strong> · Check-in sau <strong>14 ngày</strong>
          <br />
          <span style={{ fontSize: 12 }}>{behTitles}</span>
        </p>
      </div>
      <CoachChat
        messages={messages}
        loading={loading}
        userName={userName}
        placeholder="Cập nhật tiến độ của bạn..."
        onSend={onSend}
        disabled={loading}
      />
    </div>
  )
}
