import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types'
import { DIM_ICONS } from '../../types'

interface Props {
  messages: ChatMessage[]
  loading?: boolean
  className?: string
}

export function ChatMessages({ messages, loading, className = 'chat-msgs' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages, loading])

  return (
    <div className={className} ref={ref}>
      {messages.map((msg, i) => (
        <div key={i} className={`msg ${msg.role}`}>
          <div className="msg-inner">
            {msg.role === 'ai' && msg.dimension && DIM_ICONS[msg.dimension] && (
              <div className="msg-dim">
                <i className={`ti ${DIM_ICONS[msg.dimension]}`} aria-hidden="true" />
                {msg.dimension.replace('_', ' ')}
              </div>
            )}
            {msg.content.split('\n').map((line, j) => (
              <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
            ))}
          </div>
        </div>
      ))}
      {loading && (
        <div className="typing-wrap">
          <div className="typing">
            <span /><span /><span />
          </div>
        </div>
      )}
    </div>
  )
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Nhập câu trả lời của bạn...',
}: {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const handleSend = (input: HTMLInputElement) => {
    const txt = input.value.trim()
    if (!txt || disabled) return
    input.value = ''
    onSend(txt)
  }

  return (
    <div className="chat-footer">
      <input
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) handleSend(e.currentTarget)
        }}
      />
      <button
        className="send-btn"
        disabled={disabled}
        onClick={(e) => {
          const input = e.currentTarget.previousElementSibling as HTMLInputElement
          handleSend(input)
        }}
      >
        Gửi
      </button>
    </div>
  )
}
