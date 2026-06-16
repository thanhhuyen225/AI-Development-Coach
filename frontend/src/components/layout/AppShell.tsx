import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { COACH } from '../../constants/coach'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="ti ti-brain" /></div>
          <div>
            <div className="brand-title">AI Coach</div>
            <div className="brand-sub">Development</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item nav-item-button" onClick={() => navigate('/?new=1')}>
            <i className="ti ti-plus" />
            <span>Tạo phiên mới</span>
          </button>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-message-circle" />
            <span>Coaching</span>
          </NavLink>
          <NavLink to="/action-plan" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-checkbox" />
            <span>Action Plan</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-history" />
            <span>Lịch sử</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-user" />
            <span>Hồ sơ</span>
          </NavLink>
        </nav>

        <div className="sidebar-coach">
          <div className="coach-avatar coach-avatar-sm">{COACH.initials}</div>
          <div>
            <div className="coach-name-sm">{COACH.name}</div>
            <div className="coach-status-sm"><span className="online-dot" /> Online</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
            <i className="ti ti-logout" />
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  )
}
