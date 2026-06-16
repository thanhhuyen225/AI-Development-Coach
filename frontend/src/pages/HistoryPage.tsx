import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { SessionSummary } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function statusClass(status: string) {
  if (status.includes('FOLLOW')) return 'status-followup'
  if (status.includes('PLAN') || status.includes('ANALYSIS')) return 'status-plan'
  if (status.includes('COACH') || status.includes('GUIDED')) return 'status-coaching'
  return 'status-onboard'
}

export function HistoryPage() {
  const { stats, refreshProfile } = useAuth()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = () => {
    setLoading(true)
    api.getHistory()
      .then((res) => setSessions(res.sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleDelete = async (session: SessionSummary) => {
    const ok = window.confirm(`Xóa phiên "${session.title}"? Hành động này không thể hoàn tác.`)
    if (!ok) return
    try {
      await api.deleteSession(session.id)
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      await refreshProfile().catch(() => {})
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xóa phiên này')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Lịch sử coaching</h1>
        <p>Theo dõi các phiên phát triển sự nghiệp của bạn</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{stats?.totalSessions ?? 0}</div>
          <div className="stat-lbl">Tổng phiên</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.completedPlans ?? 0}</div>
          <div className="stat-lbl">Kế hoạch hoàn thành</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.activeFollowUps ?? 0}</div>
          <div className="stat-lbl">Đang follow-up</div>
        </div>
      </div>

      {loading ? (
        <div className="card">Đang tải lịch sử...</div>
      ) : sessions.length === 0 ? (
        <div className="empty-state card">
          <i className="ti ti-message-off" />
          <h3>Chưa có phiên coaching nào</h3>
          <p>Bắt đầu phiên coaching đầu tiên để xây dựng lộ trình phát triển.</p>
          <Link to="/" className="btn btn-primary">Bắt đầu coaching</Link>
        </div>
      ) : (
        <div className="history-list">
          {sessions.map((s) => (
            <div key={s.id} className="history-item card">
              <Link to={`/sessions/${s.id}`} className="history-link history-main-link">
              <div className="history-main">
                <div className="history-title">{s.title}</div>
                <div className="history-meta">
                  <span className={`status-pill ${statusClass(s.status)}`}>{s.statusLabel}</span>
                  <span><i className="ti ti-messages" /> {s.messageCount} tin nhắn</span>
                  {s.careerLevel && <span><i className="ti ti-badge" /> {s.careerLevel}</span>}
                </div>
              </div>
              </Link>
              <div className="history-date">
                <div>{formatDate(s.updatedAt)}</div>
                <div className="history-date-sub">Cập nhật</div>
              </div>
              <button className="history-delete-btn" onClick={() => handleDelete(s)} title="Xóa phiên">
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
