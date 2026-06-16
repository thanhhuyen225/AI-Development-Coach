import { useState } from 'react'
import { ProgressBar, StepHeader } from '../layout/StepHeader'

interface Props {
  onNext: (data: {
    currentRole: string
    targetRole: string
    feedback: string
    careerLevel: string
  }) => void
  defaultRole?: string
  defaultTarget?: string
}

export function OnboardingStep({ onNext, defaultRole = '', defaultTarget = '' }: Props) {
  const [currentRole, setCurrentRole] = useState(defaultRole)
  const [targetRole, setTargetRole] = useState(defaultTarget)
  const [feedback, setFeedback] = useState('')
  const [editingGoal, setEditingGoal] = useState(!(defaultRole && defaultTarget))

  const hasSavedGoal = Boolean(defaultRole && defaultTarget)

  const handleNext = () => {
    if (!currentRole.trim() || !targetRole.trim()) {
      alert('Vui lòng điền vai trò hiện tại và mục tiêu.')
      return
    }
    onNext({ currentRole, targetRole, feedback, careerLevel: 'L1' })
  }

  return (
    <div>
      <StepHeader
        step={0}
        title="Thông tin của bạn"
        subtitle="Mục tiêu phát triển sẽ được dùng xuyên suốt các phiên coaching"
      />
      <ProgressBar step={0} />
      <div className="card onboarding-goal-card">
        {hasSavedGoal && !editingGoal ? (
          <div className="goal-summary">
            <div className="goal-summary-icon">
              <i className="ti ti-route" />
            </div>
            <div className="goal-summary-main">
              <div className="section-lbl">Mục tiêu phát triển hiện tại</div>
              <div className="goal-path">
                <span>{defaultRole}</span>
                <i className="ti ti-arrow-right" />
                <span>{defaultTarget}</span>
              </div>
              <p>
                Coach sẽ dùng mục tiêu này cho phiên mới. Chỉ đổi khi bạn đang tập trung vào
                một career goal khác.
              </p>
            </div>
            <button className="btn" onClick={() => setEditingGoal(true)}>
              <i className="ti ti-edit" /> Đổi mục tiêu
            </button>
          </div>
        ) : (
          <div className="goal-form">
            <div className="goal-form-head">
              <div>
                <div className="section-lbl">Thiết lập mục tiêu phát triển</div>
                <h3>{hasSavedGoal ? 'Cập nhật mục tiêu' : 'Bạn đang muốn phát triển theo hướng nào?'}</h3>
                <p>Thông tin này chỉ cần nhập một lần, sau đó sẽ được dùng lại cho các phiên coaching.</p>
              </div>
            </div>
            <div className="field">
              <label>Vai trò hiện tại</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="vd. Software Engineer, Product Manager, Data Analyst..."
              />
            </div>
            <div className="field">
              <label>Vai trò mục tiêu</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="vd. Senior Engineer, Staff Engineer, Senior PM..."
              />
            </div>
          </div>
        )}
        <div className="field">
          <label>
            3 feedback gần đây nhất bạn nhận được{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>
              (không bắt buộc)
            </span>
          </label>
          <div className="helper">
            Từ manager, mentor, đồng nghiệp hoặc người hướng dẫn.
          </div>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="1. Cần chủ động hơn khi làm việc với stakeholder&#10;2. Kỹ năng phân tích tốt nhưng cần cải thiện khả năng trình bày&#10;3. Thực hiện công việc tốt nhưng chưa thể hiện vai trò dẫn dắt"
          />
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={handleNext}>
          Tiếp theo <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
