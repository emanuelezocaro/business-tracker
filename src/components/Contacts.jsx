import { useState } from 'react';

export const CONTACT_TYPES = [
  { key: 'cliente', label: 'Cliente', color: '#16a34a', bg: '#dcfce7' },
  { key: 'fornitore', label: 'Fornitore', color: '#dc2626', bg: '#fee2e2' },
  { key: 'collaboratore', label: 'Collaboratore', color: '#2563eb', bg: '#dbeafe' },
  { key: 'banca_ente', label: 'Banca / Ente', color: '#7c3aed', bg: '#ede9fe' },
  { key: 'altro', label: 'Altro', color: '#64748b', bg: '#f1f5f9' },
];

export default function Contacts({ contacts, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'cliente', notes: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('tutti');
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd({ name: form.name.trim(), type: form.type, notes: form.notes.trim() });
    setSaving(false);
    setForm({ name: '', type: 'cliente', notes: '' });
    setShowForm(false);
  }

  const filtered = contacts.filter(c => filter === 'tutti' || c.type === filter);

  return (
    <div className="page">
      <div className="page-header-row">
        <h2 className="page-title">Contatti ({contacts.length})</h2>
        <button className="btn-add" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕' : '+ Nuovo'}
        </button>
      </div>

      {showForm && (
        <form className="form card" onSubmit={handleSubmit}>
          <label className="field-label">Nome *</label>
          <input
            className="field-input"
            type="text"
            placeholder="Es. Mario Rossi / Agenzia XYZ"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />

          <label className="field-label">Tipo</label>
          <div className="type-tabs">
            {CONTACT_TYPES.map(t => (
              <button
                key={t.key}
                type="button"
                className={`type-tab ${form.type === t.key ? 'active' : ''}`}
                style={form.type === t.key ? { background: t.color, color: '#fff' } : {}}
                onClick={() => setForm(f => ({ ...f, type: t.key }))}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="field-label">Note (opzionale)</label>
          <input
            className="field-input"
            type="text"
            placeholder="Email, telefono, P.IVA..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvataggio...' : 'Aggiungi contatto'}
          </button>
        </form>
      )}

      <div className="filter-tabs">
        {['tutti', ...CONTACT_TYPES.map(t => t.key)].map(k => {
          const t = CONTACT_TYPES.find(x => x.key === k);
          return (
            <button
              key={k}
              className={`filter-tab ${filter === k ? 'active' : ''}`}
              style={filter === k && k !== 'tutti' ? { background: t.color, color: '#fff', borderColor: 'transparent' } : {}}
              onClick={() => setFilter(k)}
            >
              {k === 'tutti' ? 'Tutti' : t.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          {contacts.length === 0 ? 'Nessun contatto. Clicca "+ Nuovo" per aggiungerne uno.' : 'Nessun contatto in questa categoria.'}
        </div>
      )}

      <div className="entry-list">
        {filtered.map(c => {
          const t = CONTACT_TYPES.find(x => x.key === c.type) || CONTACT_TYPES[4];
          return (
            <div key={c.id} className="entry-card">
              <div className="entry-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="contact-avatar" style={{ background: t.bg, color: t.color }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="entry-desc" style={{ marginBottom: 2 }}>{c.name}</p>
                    <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                  </div>
                </div>
                <div className="entry-actions">
                  {confirmDelete === c.id ? (
                    <>
                      <span className="confirm-text">Eliminare?</span>
                      <button className="btn-danger-sm" onClick={() => { onDelete(c.id); setConfirmDelete(null); }}>Sì</button>
                      <button className="btn-ghost-sm" onClick={() => setConfirmDelete(null)}>No</button>
                    </>
                  ) : (
                    <button className="btn-ghost-sm" onClick={() => setConfirmDelete(c.id)}>Elimina</button>
                  )}
                </div>
              </div>
              {c.notes && <p className="entry-notes" style={{ marginTop: 6 }}>{c.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
