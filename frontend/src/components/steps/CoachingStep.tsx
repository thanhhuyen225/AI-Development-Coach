import { useState } from 'react'
import type { ChatMessage, CoachReply, Session } from '../../types'
import { DIM_ICONS } from '../../types'
import { CoachChat } from '../chat/CoachChat'
import { ProgressBar, StepHeader } from '../layout/StepHeader'

const STATE_LABELS: Record<string, { label: string; cls: string; icon: string }> = {
  NORMAL_COACHING: { label: 'Đang coaching', cls: 'state-normal', icon: 'ti-message-circle' },
  GUIDED_REFLECTION: { label: 'Guided reflection', cls: 'state-guided', icon: 'ti-alert-triangle' },
  GAP_ANALYSIS: { label: 'Đang phân tích...', cls: 'state-analysis', icon: 'ti-chart-bar' },
  DEVELOPMENT_PLAN: { label: 'Kế hoạch sẵn sàng', cls: 'state-done', icon: 'ti-check' },
  FOLLOW_UP: { label: 'Follow-up', cls: 'state-done', icon: 'ti-refresh' },
}

interface Props {
  session: Session
  dimLabels: Record<string, string>
  dims: string[]
  guidedOptions: string[]
  chatMessages: ChatMessage[]
  hideChatInput: boolean
  showAnalyze: boolean
  showGuided: boolean
  loading: boolean
  analyzing: boolean
  userName?: string
  onSendMessage: (msg: string) => Promise<CoachReply | void>
  onSubmitGuided: (selections: string[]) => void
  onAnalyze: () => void
}

export function CoachingStep({
  session, dimLabels, dims, guidedOptions, chatMessages,
  hideChatInput, showAnalyze, showGuided, loading, analyzing,
  userName, onSendMessage, onSubmitGuided, onAnalyze,
}: Props) {
  const [guidedSelections, setGuidedSelections] = useState<string[]>([])
  const stateInfo = STATE_LABELS[session.appState] || STATE_LABELS.NORMAL_COACHING

  const toggleGuided = (opt: string) => {
    setGuidedSelections((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    )
  }

  return (
    <div className="coaching-step">
      <div className="coaching-step-top">
        <StepHeader
          step={2}
          title="Coaching session"
          subtitle={
            <>
              Trò chuyện với Coach Agent ·{' '}
              <span className={`state-badge ${stateInfo.cls}`}>
                <i className={`ti ${stateInfo.icon}`} style={{ fontSize: 12 }} />
                {stateInfo.label}
              </span>
            </>
          }
        />
        <ProgressBar step={2} />
        <div className="progress-tracker progress-tracker-inline">
          {dims.map((d) => (
            <span key={d} className={`dim-pill${session.convo.completedDims[d] ? ' done' : ' pending'}`}>
              <i className={`ti ${DIM_ICONS[d]}`} />
              {dimLabels[d]}
            </span>
          ))}
        </div>
      </div>

      <CoachChat
        messages={chatMessages}
        loading={loading}
        dimLabels={dimLabels}
        userName={userName}
        hideInput={hideChatInput}
        disabled={loading}
        placeholder="Chia sẻ ví dụ thực tế của bạn..."
        onSend={(msg) => { void onSendMessage(msg) }}
      />

      {showGuided && (
        <div className="card guided-card">
          <h3>Chọn rào cản gần với bạn</h3>
          <p className="guided-sub">Coach Agent sẽ dùng thông tin này để đề xuất hành động phù hợp hơn.</p>
          {guidedOptions.map((opt) => (
            <div
              key={opt}
              className={`check-item${guidedSelections.includes(opt) ? ' checked' : ''}`}
              onClick={() => toggleGuided(opt)}
            >
              <input type="checkbox" checked={guidedSelections.includes(opt)} onChange={() => toggleGuided(opt)} />
              <label>{opt}</label>
            </div>
          ))}
          <div className="btn-row">
            <button className="btn btn-primary" disabled={guidedSelections.length === 0} onClick={() => onSubmitGuided(guidedSelections)}>
              Tiếp tục phân tích <i className="ti ti-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {showAnalyze && (
        <div className="analyze-bar">
          <button className="btn btn-primary btn-block" disabled={analyzing} onClick={onAnalyze}>
            {analyzing ? <><span className="spinner" /> Đang phân tích...</> : 'Phân tích & tạo kế hoạch 60 ngày'}
          </button>
        </div>
      )}
    </div>
  )
}
