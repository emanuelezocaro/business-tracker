import { useState } from 'react'

const EMOJI_CHOICES = ['✅', '📖', '🏃', '🇬🇧', '💼', '🧘', '🎸', '💧', '🥗', '😴', '💻', '🎨']

export default function ActivitiesView({
  activities,
  onAdd,
  onRename,
  onDelete,
  onReorder,
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name, emoji)
    setName('')
    setEmoji(EMOJI_CHOICES[0])
  }

  function startEdit(activity) {
    setEditingId(activity.id)
    setEditName(activity.name)
    setEditEmoji(activity.emoji)
  }

  function saveEdit(id) {
    onRename(id, editName, editEmoji)
    setEditingId(null)
  }

  return (
    <div className="view">
      <form className="add-activity" onSubmit={handleAdd}>
        <div className="add-activity__emoji-picker">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-choice ${emoji === e ? 'is-selected' : ''}`}
              onClick={() => setEmoji(e)}
              aria-label={`Scegli emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="add-activity__row">
          <input
            type="text"
            placeholder="Nuova attività (es. Meditazione)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Aggiungi</button>
        </div>
      </form>

      <ul className="activity-manage-list">
        {activities.map((activity, index) => (
          <li key={activity.id} className="activity-manage-row">
            {editingId === activity.id ? (
              <>
                <div className="add-activity__emoji-picker">
                  {EMOJI_CHOICES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`emoji-choice ${editEmoji === e ? 'is-selected' : ''}`}
                      onClick={() => setEditEmoji(e)}
                      aria-label={`Scegli emoji ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="add-activity__row">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button type="button" onClick={() => saveEdit(activity.id)}>
                    Salva
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="activity-manage-row__emoji" aria-hidden="true">
                  {activity.emoji}
                </span>
                <span className="activity-manage-row__name">{activity.name}</span>
                <div className="activity-manage-row__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onReorder(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Sposta su"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onReorder(index, index + 1)}
                    disabled={index === activities.length - 1}
                    aria-label="Sposta giù"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => startEdit(activity)}
                    aria-label="Modifica"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => {
                      if (confirm(`Eliminare "${activity.name}"? Verrà rimosso anche lo storico.`)) {
                        onDelete(activity.id)
                      }
                    }}
                    aria-label="Elimina"
                  >
                    🗑
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
