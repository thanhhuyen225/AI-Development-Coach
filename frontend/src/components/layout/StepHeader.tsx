import type { ReactNode } from 'react'
import type { Step } from '../../types'

interface Props {
  step: Step
  title: string
  subtitle: ReactNode
}

export function StepHeader({ step, title, subtitle }: Props) {
  return (
    <div className="step-header">
      <span className="step-badge">Bước {step + 1} / 5</span>
      <div>
        <div className="step-title">{title}</div>
        <div className="step-sub">{subtitle}</div>
      </div>
    </div>
  )
}

export function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="prog">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`prog-s${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
        />
      ))}
    </div>
  )
}
