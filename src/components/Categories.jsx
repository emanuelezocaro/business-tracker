import { useState } from 'react';
import { ENTRY_TYPES, DEFAULT_CATEGORIES } from '../constants';

export default function Categories({ categories, onAdd, onDelete }) {
  const [activeType, setActiveType] = useState('ricavo');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const defaults = DEFAULT_CATEGORIES[activeType] || [];
  const custom = categories.filter(c => c.type === activeType);

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const exists = [...defaults, ...custom.map(c => c.name)]
      .some(n => n.toLowerCase() === name.toLowerCase());
    if (exists) { setNewName(''); return; }
    setSaving(true);
    await onAdd({ name, type: activeType });
    setSaving(false);
    setNewName('');
  }

  return (
    <div className="categories-panel">
      {/* Selezione tipo */}
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

      <div className="cat-columns">
        {/* Categorie di default */}
        <div className="cat-group">
          <p className="cat-group-title">Predefinite</p>
          <div className="cat-chips">
            {defaults.map(name => (
              <span key={name} className="cat-chip cat-chip-default">{name}</span>
            ))}
          </div>
        </div>

        {/* Categorie personalizzate */}
        <div className="cat-group">
          <p className="cat-group-title">Personalizzate</p>
          {custom.length === 0 && (
            <p className="cat-empty">Nessuna ancora. Aggiungila qui sotto.</p>
          )}
          <div className="cat-chips">
            {custom.map(c => (
              <span key={c.id} className="cat-chip cat-chip-custom">
                {c.name}
                <button className="cat-chip-del" onClick={() => onDelete(c.id)} title="Elimina">×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form aggiunta */}
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
