import { useState } from 'react';
import { ENTRY_TYPES, STATUS_OPTIONS } from '../constants';
import { CONTACT_TYPES } from './Contacts';

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EntryList({ entries, onDelete, onUpdateStatus }) {
  const [filter, setFilter] = useState('tutti');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = entries.filter(e => {
    const matchType = filter === 'tutti' || e.type === filter;
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  async function handleDelete(id) {
    await onDelete(id);
    setConfirmDelete(null);
  }

  return (
    <div className="page">
      <h2 className="page-title">Voci ({filtered.length})</h2>

      <input
        className="field-input search-input"
        type="search"
        placeholder="Cerca per descrizione o categoria..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="filter-tabs">
        {['tutti', ...Object.keys(ENTRY_TYPES)].map(t => (
          <button
            key={t}
            className={`filter-tab ${filter === t ? 'active' : ''}`}
            style={filter === t && t !== 'tutti' ? { background: ENTRY_TYPES[t].color, color: '#fff' } : {}}
            onClick={() => setFilter(t)}
          >
            {t === 'tutti' ? 'Tutti' : ENTRY_TYPES[t].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">Nessuna voce trovata.</div>
      )}

      <div className="entry-list">
        {filtered.map(entry => {
          const t = ENTRY_TYPES[entry.type];
          const needsStatus = entry.type === 'credito' || entry.type === 'debito';
          return (
            <div key={entry.id} className="entry-card">
              <div className="entry-header">
                <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>
                  {t.icon} {t.label}
                </span>
                <span className="entry-amount" style={{ color: t.color }}>{fmt(entry.amount)}</span>
              </div>
              <p className="entry-desc">{entry.description}</p>
              <div className="entry-meta">
                <span className="entry-cat">{entry.category}</span>
                <span className="entry-date">{fmtDate(entry.date)}</span>
              </div>
              {needsStatus && (
                <div className="entry-status-row">
                  <select
                    className="status-select"
                    value={entry.status}
                    onChange={e => onUpdateStatus(entry.id, e.target.value)}
                    style={{ color: STATUS_OPTIONS[entry.status]?.color }}
                  >
                    {Object.entries(STATUS_OPTIONS).map(([k, s]) => (
                      <option key={k} value={k}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {entry.contactName && (() => {
                const ct = CONTACT_TYPES.find(x => x.key === entry.contactType);
                return (
                  <div className="entry-contact">
                    <span className="contact-chip" style={{ background: ct?.bg || '#f1f5f9', color: ct?.color || '#64748b' }}>
                      {entry.contactName}
                    </span>
                  </div>
                );
              })()}
              {entry.notes && <p className="entry-notes">{entry.notes}</p>}
              <div className="entry-actions">
                {confirmDelete === entry.id ? (
                  <>
                    <span className="confirm-text">Eliminare?</span>
                    <button className="btn-danger-sm" onClick={() => handleDelete(entry.id)}>Sì</button>
                    <button className="btn-ghost-sm" onClick={() => setConfirmDelete(null)}>No</button>
                  </>
                ) : (
                  <button className="btn-ghost-sm" onClick={() => setConfirmDelete(entry.id)}>Elimina</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
