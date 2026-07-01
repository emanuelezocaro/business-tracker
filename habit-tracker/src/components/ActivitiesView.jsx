import { useRef, useState } from 'react'
import { shareOrDownloadText } from '../utils/shareFile'

const EMOJI_CHOICES = ['✅', '📖', '🏃', '🇬🇧', '💼', '🧘', '🎸', '💧', '🥗', '😴', '💻', '🎨']

export default function ActivitiesView({
  activities,
  onAdd,
  onRename,
  onDelete,
  onReorder,
  onExport,
  onImport,
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [backupMessage, setBackupMessage] = useState('')
  const fileInputRef = useRef(null)

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

  async function handleExport() {
    const today = new Date().toISOString().slice(0, 10)
    const shared = await shareOrDownloadText(`weekly-backup-${today}.json`, onExport())
    setBackupMessage(shared ? 'Backup esportato ✓' : '')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(String(reader.result))
        setBackupMessage('Backup importato ✓')
      } catch {
        setBackupMessage('File di backup non valido')
      }
    }
    reader.readAsText(file)
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

      <div className="backup-card">
        <h2 className="backup-card__title">Backup dati</h2>
        <p className="backup-card__hint">
          Esporta un file con tutte le tue attività e lo storico: salvalo su iCloud/Files e
          importalo se cambi telefono.
        </p>
        <div className="backup-card__actions">
          <button type="button" onClick={handleExport}>
            Esporta backup
          </button>
          <button type="button" className="backup-card__secondary" onClick={handleImportClick}>
            Importa backup
          </button>
        </div>
        {backupMessage && <p className="backup-card__message">{backupMessage}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          hidden
        />
      </div>
    </div>
  )
}
