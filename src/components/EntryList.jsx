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

function EntryRow({ entry, onDelete, onUpdateStatus, confirmDelete, setConfirmDelete }) {
  const t = ENTRY_TYPES[entry.type];
  const needsStatus = entry.type === 'credito' || entry.type === 'debito';
  const ct = CONTACT_TYPES.find(x => x.key === entry.contactType);

  return (
    <div className="entry-card">
      <div className="ec-type">
        <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>
          {t.icon} {t.label}
        </span>
      </div>

      <div className="ec-main">
        <span className="entry-desc">{entry.description}</span>
        {entry.contactName && (
          <span className="contact-chip" style={{ background: ct?.bg || '#f1f5f9', color: ct?.color || '#64748b' }}>
            {entry.contactName}
          </span>
        )}
        {entry.linkedRevenueDescription && (
          <span className="contact-chip linked-revenue-chip">
            ↑ {entry.linkedRevenueDescription}
          </span>
        )}
        {entry.notes && <p className="entry-notes">{entry.notes}</p>}
      </div>

      <div className="ec-cat">
        <span className="entry-cat">{entry.category}</span>
      </div>

      <div className="ec-date">{fmtDate(entry.date)}</div>

      <div className="ec-status">
        {needsStatus ? (
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
        ) : null}
      </div>

      <div className="ec-amount">
        <span className="entry-amount" style={{ color: t.color }}>{fmt(entry.amount)}</span>
      </div>

      <div className="ec-actions">
        {confirmDelete === entry.id ? (
          <>
            <span className="confirm-text">Eliminare?</span>
            <button className="btn-danger-sm" onClick={() => { onDelete(entry.id); setConfirmDelete(null); }}>Sì</button>
            <button className="btn-ghost-sm" onClick={() => setConfirmDelete(null)}>No</button>
          </>
        ) : (
          <button className="btn-ghost-sm" onClick={() => setConfirmDelete(entry.id)}>Elimina</button>
        )}
      </div>
    </div>
  );
}

export default function EntryList({ entries, onDelete, onUpdateStatus }) {
  const [filter, setFilter] = useState('tutti');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = entries.filter(e => {
    const matchType = filter === 'tutti' || e.type === filter;
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase()) || e.contactName?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="page">
      <h2 className="page-title">Voci ({filtered.length})</h2>

      <input
        className="field-input search-input"
        type="search"
        placeholder="Cerca descrizione, categoria, contatto..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="filter-tabs">
        {['tutti', ...Object.keys(ENTRY_TYPES)].map(t => (
          <button
            key={t}
            className={`filter-tab ${filter === t ? 'active' : ''}`}
            style={filter === t && t !== 'tutti' ? { background: ENTRY_TYPES[t].color, color: '#fff', borderColor: 'transparent' } : {}}
            onClick={() => setFilter(t)}
          >
            {t === 'tutti' ? 'Tutti' : ENTRY_TYPES[t].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">Nessuna voce trovata.</div>
      )}

      {/* Header tabella — solo desktop */}
      {filtered.length > 0 && (
        <div className="entry-table">
          <div className="entry-table-header">
            <div className="ec-type">Tipo</div>
            <div className="ec-main">Descrizione</div>
            <div className="ec-cat">Categoria</div>
            <div className="ec-date">Data</div>
            <div className="ec-status">Stato</div>
            <div className="ec-amount">Importo</div>
            <div className="ec-actions"></div>
          </div>
          {filtered.map(entry => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
