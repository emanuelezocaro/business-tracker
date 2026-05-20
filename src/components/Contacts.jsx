import { useState } from 'react';
import Categories from './Categories';

export const CONTACT_TYPES = [
  { key: 'cliente', label: 'Cliente', color: '#16a34a', bg: '#dcfce7' },
  { key: 'fornitore', label: 'Fornitore', color: '#dc2626', bg: '#fee2e2' },
  { key: 'collaboratore', label: 'Collaboratore', color: '#2563eb', bg: '#dbeafe' },
  { key: 'banca_ente', label: 'Banca / Ente', color: '#7c3aed', bg: '#ede9fe' },
  { key: 'altro', label: 'Altro', color: '#64748b', bg: '#f1f5f9' },
];

const TYPE_COUNTS = (contacts) => {
  const counts = {};
  contacts.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });
  return counts;
};

export default function Contacts({ contacts, onAdd, onDelete, categories, onAddCategory, onDeleteCategory }) {
  const [section, setSection] = useState('contatti');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'cliente', notes: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('tutti');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd({ name: form.name.trim(), type: form.type, notes: form.notes.trim() });
    setSaving(false);
    setForm({ name: '', type: 'cliente', notes: '' });
    setShowForm(false);
  }

  const counts = TYPE_COUNTS(contacts);
  const filtered = contacts.filter(c => {
    const matchType = filter === 'tutti' || c.type === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.notes?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="page">
      <div className="page-header-row">
        <h2 className="page-title">Gestione</h2>
        {section === 'contatti' && (
          <button className="btn-add" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Chiudi' : '+ Nuovo'}
          </button>
        )}
      </div>

      {/* Sotto-navigazione */}
      <div className="subnav">
        <button className={`subnav-btn ${section === 'contatti' ? 'active' : ''}`} onClick={() => setSection('contatti')}>
          Contatti <span className="subnav-badge">{contacts.length}</span>
        </button>
        <button className={`subnav-btn ${section === 'categorie' ? 'active' : ''}`} onClick={() => setSection('categorie')}>
          Categorie <span className="subnav-badge">{categories?.length || 0} custom</span>
        </button>
      </div>

      {section === 'categorie' && (
        <div className="card">
          <Categories
            categories={categories || []}
            onAdd={onAddCategory}
            onDelete={onDeleteCategory}
          />
        </div>
      )}

      {section === 'contatti' && (<>

      {/* Sommario per tipo */}
      <div className="contact-summary">
        {CONTACT_TYPES.map(t => (
          <div key={t.key} className="contact-summary-chip" style={{ background: t.bg, color: t.color }}>
            <span className="cs-count">{counts[t.key] || 0}</span>
            <span className="cs-label">{t.label}{(counts[t.key] || 0) !== 1 ? 'i' : 'e'}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <form className="form card" onSubmit={handleSubmit}>
          <div className="contacts-form-row">
            <div className="contacts-form-col">
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
            </div>
            <div className="contacts-form-col">
              <label className="field-label">Note</label>
              <input
                className="field-input"
                type="text"
                placeholder="Email, telefono, P.IVA..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
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
          <button className="btn-primary" type="submit" disabled={saving} style={{ maxWidth: 200 }}>
            {saving ? 'Salvataggio...' : 'Aggiungi contatto'}
          </button>
        </form>
      )}

      <div className="contacts-toolbar">
        <input
          className="field-input search-input"
          type="search"
          placeholder="Cerca contatto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
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
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          {contacts.length === 0 ? 'Nessun contatto. Clicca "+ Nuovo" per aggiungerne uno.' : 'Nessun contatto trovato.'}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="contacts-table">
          <div className="contacts-table-header">
            <div className="cc-avatar" />
            <div className="cc-name">Nome</div>
            <div className="cc-type">Tipo</div>
            <div className="cc-notes">Note</div>
            <div className="cc-actions" />
          </div>
          {filtered.map(c => {
            const t = CONTACT_TYPES.find(x => x.key === c.type) || CONTACT_TYPES[4];
            return (
              <div key={c.id} className="contact-row">
                <div className="cc-avatar">
                  <span className="contact-avatar" style={{ background: t.bg, color: t.color }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="cc-name">
                  <span className="contact-name">{c.name}</span>
                </div>
                <div className="cc-type">
                  <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                </div>
                <div className="cc-notes">
                  {c.notes && <span className="contact-notes-text">{c.notes}</span>}
                </div>
                <div className="cc-actions">
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
            );
          })}
        </div>
      )}
      </>)}
    </div>
  );
}
