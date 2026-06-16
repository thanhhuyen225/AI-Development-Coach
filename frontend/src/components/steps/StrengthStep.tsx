import { useState } from 'react'
import { ProgressBar, StepHeader } from '../layout/StepHeader'
import type { StrengthProfile, StrengthQuestion } from '../../types'

interface Props {
  questions: StrengthQuestion[]
  savedStrength?: StrengthProfile
  onBack: () => void
  onNext: (answers: Record<string, number>) => void
  onUseSaved?: () => void
}

export function StrengthStep({ questions, savedStrength, onBack, onNext, onUseSaved }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [retake, setRetake] = useState(false)

  const pickOpt = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  const allAnswered = Object.keys(answers).length >= questions.length
  const hasSavedStrength = Boolean(savedStrength?.source && savedStrength.primaryDomain)

  return (
    <div>
      <StepHeader
        step={1}
        title="Điểm mạnh của bạn"
        subtitle="4 câu hỏi để xác định phong cách làm việc và điểm mạnh tự nhiên"
      />
      <ProgressBar step={1} />
      <div className="card">
        {hasSavedStrength && !retake ? (
          <div className="strength-saved-card">
            <div className="strength-saved-icon">
              <i className="ti ti-sparkles" />
            </div>
            <div className="strength-saved-main">
              <div className="section-lbl">Điểm mạnh đã lưu trong hồ sơ</div>
              <h3>{savedStrength!.primaryDomain}</h3>
              <p>
                Phụ: <strong>{savedStrength!.secondaryDomain}</strong> · Nguồn:{' '}
                {savedStrength!.source === 'quick_discovery' ? 'Quick discovery' : savedStrength!.source}
              </p>
              {savedStrength!.topStrengths.length > 0 && (
                <div className="strength-chip-row">
                  {savedStrength!.topStrengths.map((s) => (
                    <span key={s} className="strength-chip">{s}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="btn-row strength-saved-actions">
              <button className="btn" onClick={() => setRetake(true)}>
                <i className="ti ti-refresh" /> Làm lại
              </button>
              <button className="btn btn-primary" onClick={onUseSaved}>
                Dùng điểm mạnh này <i className="ti ti-arrow-right" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {hasSavedStrength && (
              <div className="helper" style={{ marginBottom: '1rem' }}>
                Bạn đang làm lại quick discovery. Kết quả mới sẽ thay thế điểm mạnh đã lưu cho các phiên sau.
              </div>
            )}
            {questions.map((q, qi) => (
          <div key={q.id} className="sq">
            <div className="sq-text">
              {qi + 1}. {q.text}
            </div>
            <div className="strength-grid">
              {q.opts.map((opt, oi) => (
                <div
                  key={oi}
                  className={`strength-opt${answers[q.id] === oi ? ' selected' : ''}`}
                  onClick={() => pickOpt(q.id, oi)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
            ))}
          </>
        )}
        <div className="btn-row">
          <button className="btn" onClick={onBack}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Quay lại
          </button>
          {(!hasSavedStrength || retake) && (
            <button
              className="btn btn-primary"
              disabled={!allAnswered}
              onClick={() => onNext(answers)}
            >
              Lưu điểm mạnh <i className="ti ti-arrow-right" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
