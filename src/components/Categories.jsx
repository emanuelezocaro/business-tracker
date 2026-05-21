import { useState } from 'react';
import { ENTRY_TYPES } from '../constants';

function EditCategoryModal({ category, onSave, onClose }) {
  const types = Array.isArray(category.types) ? category.types : category.type ? [category.type] : [];
  const [name, setName] = useState(category.name);
  const [selectedTypes, setSelectedTypes] = useState(types);
  const [saving, setSaving] = useState(false);

  function toggle(key) {
    setSelectedTypes(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || selectedTypes.length === 0) return;
    setSaving(true);
    await onSave(category.id, { name: name.trim(), types: selectedTypes });
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3 className="modal-title">Modifica categoria</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <label className="field-label">Nome *</label>
            <input className="field-input" type="text" value={name}
              onChange={e => setName(e.target.value)} required autoFocus />

            <label className="field-label">Valida per</label>
            <div className="cat-type-checkboxes">
              {Object.entries(ENTRY_TYPES).map(([key, t]) => (
                <label key={key} className={`cat-type-check ${selectedTypes.includes(key) ? 'selected' : ''}`}
                  style={selectedTypes.includes(key) ? { background: t.bg, color: t.color, borderColor: t.color } : {}}>
                  <input type="checkbox" checked={selectedTypes.includes(key)} onChange={() => toggle(key)} />
                  {t.icon} {t.label}
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>Annulla</button>
              <button className="btn-primary" type="submit" disabled={saving || !name.trim() || selectedTypes.length === 0} style={{ flex: 1 }}>
                {saving ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getTypes(c) {
  if (Array.isArray(c.types)) return c.types;
  if (c.type) return [c.type];
  return [];
}

export default function Categories({ categories, onAdd, onUpdate, onDelete }) {
  const [filterType, setFilterType] = useState('tutti');
  const [newName, setNewName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['ricavo', 'costo', 'credito', 'debito']);
  const [saving, setSaving] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  function toggleType(key) {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  }

  const visible = categories.filter(c => {
    if (filterType === 'tutti') return true;
    return getTypes(c).includes(filterType);
  });

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || selectedTypes.length === 0) return;
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) { setNewName(''); return; }
    setSaving(true);
    await onAdd({ name, types: selectedTypes });
    setSaving(false);
    setNewName('');
  }

  return (
    <div className="categories-panel">

      {/* Filtro per tipo */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filterType === 'tutti' ? 'active' : ''}`} onClick={() => setFilterType('tutti')}>
          Tutte ({categories.length})
        </button>
        {Object.entries(ENTRY_TYPES).map(([key, t]) => {
          const count = categories.filter(c => getTypes(c).includes(key)).length;
          return (
            <button key={key} className={`filter-tab ${filterType === key ? 'active' : ''}`}
              style={filterType === key ? { background: t.color, color: '#fff', borderColor: 'transparent' } : {}}
              onClick={() => setFilterType(key)}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista categorie */}
      {visible.length === 0 ? (
        <p className="cat-empty">Nessuna categoria. Aggiungila qui sotto.</p>
      ) : (
        <div className="cat-list">
          {visible.map(c => {
            const types = getTypes(c);
            return (
              <div key={c.id} className="cat-row-item">
                <div className="cat-row-item-left">
                  <span className="cat-name">{c.name}</span>
                  <div className="cat-type-dots">
                    {Object.entries(ENTRY_TYPES).map(([key, t]) => (
                      types.includes(key) ? (
                        <span key={key} className="cat-type-dot" style={{ background: t.color }} title={t.label} />
                      ) : null
                    ))}
                  </div>
                  <div className="cat-type-badges">
                    {types.map(key => {
                      const t = ENTRY_TYPES[key];
                      if (!t) return null;
                      return (
                        <span key={key} className="entry-type-badge" style={{ background: t.bg, color: t.color, fontSize: 10, padding: '2px 6px' }}>
                          {t.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-icon" onClick={() => setEditCategory(c)} title="Modifica">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="btn-icon btn-icon-danger" onClick={() => onDelete(c.id)} title="Elimina">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editCategory && (
        <EditCategoryModal
          category={editCategory}
          onSave={async (id, data) => { await onUpdate(id, data); setEditCategory(null); }}
          onClose={() => setEditCategory(null)}
        />
      )}

      {/* Form aggiunta */}
      <form className="cat-add-form-full" onSubmit={handleAdd}>
        <div className="cat-add-row">
          <input
            className="field-input"
            type="text"
            placeholder="Nome categoria..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" type="submit"
            disabled={saving || !newName.trim() || selectedTypes.length === 0}
            style={{ whiteSpace: 'nowrap' }}>
            {saving ? '...' : '+ Aggiungi'}
          </button>
        </div>
        <div className="cat-type-checkboxes">
          <span className="field-label" style={{ marginBottom: 0 }}>Valida per:</span>
          {Object.entries(ENTRY_TYPES).map(([key, t]) => (
            <label key={key} className={`cat-type-check ${selectedTypes.includes(key) ? 'selected' : ''}`}
              style={selectedTypes.includes(key) ? { background: t.bg, color: t.color, borderColor: t.color } : {}}>
              <input type="checkbox" checked={selectedTypes.includes(key)} onChange={() => toggleType(key)} />
              {t.icon} {t.label}
            </label>
          ))}
        </div>
      </form>
    </div>
  );
}
