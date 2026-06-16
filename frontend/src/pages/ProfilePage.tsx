import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export function ProfilePage() {
  const { user, stats, refreshProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [currentRole, setCurrentRole] = useState(user?.currentRole ?? '')
  const [targetRole, setTargetRole] = useState(user?.targetRole ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await api.updateProfile({ name, currentRole, targetRole, department })
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Hồ sơ của bạn</h1>
        <p>Thông tin cá nhân và mục tiêu phát triển</p>
      </div>

      <div className="profile-grid">
        <div className="card profile-card-main">
          <div className="profile-hero">
            <div className="profile-avatar-lg">{initials}</div>
            <div>
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
              <p className="profile-since">
                Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
              </p>
            </div>
          </div>

          <div className="profile-stats-inline">
            <div><strong>{stats?.totalSessions ?? 0}</strong> phiên coaching</div>
            <div><strong>{stats?.completedPlans ?? 0}</strong> kế hoạch</div>
            <div><strong>{stats?.activeFollowUps ?? 0}</strong> follow-up</div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-lbl">Chỉnh sửa hồ sơ</h3>
          <div className="field">
            <label>Họ tên</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Vai trò hiện tại</label>
            <input type="text" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="Software Engineer" />
          </div>
          <div className="field">
            <label>Vai trò mục tiêu</label>
            <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Senior Engineer" />
          </div>
          <div className="field">
            <label>Phòng ban / Function</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" />
          </div>
          <div className="btn-row">
            {saved && <span className="save-ok"><i className="ti ti-check" /> Đã lưu</span>}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
