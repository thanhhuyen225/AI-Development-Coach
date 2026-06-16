import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Session, ActionItem, SessionSummary } from '../types'

const WEEK_LABELS = [
  'Tuần 1-2: Xây dựng nền tảng',
  'Tuần 3-4: Phát triển kỹ năng',
  'Tuần 5-8: Thực hành & Feedback',
  'Tuần 9-12: Đánh giá & Điều chỉnh',
]

export function ActionPlanPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.getHistory()
        setSessions(data.sessions)
        if (data.sessions.length > 0) {
          const latest = data.sessions[0]
          const session = await api.getSession(latest.id)
          setSelectedSession(session)
          generateActionItems(session)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  function generateActionItems(session: Session) {
    const items: ActionItem[] = []
    const behaviors = session.committed || session.plan?.behaviors || []
    
    // Generate action items from committed behaviors
    behaviors.forEach((behavior, idx) => {
      items.push({
        id: `behavior-${idx}`,
        title: behavior.title,
        description: behavior.description,
        status: 'pending',
        dueDate: new Date(Date.now() + (behavior.deadlineDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
        weekNumber: Math.ceil((behavior.checkpointDays || 7) / 7),
      })
    })

    setActionItems(items)
  }

  const handleSessionChange = async (sessionId: string) => {
    setLoading(true)
    try {
      const session = await api.getSession(sessionId)
      setSelectedSession(session)
      generateActionItems(session)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemStatus = (itemId: string) => {
    setActionItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed'
        return {
          ...item,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
        }
      }
      return item
    }))
  }

  const completedCount = actionItems.filter(i => i.status === 'completed').length
  const progress = actionItems.length > 0 ? Math.round((completedCount / actionItems.length) * 100) : 0

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>📋 Action Plan - Theo dõi tiến độ</h2>
          <Link to="/" className="btn btn-secondary"> Quay lại Coaching</Link>
        </div>

        {sessions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Chọn phiên coaching:
            </label>
            <select 
              value={selectedSession?.id || ''}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="input"
              style={{ width: '100%', maxWidth: '400px' }}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.currentRole} → {s.targetRole} ({new Date(s.updatedAt).toLocaleDateString('vi-VN')})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedSession && (
          <>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600 }}>Tiến độ hoàn thành</span>
                <span style={{ fontWeight: 600, color: '#4CAF50' }}>{progress}%</span>
              </div>
              <div style={{ 
                height: '12px', 
                background: '#e0e0e0', 
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
                {completedCount}/{actionItems.length} hành động đã hoàn thành
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3>Mục tiêu của bạn</h3>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ flex: 1, padding: '16px', background: '#fff3e0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Hiện tại</div>
                  <div style={{ fontWeight: 600 }}>{selectedSession.currentRole}</div>
                </div>
                <div style={{ fontSize: '24px', alignSelf: 'center' }}>→</div>
                <div style={{ flex: 1, padding: '16px', background: '#e8f5e9', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Mục tiêu</div>
                  <div style={{ fontWeight: 600 }}>{selectedSession.targetRole}</div>
                </div>
              </div>
            </div>

            <div>
              <h3>Hành động cần thực hiện</h3>
              {actionItems.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  Chưa có hành động nào. Hoàn thành phiên coaching để nhận action plan.
                </p>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  {WEEK_LABELS.map((label, weekIdx) => {
                    const weekItems = actionItems.filter(item => {
                      const week = Math.ceil(item.weekNumber / 2)
                      return week === weekIdx + 1
                    })
                    if (weekItems.length === 0) return null
                    
                    return (
                      <div key={weekIdx} style={{ marginBottom: '24px' }}>
                        <h4 style={{ color: '#1976d2', marginBottom: '12px' }}>{label}</h4>
                        {weekItems.map(item => (
                          <div 
                            key={item.id}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '12px',
                              padding: '12px',
                              background: item.status === 'completed' ? '#f5f5f5' : '#fff',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.status === 'completed'}
                              onChange={() => toggleItemStatus(item.id)}
                              style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: 500, 
                                textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                                color: item.status === 'completed' ? '#999' : '#333'
                              }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                                {item.description}
                              </div>
                              {item.dueDate && (
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                  Hạn chót: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Bạn chưa có phiên coaching nào.
            </p>
            <Link to="/" className="btn btn-primary">
              Bắt đầu Coaching
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
