import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { COACH } from '../constants/coach'

export function LoginPage() {
  const { login, register, token, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && token) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-hero">
          <div className="coach-avatar coach-avatar-lg">{COACH.initials}</div>
          <h1>{COACH.name}</h1>
          <p className="login-tagline">{COACH.tagline}</p>
          <ul className="login-features">
            <li><i className="ti ti-check" /> Coaching 1:1 theo hành trình của bạn</li>
            <li><i className="ti ti-check" /> Kế hoạch phát triển 60 ngày có hành động cụ thể</li>
            <li><i className="ti ti-check" /> Lưu lịch sử và theo dõi tiến độ</li>
          </ul>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p className="login-sub">
            {mode === 'login' ? 'Tiếp tục hành trình phát triển của bạn' : 'Bắt đầu hành trình phát triển sự nghiệp'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="field">
                <label>Họ tên</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" required />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </form>

          <p className="login-switch">
            {mode === 'login' ? (
              <>Chưa có tài khoản? <button type="button" onClick={() => setMode('register')}>Đăng ký</button></>
            ) : (
              <>Đã có tài khoản? <button type="button" onClick={() => setMode('login')}>Đăng nhập</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
