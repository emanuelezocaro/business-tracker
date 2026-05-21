import { useState, useMemo, useEffect } from 'react';
import { ENTRY_TYPES, buildCategories, STATUS_OPTIONS, IVA_RATES, calcNetto, calcLordo, calcIva } from '../constants';
import { CONTACT_TYPES } from './Contacts';
import { PerCategoria } from './Analysis';

export const PROJECT_STATUSES = {
  in_corso:   { label: 'In corso',   color: '#2563eb', bg: '#dbeafe' },
  completato: { label: 'Completato', color: '#16a34a', bg: '#dcfce7' },
  sospeso:    { label: 'Sospeso',    color: '#d97706', bg: '#fef3c7' },
};

function fmt(n = 0) {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

function fmtPreview(n) {
  if (!n || isNaN(n)) return '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const today = () => new Date().toISOString().split('T')[0];

/** Calcola il valore da mostrare in base al flag lordo/netto */
function val(e, showNetto) {
  return showNetto ? calcNetto(e.amount || 0, e.ivaRate || 0) : (e.amount || 0);
}

function getStats(project, entries, showNetto = false) {
  const pe = entries.filter(e => e.projectId === project.id);
  const ricavi  = pe.filter(e => e.type === 'ricavo') .reduce((s, e) => s + val(e, showNetto), 0);
  const crediti = pe.filter(e => e.type === 'credito').reduce((s, e) => s + val(e, showNetto), 0);
  const costi   = pe.filter(e => e.type === 'costo')  .reduce((s, e) => s + val(e, showNetto), 0);
  const debiti  = pe.filter(e => e.type === 'debito') .reduce((s, e) => s + val(e, showNetto), 0);
  const fatturato = ricavi + crediti;
  const projectValue = showNetto ? calcNetto(project.value || 0, project.ivaRate || 0) : (project.value || 0);
  const daFatturare = Math.max(0, projectValue - fatturato);
  const margineOggi = ricavi - costi;
  const margineCompletamento = (ricavi + crediti) - (costi + debiti);
  const pct = projectValue ? Math.min(100, Math.round((fatturato / projectValue) * 100)) : 0;
  return { ricavi, crediti, costi, debiti, fatturato, daFatturare, margineOggi, margineCompletamento, pct, projectEntries: pe, projectValue };
}

/* ── Toggle Lordo/Netto ─────────────────────────────── */
function NettoToggle({ showNetto, onChange }) {
  return (
    <div className="netto-toggle">
      <button
        className={`netto-pill${!showNetto ? ' active' : ''}`}
        onClick={() => onChange(false)}
      >Lordo</button>
      <button
        className={`netto-pill${showNetto ? ' active' : ''}`}
        onClick={() => onChange(true)}
      >Netto</button>
    </div>
  );
}

// ── Nuovo progetto ────────────────────────────────────

function NewProjectModal({ contacts, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', contactId: '', value: '', ivaRate: 22, ivaMode: 'lordo', status: 'in_corso', notes: '' });
  const [saving, setSaving] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  const amountNum  = parseFloat(form.value);
  const hasIva     = form.ivaRate > 0 && form.value && !isNaN(amountNum);
  const lordoVal   = hasIva ? (form.ivaMode === 'netto' ? calcLordo(amountNum, form.ivaRate) : amountNum) : null;
  const nettoVal   = hasIva ? (form.ivaMode === 'lordo' ? calcNetto(amountNum, form.ivaRate) : amountNum) : null;
  const ivaValPrev = hasIva ? calcIva(lordoVal, form.ivaRate) : null;
  const savedValue = hasIva && form.ivaMode === 'netto' ? lordoVal : amountNum;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.value) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    await onSave({
      name:        form.name,
      contactId:   form.contactId || null,
      contactName: contact?.name  || null,
      contactType: contact?.type  || null,
      value:       savedValue || 0,  // sempre lordo
      ivaRate:     form.ivaRate,
      status:      form.status,
      notes:       form.notes,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Nuovo progetto</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <label className="field-label">Nome progetto *</label>
            <input className="field-input" type="text" placeholder="Es. Sito web Azienda X"
              value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />

            <label className="field-label">Cliente</label>
            <select className="field-input" value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">Nessuno</option>
              {contacts.map(c => {
                const t = CONTACT_TYPES.find(x => x.key === c.type);
                return <option key={c.id} value={c.id}>{c.name} — {t?.label || c.type}</option>;
              })}
            </select>

            {/* Valore concordato + IVA */}
            <div className="amount-iva-row">
              <div className="amount-iva-col">
                <div className="field-label-row">
                  <label className="field-label">Concordato * ({form.ivaMode === 'lordo' ? 'lordo' : 'netto'})</label>
                  <div className="ln-toggle">
                    <button type="button" className={`ln-pill${form.ivaMode === 'lordo' ? ' active' : ''}`} onClick={() => set('ivaMode', 'lordo')}>Lordo</button>
                    <button type="button" className={`ln-pill${form.ivaMode === 'netto' ? ' active' : ''}`} onClick={() => set('ivaMode', 'netto')}>Netto</button>
                  </div>
                </div>
                <input className="field-input" type="number" inputMode="decimal" placeholder="0,00" min="0" step="0.01"
                  value={form.value} onChange={e => set('value', e.target.value)} required />
              </div>
              <div className="amount-iva-col amount-iva-col--iva">
                <label className="field-label">IVA sul valore</label>
                <div className="iva-pills">
                  {IVA_RATES.map(r => (
                    <button key={r.value} type="button"
                      className={`iva-pill${form.ivaRate === r.value ? ' active' : ''}`}
                      onClick={() => set('ivaRate', r.value)}
                    >{r.label}</button>
                  ))}
                </div>
              </div>
            </div>
            {hasIva && (
              <div className="iva-breakdown">
                {form.ivaMode === 'lordo' ? (
                  <>
                    <span>Scorpora IVA {form.ivaRate}% → <strong>{fmtPreview(ivaValPrev)}</strong></span>
                    <span className="iva-breakdown-netto">Imponibile: <strong>{fmtPreview(nettoVal)}</strong></span>
                  </>
                ) : (
                  <>
                    <span>Netto: <strong>{fmtPreview(amountNum)}</strong></span>
                    <span>IVA {form.ivaRate}%: <strong>{fmtPreview(ivaValPrev)}</strong></span>
                    <span className="iva-breakdown-netto">Lordo salvato: <strong>{fmtPreview(lordoVal)}</strong></span>
                  </>
                )}
              </div>
            )}

            <label className="field-label">Stato</label>
            <select className="field-input" value={form.status} onChange={e => set('status', e.target.value)}>
              {Object.entries(PROJECT_STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>

            <label className="field-label">Note (opzionale)</label>
            <textarea className="field-input field-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>Annulla</button>
              <button className="btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Salvataggio...' : 'Crea progetto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Modifica progetto ─────────────────────────────────

function EditProjectModal({ project, contacts, onSave, onClose }) {
  const [form, setForm] = useState({
    name:      project.name      || '',
    contactId: project.contactId || '',
    value:     project.value != null ? String(project.value) : '',
    ivaRate:   project.ivaRate   ?? 22,
    ivaMode:   'lordo',  // in modifica si parte da lordo (valore già salvato)
    status:    project.status    || 'in_corso',
    notes:     project.notes     || '',
  });
  const [saving, setSaving] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  const amountNum  = parseFloat(form.value);
  const hasIva     = form.ivaRate > 0 && form.value && !isNaN(amountNum);
  const lordoVal   = hasIva ? (form.ivaMode === 'netto' ? calcLordo(amountNum, form.ivaRate) : amountNum) : null;
  const nettoVal   = hasIva ? (form.ivaMode === 'lordo' ? calcNetto(amountNum, form.ivaRate) : amountNum) : null;
  const ivaValPrev = hasIva ? calcIva(lordoVal, form.ivaRate) : null;
  const savedValue = hasIva && form.ivaMode === 'netto' ? lordoVal : amountNum;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.value) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    await onSave(project.id, {
      name:        form.name,
      contactId:   form.contactId || null,
      contactName: contact?.name  || null,
      contactType: contact?.type  || null,
      value:       savedValue || 0,  // sempre lordo
      ivaRate:     form.ivaRate,
      status:      form.status,
      notes:       form.notes,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Modifica progetto</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <label className="field-label">Nome progetto *</label>
            <input className="field-input" type="text" value={form.name}
              onChange={e => set('name', e.target.value)} required autoFocus />

            <label className="field-label">Cliente</label>
            <select className="field-input" value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">Nessuno</option>
              {contacts.map(c => {
                const t = CONTACT_TYPES.find(x => x.key === c.type);
                return <option key={c.id} value={c.id}>{c.name} — {t?.label || c.type}</option>;
              })}
            </select>

            <div className="amount-iva-row">
              <div className="amount-iva-col">
                <div className="field-label-row">
                  <label className="field-label">Concordato * ({form.ivaMode === 'lordo' ? 'lordo' : 'netto'})</label>
                  <div className="ln-toggle">
                    <button type="button" className={`ln-pill${form.ivaMode === 'lordo' ? ' active' : ''}`} onClick={() => set('ivaMode', 'lordo')}>Lordo</button>
                    <button type="button" className={`ln-pill${form.ivaMode === 'netto' ? ' active' : ''}`} onClick={() => set('ivaMode', 'netto')}>Netto</button>
                  </div>
                </div>
                <input className="field-input" type="number" inputMode="decimal" min="0" step="0.01"
                  value={form.value} onChange={e => set('value', e.target.value)} required />
              </div>
              <div className="amount-iva-col amount-iva-col--iva">
                <label className="field-label">IVA sul valore</label>
                <div className="iva-pills">
                  {IVA_RATES.map(r => (
                    <button key={r.value} type="button"
                      className={`iva-pill${form.ivaRate === r.value ? ' active' : ''}`}
                      onClick={() => set('ivaRate', r.value)}
                    >{r.label}</button>
                  ))}
                </div>
              </div>
            </div>
            {hasIva && (
              <div className="iva-breakdown">
                {form.ivaMode === 'lordo' ? (
                  <>
                    <span>Scorpora IVA {form.ivaRate}% → <strong>{fmtPreview(ivaValPrev)}</strong></span>
                    <span className="iva-breakdown-netto">Imponibile: <strong>{fmtPreview(nettoVal)}</strong></span>
                  </>
                ) : (
                  <>
                    <span>Netto: <strong>{fmtPreview(amountNum)}</strong></span>
                    <span>IVA {form.ivaRate}%: <strong>{fmtPreview(ivaValPrev)}</strong></span>
                    <span className="iva-breakdown-netto">Lordo salvato: <strong>{fmtPreview(lordoVal)}</strong></span>
                  </>
                )}
              </div>
            )}

            <label className="field-label">Stato</label>
            <select className="field-input" value={form.status} onChange={e => set('status', e.target.value)}>
              {Object.entries(PROJECT_STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>

            <label className="field-label">Note (opzionale)</label>
            <textarea className="field-input field-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>Annulla</button>
              <button className="btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Aggiungi voce al progetto ─────────────────────────

function ProjectEntryModal({ project, customCategories, contacts, onSave, onClose, initialType = 'ricavo' }) {
  const [form, setForm] = useState({
    type: initialType, amount: '', ivaRate: 22, ivaMode: 'lordo', description: '', category: '',
    contactId: project.contactId || '', date: today(), status: 'in_sospeso',
  });
  const [saving, setSaving] = useState(false);

  const cats        = buildCategories(form.type, customCategories);
  const needsStatus = form.type === 'credito' || form.type === 'debito';

  const amountNum   = parseFloat(form.amount);
  const hasIva      = form.ivaRate > 0 && form.amount && !isNaN(amountNum);
  const lordoVal    = hasIva ? (form.ivaMode === 'netto' ? calcLordo(amountNum, form.ivaRate) : amountNum) : null;
  const nettoVal    = hasIva ? (form.ivaMode === 'lordo' ? calcNetto(amountNum, form.ivaRate) : amountNum) : null;
  const ivaValPrev  = hasIva ? calcIva(lordoVal, form.ivaRate) : null;
  const savedAmount = hasIva && form.ivaMode === 'netto' ? lordoVal : amountNum;

  function set(f, v) {
    setForm(p => ({ ...p, [f]: v, ...(f === 'type' ? { category: '' } : {}) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    await onSave({
      type:        form.type,
      amount:      savedAmount,  // sempre lordo
      ivaRate:     form.ivaRate,
      description: form.description,
      category:    form.category    || null,
      contactId:   form.contactId   || null,
      contactName: contact?.name    || project.contactName || null,
      contactType: contact?.type    || project.contactType || null,
      date:        new Date(form.date),
      status:      needsStatus ? form.status : 'completato',
      notes:       '',
      projectId:   project.id,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Aggiungi — {project.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <div className="type-tabs">
              {Object.entries(ENTRY_TYPES).map(([key, t]) => (
                <button key={key} type="button"
                  className={`type-tab ${form.type === key ? 'active' : ''}`}
                  style={form.type === key ? { background: t.color, color: '#fff' } : {}}
                  onClick={() => set('type', key)}
                >{t.icon} {t.label}</button>
              ))}
            </div>

            <div className="amount-iva-row">
              <div className="amount-iva-col">
                <div className="field-label-row">
                  <label className="field-label">Importo * ({form.ivaMode === 'lordo' ? 'lordo' : 'netto'})</label>
                  <div className="ln-toggle">
                    <button type="button" className={`ln-pill${form.ivaMode === 'lordo' ? ' active' : ''}`} onClick={() => set('ivaMode', 'lordo')}>Lordo</button>
                    <button type="button" className={`ln-pill${form.ivaMode === 'netto' ? ' active' : ''}`} onClick={() => set('ivaMode', 'netto')}>Netto</button>
                  </div>
                </div>
                <input className="field-input" type="number" inputMode="decimal" placeholder="0,00" min="0" step="0.01"
                  value={form.amount} onChange={e => set('amount', e.target.value)} required autoFocus />
              </div>
              <div className="amount-iva-col amount-iva-col--iva">
                <label className="field-label">Aliquota IVA</label>
                <div className="iva-pills">
                  {IVA_RATES.map(r => (
                    <button key={r.value} type="button"
                      className={`iva-pill${form.ivaRate === r.value ? ' active' : ''}`}
                      onClick={() => set('ivaRate', r.value)}
                    >{r.label}</button>
                  ))}
                </div>
              </div>
            </div>
            {hasIva && (
              <div className="iva-breakdown">
                {form.ivaMode === 'lordo' ? (
                  <>
                    <span>Scorpora IVA {form.ivaRate}% → <strong>{fmtPreview(ivaValPrev)}</strong></span>
                    <span className="iva-breakdown-netto">Imponibile: <strong>{fmtPreview(nettoVal)}</strong></span>
                  </>
                ) : (
                  <>
                    <span>Netto: <strong>{fmtPreview(amountNum)}</strong></span>
                    <span>IVA {form.ivaRate}%: <strong>{fmtPreview(ivaValPrev)}</strong></span>
                    <span className="iva-breakdown-netto">Lordo salvato: <strong>{fmtPreview(lordoVal)}</strong></span>
                  </>
                )}
              </div>
            )}

            <label className="field-label">Descrizione *</label>
            <input className="field-input" type="text" value={form.description}
              onChange={e => set('description', e.target.value)} required />

            {cats.length > 0 && (
              <>
                <label className="field-label">Categoria</label>
                <select className="field-input" value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Seleziona...</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}

            <label className="field-label">Contatto</label>
            <select className="field-input" value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">Nessuno</option>
              {contacts.map(c => {
                const t = CONTACT_TYPES.find(x => x.key === c.type);
                return <option key={c.id} value={c.id}>{c.name} — {t?.label || c.type}</option>;
              })}
            </select>

            <label className="field-label">Data</label>
            <input className="field-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />

            {needsStatus && (
              <>
                <label className="field-label">Stato</label>
                <div className="radio-group">
                  {Object.entries(STATUS_OPTIONS).map(([key, s]) => (
                    <label key={key} className={`radio-option ${form.status === key ? 'selected' : ''}`}>
                      <input type="radio" name="pe-status" value={key} checked={form.status === key} onChange={() => set('status', key)} />
                      <span style={{ color: s.color }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>Annulla</button>
              <button className="btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? '...' : 'Aggiungi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Dettaglio progetto ────────────────────────────────

function ProjectDetail({ project, entries, contacts, customCategories, showNetto, onToggleNetto, onBack, onAddEntry, onUpdateProject, onDeleteProject, autoOpenEntry = false, onAutoOpenDone }) {
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showEditModal,  setShowEditModal]  = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  useEffect(() => {
    if (autoOpenEntry) {
      setShowEntryModal(true);
      onAutoOpenDone?.();
    }
  }, [autoOpenEntry]);

  const { ricavi, crediti, costi, debiti, fatturato, daFatturare, margineOggi, margineCompletamento, pct, projectEntries, projectValue } =
    useMemo(() => getStats(project, entries, showNetto), [project, entries, showNetto]);

  const entrate = projectEntries.filter(e => e.type === 'ricavo' || e.type === 'credito');
  const uscite  = projectEntries.filter(e => e.type === 'costo'  || e.type === 'debito');

  const st = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.in_corso;
  const ct = project.contactType ? CONTACT_TYPES.find(x => x.key === project.contactType) : null;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <button className="btn-back" onClick={onBack}>← Tutti i progetti</button>
        <NettoToggle showNetto={showNetto} onChange={onToggleNetto} />
      </div>

      <div className="proj-detail-titlerow">
        <div>
          <h2 className="page-title" style={{ marginBottom: 6 }}>{project.name}</h2>
          <div className="revenue-meta">
            {project.contactName && (
              <span className="contact-chip" style={{ background: ct?.bg || '#dcfce7', color: ct?.color || '#16a34a' }}>
                {project.contactName}
              </span>
            )}
            <span className="entry-type-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Concordato: <strong style={{ color: 'var(--text)' }}>{fmt(projectValue)}</strong>
              {showNetto && <span className="netto-badge">netto</span>}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {confirmDelete ? (
            <>
              <span className="confirm-text">Eliminare?</span>
              <button className="btn-danger-sm" onClick={() => { onDeleteProject(project.id); onBack(); }}>Sì</button>
              <button className="btn-ghost-sm" onClick={() => setConfirmDelete(false)}>No</button>
            </>
          ) : (
            <>
              <button className="btn-icon" onClick={() => setShowEditModal(true)} title="Modifica progetto">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="btn-icon btn-icon-danger" onClick={() => setConfirmDelete(true)} title="Elimina progetto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="proj-progress-bar">
          <div className="proj-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="proj-progress-label">{pct}% fatturato — {fmt(fatturato)} di {fmt(projectValue)}</p>
      </div>

      {/* KPI grid */}
      <div className="proj-kpi-grid">
        <div className="proj-kpi"><span className="proj-kpi-label">Incassato</span><span className="proj-kpi-value" style={{ color: '#16a34a' }}>{fmt(ricavi)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Da incassare</span><span className="proj-kpi-value" style={{ color: crediti > 0 ? ENTRY_TYPES.credito.color : '#94a3b8' }}>{fmt(crediti)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Da fatturare</span><span className="proj-kpi-value" style={{ color: daFatturare > 0 ? '#2563eb' : '#94a3b8' }}>{fmt(daFatturare)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Costi pagati</span><span className="proj-kpi-value" style={{ color: costi > 0 ? '#dc2626' : '#94a3b8' }}>{fmt(costi)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Debiti</span><span className="proj-kpi-value" style={{ color: debiti > 0 ? ENTRY_TYPES.debito.color : '#94a3b8' }}>{fmt(debiti)}</span></div>
        <div className="proj-kpi proj-kpi-accent"><span className="proj-kpi-label">Margine oggi</span><span className="proj-kpi-value" style={{ color: margineOggi >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(margineOggi)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Margine completamento</span><span className="proj-kpi-value" style={{ color: margineCompletamento >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(margineCompletamento)}</span></div>
      </div>

      {/* Entrate */}
      <div className="proj-section">
        <div className="proj-section-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Entrate</h3>
          <button className="btn-add" onClick={() => setShowEntryModal(true)}>+ Aggiungi</button>
        </div>
        {entrate.length === 0 ? (
          <p className="cat-empty">Nessuna entrata collegata a questo progetto.</p>
        ) : (
          <div className="proj-entry-list">
            {entrate.map(e => {
              const t = ENTRY_TYPES[e.type];
              const displayAmt = val(e, showNetto);
              return (
                <div key={e.id} className="proj-entry-row">
                  <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span>
                  <span className="proj-entry-desc">{e.description}</span>
                  {e.contactName && <span className="contact-chip" style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11 }}>{e.contactName}</span>}
                  <span className="proj-entry-date">{fmtDate(e.date)}</span>
                  <span className="proj-entry-amount" style={{ color: t.color }}>
                    {fmt(displayAmt)}
                    {(e.ivaRate > 0) && (
                      <span className="proj-entry-iva">{showNetto ? `lordo ${fmt(e.amount)}` : `netto ${fmt(calcNetto(e.amount, e.ivaRate))}`}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Uscite */}
      <div className="proj-section">
        <div className="proj-section-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Uscite</h3>
          <button className="btn-add" onClick={() => setShowEntryModal(true)}>+ Aggiungi</button>
        </div>
        {uscite.length === 0 ? (
          <p className="cat-empty">Nessuna uscita collegata a questo progetto.</p>
        ) : (
          <div className="proj-entry-list">
            {uscite.map(e => {
              const t = ENTRY_TYPES[e.type];
              const displayAmt = val(e, showNetto);
              return (
                <div key={e.id} className="proj-entry-row">
                  <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span>
                  <span className="proj-entry-desc">{e.description}</span>
                  {e.contactName && <span className="contact-chip" style={{ background: '#dbeafe', color: '#2563eb', fontSize: 11 }}>{e.contactName}</span>}
                  <span className="proj-entry-date">{fmtDate(e.date)}</span>
                  <span className="proj-entry-amount" style={{ color: t.color }}>
                    {fmt(displayAmt)}
                    {(e.ivaRate > 0) && (
                      <span className="proj-entry-iva">{showNetto ? `lordo ${fmt(e.amount)}` : `netto ${fmt(calcNetto(e.amount, e.ivaRate))}`}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEntryModal && (
        <ProjectEntryModal
          project={project}
          customCategories={customCategories}
          contacts={contacts}
          onSave={onAddEntry}
          onClose={() => setShowEntryModal(false)}
          initialType="credito"
        />
      )}
      {showEditModal && (
        <EditProjectModal
          project={project}
          contacts={contacts}
          onSave={onUpdateProject}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

// ── Card lista progetti ───────────────────────────────

function ProjectCard({ project, entries, showNetto, onClick }) {
  const { ricavi, crediti, costi, margineOggi, pct } = useMemo(
    () => getStats(project, entries, showNetto),
    [project, entries, showNetto]
  );
  const st = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.in_corso;
  const ct = project.contactType ? CONTACT_TYPES.find(x => x.key === project.contactType) : null;
  const projectValue = showNetto ? calcNetto(project.value || 0, project.ivaRate || 0) : (project.value || 0);

  return (
    <div className="proj-card" onClick={onClick}>
      <div className="proj-card-top">
        <div>
          <p className="proj-card-name">{project.name}</p>
          <div className="revenue-meta" style={{ marginTop: 4 }}>
            {project.contactName && (
              <span className="contact-chip" style={{ background: ct?.bg || '#dcfce7', color: ct?.color || '#16a34a' }}>
                {project.contactName}
              </span>
            )}
            <span className="entry-type-badge" style={{ background: st.bg, color: st.color, fontSize: 10 }}>{st.label}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Concordato {showNetto && <span className="netto-badge">netto</span>}
          </p>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{fmt(projectValue)}</p>
        </div>
      </div>

      <div className="proj-progress-bar" style={{ margin: '10px 0 4px' }}>
        <div className="proj-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="proj-progress-label">{pct}% fatturato</p>

      <div className="proj-card-kpis">
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Incassato</span>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>{fmt(ricavi)}</span>
        </div>
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Crediti</span>
          <span style={{ color: crediti > 0 ? ENTRY_TYPES.credito.color : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{fmt(crediti)}</span>
        </div>
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Costi</span>
          <span style={{ color: costi > 0 ? '#dc2626' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{fmt(costi)}</span>
        </div>
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Margine oggi</span>
          <span style={{ color: margineOggi >= 0 ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: 13 }}>{fmt(margineOggi)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────

export default function Projects({ projects, entries, contacts, customCategories, onAdd, onUpdate, onDelete, onAddEntry }) {
  const [view,           setView]          = useState('lista');
  const [selectedId,     setSelectedId]    = useState(null);
  const [showNewModal,   setShowNewModal]  = useState(false);
  const [showNetto,      setShowNetto]     = useState(true);
  const [autoOpenEntry,  setAutoOpenEntry] = useState(false);

  useEffect(() => {
    if (selectedId && !projects.find(p => p.id === selectedId)) setSelectedId(null);
  }, [projects, selectedId]);

  const selectedProject = selectedId ? projects.find(p => p.id === selectedId) : null;

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        entries={entries}
        contacts={contacts}
        customCategories={customCategories}
        showNetto={showNetto}
        onToggleNetto={setShowNetto}
        onBack={() => setSelectedId(null)}
        onAddEntry={onAddEntry}
        onUpdateProject={onUpdate}
        onDeleteProject={(id) => { onDelete(id); setSelectedId(null); }}
        autoOpenEntry={autoOpenEntry}
        onAutoOpenDone={() => setAutoOpenEntry(false)}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <h2 className="page-title">Progetti</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <NettoToggle showNetto={showNetto} onChange={setShowNetto} />
          <button className="btn-add" onClick={() => setShowNewModal(true)}>+ Nuovo</button>
        </div>
      </div>

      <div className="subnav">
        <button className={`subnav-btn ${view === 'lista'   ? 'active' : ''}`} onClick={() => setView('lista')}>Lista</button>
        <button className={`subnav-btn ${view === 'analisi' ? 'active' : ''}`} onClick={() => setView('analisi')}>Per categoria</button>
      </div>

      {view === 'lista' && (
        projects.length === 0
          ? <div className="empty-state">Nessun progetto. Crea il primo con "+ Nuovo".</div>
          : <div className="proj-list">
              {projects.map(p =>
                <ProjectCard key={p.id} project={p} entries={entries} showNetto={showNetto} onClick={() => setSelectedId(p.id)} />
              )}
            </div>
      )}

      {view === 'analisi' && <PerCategoria entries={entries} />}

      {showNewModal && (
        <NewProjectModal
          contacts={contacts}
          onSave={async (data) => {
            const newId = await onAdd(data);
            setShowNewModal(false);
            setSelectedId(newId);
            setAutoOpenEntry(true);
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
