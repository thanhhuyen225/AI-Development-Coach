import { useEffect, useRef } from 'react'
import { COACH } from '../../constants/coach'
import type { ChatMessage } from '../../types'

interface Props {
  messages: ChatMessage[]
  loading?: boolean
  dimLabels?: Record<string, string>
  userName?: string
  placeholder?: string
  onSend?: (text: string) => void
  disabled?: boolean
  hideInput?: boolean
}

function formatTime(ts?: string) {
  const d = ts ? new Date(ts) : new Date()
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function userInitials(name?: string) {
  if (!name) return 'B'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function CoachChat({
  messages, loading, dimLabels, userName, placeholder = 'Nhập tin nhắn...',
  onSend, disabled, hideInput,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages, loading])

  const handleSend = () => {
    const inp = inputRef.current
    if (!inp || !onSend) return
    const txt = inp.value.trim()
    if (!txt || disabled) return
    inp.value = ''
    onSend(txt)
  }

  return (
    <div className="messenger">
      <div className="messenger-header">
        <div className="coach-avatar">{COACH.initials}</div>
        <div className="messenger-header-info">
          <div className="messenger-coach-name">{COACH.name}</div>
          <div className="messenger-coach-status">
            <span className="online-dot" />
            {COACH.title} · Đang online
          </div>
        </div>
        <div className="messenger-header-actions">
          <i className="ti ti-dots-vertical" />
        </div>
      </div>

      <div className="messenger-body" ref={ref}>
        <div className="messenger-date-divider">
          <span>Hôm nay</span>
        </div>

        {messages.map((msg, i) => {
          if (msg.role === 'system-note') {
            return (
              <div key={i} className="messenger-system">
                <div className="messenger-system-bubble">{msg.content}</div>
              </div>
            )
          }
          if (msg.role === 'warning-note') {
            return (
              <div key={i} className="messenger-warning">
                <div className="messenger-warning-bubble">
                  <strong><i className="ti ti-alert-triangle" /> Cần thêm thông tin</strong>
                  <p>{msg.content}</p>
                </div>
              </div>
            )
          }

          const isUser = msg.role === 'user'
          return (
            <div key={i} className={`messenger-row${isUser ? ' is-user' : ' is-coach'}`}>
              {!isUser && <div className="coach-avatar coach-avatar-xs">{COACH.initials}</div>}
              <div className="messenger-bubble-wrap">
                {!isUser && msg.dimension && dimLabels?.[msg.dimension] && (
                  <div className="messenger-dim-tag">
                    <i className={`ti ti-tag`} /> {dimLabels[msg.dimension]}
                  </div>
                )}
                <div className={`messenger-bubble${isUser ? ' bubble-user' : ' bubble-coach'}`}>
                  {msg.content.split('\n').map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}
                </div>
                <div className="messenger-time">{formatTime(msg.timestamp)}</div>
              </div>
              {isUser && <div className="user-avatar-xs">{userInitials(userName)}</div>}
            </div>
          )
        })}

        {loading && (
          <div className="messenger-row is-coach">
            <div className="coach-avatar coach-avatar-xs">{COACH.initials}</div>
            <div className="messenger-bubble-wrap">
              <div className="messenger-bubble bubble-coach bubble-typing">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
              <div className="messenger-typing-label">{COACH.name} đang nhập...</div>
            </div>
          </div>
        )}
      </div>

      {!hideInput && onSend && (
        <div className="messenger-footer">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
          />
          <button className="messenger-send" disabled={disabled} onClick={handleSend}>
            <i className="ti ti-send" />
          </button>
        </div>
      )}
    </div>
  )
}
