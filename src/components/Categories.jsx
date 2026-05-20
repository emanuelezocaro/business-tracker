import { useState } from 'react';
import { ENTRY_TYPES } from '../constants';

export default function Categories({ categories, onAdd, onDelete }) {
  const [activeType, setActiveType] = useState('ricavo');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const custom = categories.filter(c => c.type === activeType);

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const exists = custom.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) { setNewName(''); return; }
    setSaving(true);
    await onAdd({ name, type: activeType });
    setSaving(false);
    setNewName('');
  }

  return (
    <div className="categories-panel">
      <div className="type-tabs">
        {Object.entries(ENTRY_TYPES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className={`type-tab ${activeType === key ? 'active' : ''}`}
            style={activeType === key ? { background: t.color, color: '#fff' } : {}}
            onClick={() => { setActiveType(key); setNewName(''); }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {custom.length === 0 ? (
        <p className="cat-empty">Nessuna categoria per questo tipo. Aggiungila qui sotto.</p>
      ) : (
        <div className="cat-chips">
          {custom.map(c => (
            <span key={c.id} className="cat-chip cat-chip-custom">
              {c.name}
              <button className="cat-chip-del" onClick={() => onDelete(c.id)} title="Elimina">×</button>
            </span>
          ))}
        </div>
      )}

      <form className="cat-add-form" onSubmit={handleAdd}>
        <input
          className="field-input"
          type="text"
          placeholder={`Nuova categoria ${ENTRY_TYPES[activeType].label.toLowerCase()}...`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn-primary" type="submit" disabled={saving || !newName.trim()} style={{ whiteSpace: 'nowrap' }}>
          {saving ? '...' : '+ Aggiungi'}
        </button>
      </form>
    </div>
  );
}
