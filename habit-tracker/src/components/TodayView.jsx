import { useState } from 'react'
import { addDays, formatFullDate, isFuture, isSameDay, toISODate } from '../utils/date'

export default function TodayView({ activities, logs, onToggle }) {
  const [cursor, setCursor] = useState(() => new Date())
  const iso = toISODate(cursor)
  const dayLog = logs[iso] || {}
  const isToday = isSameDay(cursor, new Date())
  const nextDisabled = isFuture(addDays(cursor, 1))

  return (
    <div className="view">
      <div className="day-switcher">
        <button
          type="button"
          className="day-switcher__arrow"
          onClick={() => setCursor((d) => addDays(d, -1))}
          aria-label="Giorno precedente"
        >
          ‹
        </button>
        <div className="day-switcher__label">
          <strong>{isToday ? 'Oggi' : formatFullDate(cursor)}</strong>
          {!isToday && <span className="day-switcher__sub">{formatFullDate(cursor)}</span>}
        </div>
        <button
          type="button"
          className="day-switcher__arrow"
          onClick={() => setCursor((d) => addDays(d, 1))}
          disabled={nextDisabled}
          aria-label="Giorno successivo"
        >
          ›
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="empty-state">
          Nessuna attività ancora. Aggiungine una dalla scheda "Attività".
        </p>
      ) : (
        <ul className="habit-list">
          {activities.map((activity) => {
            const done = !!dayLog[activity.id]
            return (
              <li key={activity.id}>
                <button
                  type="button"
                  className={`habit-row ${done ? 'is-done' : ''}`}
                  onClick={() => onToggle(iso, activity.id)}
                >
                  <span className="habit-row__emoji" aria-hidden="true">
                    {activity.emoji}
                  </span>
                  <span className="habit-row__name">{activity.name}</span>
                  <span className="habit-row__check">{done ? '✓' : ''}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
