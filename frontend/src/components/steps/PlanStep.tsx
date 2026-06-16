import { useState } from 'react'
import { ProgressBar, StepHeader } from '../layout/StepHeader'
import type { Session } from '../../types'

interface Props {
  session: Session
  onBack: () => void
  onCommit: (indices: number[]) => void
}

export function PlanStep({ session, onBack, onCommit }: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(session.plan.behaviors.map((_, i) => i)),
  )

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleCommit = () => {
    if (selected.size === 0) {
      alert('Hãy chọn ít nhất 1 hành vi.')
      return
    }
    onCommit(Array.from(selected))
  }

  return (
    <div>
      <StepHeader
        step={3}
        title="Gap analysis & kế hoạch phát triển"
        subtitle="Dựa trên coaching session của bạn"
      />
      <ProgressBar step={3} />

      <div className="card" style={{ marginBottom: 10 }}>
        <div className="section-lbl">Năng lực cần phát triển</div>
        {session.plan.gaps.map((g, i) => (
          <div key={i} className="gap-item">
            <div className="gap-title">{g.title}</div>
            <div className="gap-root">{g.rootCause}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div className="section-lbl">3 thay đổi hành vi</div>
        {session.plan.behaviors.map((b, i) => (
          <div key={i} className="beh-card">
            <div className="beh-num">Hành vi {i + 1}</div>
            <div className="beh-title">{b.title}</div>
            <div className="beh-desc">{b.description}</div>
            {b.strengthLeverage && (
              <div className="beh-leverage">
                <i className="ti ti-star" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />
                {b.strengthLeverage}
              </div>
            )}
            <div className="beh-tags">
              <span className="beh-tag">
                <i className="ti ti-refresh" style={{ fontSize: 11 }} aria-hidden="true" /> {b.frequency}
              </span>
              <span className="beh-tag">
                <i className="ti ti-calendar" style={{ fontSize: 11 }} aria-hidden="true" /> Check-in ngày {b.checkpointDays}
              </span>
              <span className="beh-tag">
                <i className="ti ti-clock" style={{ fontSize: 11 }} aria-hidden="true" /> {b.deadlineDays} ngày
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div className="section-lbl">Tài nguyên học tập</div>
        {session.plan.courses.map((c, i) => (
          <div key={i} className="course-card">
            <div className="course-title">{c.courseName}</div>
            <div className="course-meta">{c.instructor} · {c.platform}</div>
            <div className="course-reason">{c.reason}</div>
            <span className="course-comp">{c.competency}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-lbl">Cam kết thực hiện (chọn behaviors)</div>
        {session.plan.behaviors.map((b, i) => (
          <label key={i} className="commit-row">
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggle(i)}
            />
            <span>
              <strong>{b.title}</strong>
              <br />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{b.frequency}</span>
            </span>
          </label>
        ))}
        <div className="btn-row">
          <button className="btn" onClick={onBack}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Quay lại
          </button>
          <button className="btn btn-primary" onClick={handleCommit}>
            Xác nhận cam kết <i className="ti ti-check" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
