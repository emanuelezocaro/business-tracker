import { useState, useMemo } from 'react';
import { ENTRY_TYPES, STATUS_OPTIONS, calcNetto } from '../constants';
import { CONTACT_TYPES } from './Contacts';
import EditModal from './EditModal';

function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monthStart() { return localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }
function monthEnd()   { return localDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)); }

function SortTh({ children, col, sortCol, sortDir, onSort, className }) {
  const active = sortCol === col;
  return (
    <div className={`sort-th ${className || ''}`} onClick={() => onSort(col)}>
      {children}
      <span className={`sort-icon${active ? ' active' : ''}`}>
        {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
      </span>
    </div>
  );
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
        {entry.notes && <p className="entry-notes">{entry.notes}</p>}
      </div>

      <div className="ec-contact">
        {entry.contactName && (
          <span className="contact-chip" style={{ background: ct?.bg || '#f1f5f9', color: ct?.color || '#64748b' }}>
            {entry.contactName}
          </span>
        )}
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
        {entry.ivaRate > 0 && (
          <span className="entry-netto">
            netto {fmt(calcNetto(entry.amount, entry.ivaRate))}
          </span>
        )}
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

export default function EntryList({ entries, onDelete, onUpdateStatus, onUpdate, onAdd, contacts, customCategories, projects = [] }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [paymentEntry, setPaymentEntry] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterContact, setFilterContact] = useState('');
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(monthEnd());
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const hasActiveFilters = search || filterType || filterCat || filterStatus || filterContact;

  function resetFilters() {
    setSearch(''); setFilterType(''); setFilterCat(''); setFilterStatus(''); setFilterContact('');
    setDateFrom(monthStart()); setDateTo(monthEnd());
  }

  const cats = useMemo(() =>
    [...new Set(entries.map(e => e.category).filter(Boolean))].sort(),
    [entries]
  );

  const contactList = useMemo(() => {
    const seen = new Set();
    return entries
      .filter(e => e.contactId && e.contactName && !seen.has(e.contactId) && seen.add(e.contactId))
      .map(e => ({ id: e.contactId, name: e.contactName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const dateTotals = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const t = {};
    entries.forEach(e => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      if (from && d < from) return;
      if (to && d > to) return;
      t[e.type] = (t[e.type] || 0) + e.amount;
    });
    return t;
  }, [entries, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;

    return entries
      .filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (filterType && e.type !== filterType) return false;
        if (filterCat && e.category !== filterCat) return false;
        if (filterStatus && e.status !== filterStatus) return false;
        if (filterContact && e.contactId !== filterContact) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            e.description?.toLowerCase().includes(q) ||
            e.category?.toLowerCase().includes(q) ||
            e.contactName?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let va, vb;
        if (sortCol === 'date') {
          va = (a.date?.toDate ? a.date.toDate() : new Date(a.date)).getTime();
          vb = (b.date?.toDate ? b.date.toDate() : new Date(b.date)).getTime();
        } else if (sortCol === 'amount') {
          va = a.amount; vb = b.amount;
        } else if (sortCol === 'description') {
          va = a.description?.toLowerCase() || ''; vb = b.description?.toLowerCase() || '';
        } else if (sortCol === 'category') {
          va = a.category?.toLowerCase() || ''; vb = b.category?.toLowerCase() || '';
        } else if (sortCol === 'type') {
          va = a.type; vb = b.type;
        } else if (sortCol === 'status') {
          va = a.status || ''; vb = b.status || '';
        } else if (sortCol === 'contact') {
          va = a.contactName?.toLowerCase() || ''; vb = b.contactName?.toLowerCase() || '';
        } else return 0;
        return (va < vb ? -1 : va > vb ? 1 : 0) * (sortDir === 'asc' ? 1 : -1);
      });
  }, [entries, dateFrom, dateTo, filterType, filterCat, filterStatus, filterContact, search, sortCol, sortDir]);

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

  return (
    <div className="page">
      <div className="entry-totals">
        {Object.entries(dateTotals).map(([type, val]) => {
          const t = ENTRY_TYPES[type];
          return (
            <div key={type} className="entry-total-chip">
              <span className="entry-total-label">{t.label}</span>
              <span className="entry-total-value" style={{ color: t.color }}>{fmt(val)}</span>
            </div>
          );
        })}
      </div>

      {/* Barra filtri */}
      <div className="filter-bar">
        <div className="filter-bar-row">
          <input
            className="field-input search-input"
            type="search"
            placeholder="Cerca descrizione, categoria, contatto…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-bar-row">
          <div className="filter-date-group">
            <label className="filter-date-label">Dal</label>
            <input className="filter-date-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <label className="filter-date-label">Al</label>
            <input className="filter-date-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          <div className="filter-type-pills">
            <button
              className={`filter-pill ${!filterType ? 'active' : ''}`}
              onClick={() => setFilterType('')}
            >Tutti</button>
            {Object.entries(ENTRY_TYPES).map(([k, t]) => (
              <button
                key={k}
                className={`filter-pill ${filterType === k ? 'active' : ''}`}
                style={filterType === k ? { background: t.color, color: '#fff', borderColor: t.color } : { color: t.color, borderColor: t.color }}
                onClick={() => setFilterType(filterType === k ? '' : k)}
              >{t.icon} {t.label}</button>
            ))}
          </div>
        </div>

        <div className="filter-bar-row">
          <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">Tutte le categorie</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tutti gli stati</option>
            {Object.entries(STATUS_OPTIONS).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>

          {contactList.length > 0 && (
            <select className="filter-select" value={filterContact} onChange={e => setFilterContact(e.target.value)}>
              <option value="">Tutti i contatti</option>
              {contactList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {hasActiveFilters && (
            <button className="btn-ghost-sm filter-reset" onClick={resetFilters}>× Azzera</button>
          )}

          <span className="filter-count">{filtered.length} voci</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">Nessuna voce trovata.</div>
      ) : (
        <div className="entry-table">
          <div className="entry-table-header">
            <SortTh col="type" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-type">Tipo</SortTh>
            <SortTh col="description" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-main">Descrizione</SortTh>
            <SortTh col="contact" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-contact">Contatto</SortTh>
            <SortTh col="category" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-cat">Categoria</SortTh>
            <SortTh col="date" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-date">Data</SortTh>
            <SortTh col="status" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-status">Stato</SortTh>
            <SortTh col="amount" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} className="ec-amount">Importo</SortTh>
            <div className="ec-actions" />
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
          projects={projects}
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
