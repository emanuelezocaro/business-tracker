import { useState } from 'react'
import { bestStreak, completionRate, currentStreak } from '../utils/stats'

const PERIODS = [
  { id: 7, label: '7 giorni' },
  { id: 30, label: '30 giorni' },
  { id: 90, label: '90 giorni' },
]

export default function ReportView({ activities, logs }) {
  const [period, setPeriod] = useState(7)

  return (
    <div className="view">
      <div className="segmented">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`segmented__item ${period === p.id ? 'is-active' : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activities.length === 0 ? (
        <p className="empty-state">Aggiungi delle attività per vedere i report.</p>
      ) : (
        <ul className="report-list">
          {activities.map((activity) => {
            const { done, total, pct } = completionRate(logs, activity.id, period)
            const streak = currentStreak(logs, activity.id)
            const best = bestStreak(logs, activity.id)
            return (
              <li key={activity.id} className="report-card">
                <div className="report-card__header">
                  <span aria-hidden="true">{activity.emoji}</span>
                  <span className="report-card__name">{activity.name}</span>
                  <span className="report-card__pct">{pct}%</span>
                </div>
                <div className="report-card__bar">
                  <div className="report-card__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="report-card__meta">
                  <span>
                    {done}/{total} giorni
                  </span>
                  <span>🔥 streak: {streak}</span>
                  <span>🏆 record: {best}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
