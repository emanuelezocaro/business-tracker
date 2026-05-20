import { useState } from 'react';
import { ENTRY_TYPES, STATUS_OPTIONS } from '../constants';
import { CONTACT_TYPES } from './Contacts';
import EditModal from './EditModal';

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EntryRow({ entry, onDelete, onUpdateStatus, onEdit, onPartialPayment, confirmDelete, setConfirmDelete }) {
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
        {(entry.linkedEntryDescription || entry.linkedRevenueDescription) && (
          <span className="contact-chip linked-revenue-chip">
            ↑ {entry.linkedEntryDescription || entry.linkedRevenueDescription}
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
            onChange={e => onUpdateStatus(entry.id, e.target.value, entry.type)}
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
          <>
            <button className="btn-icon" onClick={() => onEdit(entry)} title="Modifica">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            {needsStatus && (
              <button className="btn-icon btn-icon-success" onClick={() => onPartialPayment(entry)} title={entry.type === 'credito' ? 'Registra incasso' : 'Registra pagamento'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>
                </svg>
              </button>
            )}
            <button className="btn-icon btn-icon-danger" onClick={() => setConfirmDelete(entry.id)} title="Elimina">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function EntryList({ entries, onDelete, onUpdateStatus, onUpdate, onAdd, contacts, customCategories }) {
  const [filter, setFilter] = useState('tutti');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [paymentEntry, setPaymentEntry] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  async function handlePartialPayment() {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || amount > paymentEntry.amount) return;
    setSavingPayment(true);
    try {
      const remaining = Math.round((paymentEntry.amount - amount) * 100) / 100;
      if (amount >= paymentEntry.amount) {
        await onUpdateStatus(paymentEntry.id, 'completato', paymentEntry.type);
      } else {
        const newType = paymentEntry.type === 'credito' ? 'ricavo' : 'costo';
        await onAdd({
          type: newType,
          amount: String(amount),
          description: paymentEntry.description,
          category: paymentEntry.category || '',
          contactName: paymentEntry.contactName || '',
          contactId: paymentEntry.contactId || '',
          contactType: paymentEntry.contactType || '',
          date: new Date().toISOString().split('T')[0],
          linkedEntryId: paymentEntry.id,
          linkedEntryDescription: paymentEntry.description,
          linkedEntryType: paymentEntry.type,
          notes: '',
        });
        await onUpdate(paymentEntry.id, { amount: String(remaining) });
      }
      setPaymentEntry(null);
      setPaymentAmount('');
    } finally {
      setSavingPayment(false);
    }
  }

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
              onEdit={setEditEntry}
              onPartialPayment={setPaymentEntry}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {editEntry && (
        <EditModal
          entry={editEntry}
          contacts={contacts || []}
          customCategories={customCategories || []}
          entries={entries}
          onSave={onUpdate}
          onClose={() => setEditEntry(null)}
        />
      )}

      {paymentEntry && (
        <div className="modal-overlay" onClick={() => { setPaymentEntry(null); setPaymentAmount(''); }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {paymentEntry.type === 'credito' ? 'Registra incasso' : 'Registra pagamento'}
              </span>
              <button className="modal-close" onClick={() => { setPaymentEntry(null); setPaymentAmount(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form">
                <div className="payment-entry-info">
                  <span className="field-label">Voce</span>
                  <p className="payment-entry-desc">{paymentEntry.description}</p>
                  <p className="payment-entry-total">Totale residuo: <strong>{fmt(paymentEntry.amount)}</strong></p>
                </div>
                <div>
                  <label className="field-label">Importo {paymentEntry.type === 'credito' ? 'incassato' : 'pagato'}</label>
                  <input
                    className="field-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={paymentEntry.amount}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    autoFocus
                    placeholder="0,00"
                  />
                </div>
                {paymentAmount && parseFloat(paymentAmount) < paymentEntry.amount && (
                  <p className="payment-remaining-hint">
                    Residuo dopo: <strong>{fmt(Math.round((paymentEntry.amount - parseFloat(paymentAmount)) * 100) / 100)}</strong>
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    disabled={savingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > paymentEntry.amount}
                    onClick={handlePartialPayment}
                  >
                    {savingPayment ? '...' : 'Registra'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
