import { useState } from 'react';
import { ENTRY_TYPES, buildCategories, STATUS_OPTIONS, IVA_RATES, calcNetto, calcLordo, calcIva } from '../constants';
import ContactPicker from './ContactPicker';

function toDateInput(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toISOString().split('T')[0];
}

function fmtPreview(n) {
  if (!n || isNaN(n)) return '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

export default function EditModal({ entry, contacts, customCategories, entries, projects = [], onSave, onClose, onAddContact }) {
  const [form, setForm] = useState({
    type:        entry.type,
    category:    entry.category    || '',
    amount:      entry.amount,
    ivaRate:     entry.ivaRate     ?? 22,
    ivaMode:     'lordo',   // in modifica si parte sempre da lordo (valore già salvato)
    description: entry.description || '',
    date:        toDateInput(entry.date),
    status:      entry.status      || 'completato',
    notes:       entry.notes       || '',
    contactId:   entry.contactId   || '',
    contactName: entry.contactName || '',
    contactType: entry.contactType || '',
    projectId:   entry.projectId   || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories  = buildCategories(form.type, customCategories);
  const needsStatus = form.type === 'credito' || form.type === 'debito';

  const amountNum   = parseFloat(form.amount);
  const hasIva      = form.ivaRate > 0 && form.amount && !isNaN(amountNum);
  const lordoVal    = hasIva ? (form.ivaMode === 'netto' ? calcLordo(amountNum, form.ivaRate) : amountNum) : null;
  const nettoVal    = hasIva ? (form.ivaMode === 'lordo' ? calcNetto(amountNum, form.ivaRate) : amountNum) : null;
  const ivaVal      = hasIva ? calcIva(lordoVal, form.ivaRate) : null;
  const savedAmount = hasIva && form.ivaMode === 'netto' ? lordoVal : amountNum;

  function set(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { category: '' } : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amountVal = parseFloat(form.amount);
    if (!form.amount || isNaN(amountVal) || amountVal <= 0) {
      setError('Inserisci un importo valido maggiore di zero.');
      return;
    }
    if (!form.description.trim()) {
      setError('La descrizione è obbligatoria.');
      return;
    }
    if (!form.date) {
      setError('Seleziona una data.');
      return;
    }
    setSaving(true);
    try {
      const contact = contacts.find(c => c.id === form.contactId);
      await onSave(entry.id, {
        type:        form.type,
        category:    form.category   || null,
        amount:      savedAmount,    // sempre lordo
        ivaRate:     form.ivaRate,
        description: form.description.trim(),
        date:        new Date(form.date),
        status:      needsStatus ? form.status : 'completato',
        notes:       form.notes,
        contactId:   form.contactId  || null,
        contactName: contact?.name   || form.contactName || null,
        contactType: contact?.type   || form.contactType || null,
        projectId:   form.projectId  || null,
      });
      onClose();
    } catch (err) {
      console.error('Errore salvataggio voce:', err);
      setError('Errore durante il salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Modifica voce</h3>
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

            {/* Importo + IVA */}
            <div className="amount-iva-row">
              <div className="amount-iva-col">
                <div className="field-label-row">
                  <label className="field-label">Importo * ({form.ivaMode === 'lordo' ? 'lordo' : 'netto'})</label>
                  <div className="ln-toggle">
                    <button type="button" className={`ln-pill${form.ivaMode === 'lordo' ? ' active' : ''}`} onClick={() => set('ivaMode', 'lordo')}>Lordo</button>
                    <button type="button" className={`ln-pill${form.ivaMode === 'netto' ? ' active' : ''}`} onClick={() => set('ivaMode', 'netto')}>Netto</button>
                  </div>
                </div>
                <input className="field-input" type="number" inputMode="decimal"
                  value={form.amount} onChange={e => set('amount', e.target.value)} required min="0" step="0.01" />
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

            {/* Preview calcolo IVA */}
            {hasIva && (
              <div className="iva-breakdown">
                {form.ivaMode === 'lordo' ? (
                  <>
                    <span>Scorpora IVA {form.ivaRate}% → <strong>{fmtPreview(ivaVal)}</strong></span>
                    <span className="iva-breakdown-netto">Imponibile: <strong>{fmtPreview(nettoVal)}</strong></span>
                  </>
                ) : (
                  <>
                    <span>Netto: <strong>{fmtPreview(amountNum)}</strong></span>
                    <span>IVA {form.ivaRate}%: <strong>{fmtPreview(ivaVal)}</strong></span>
                    <span className="iva-breakdown-netto">Lordo salvato: <strong>{fmtPreview(lordoVal)}</strong></span>
                  </>
                )}
              </div>
            )}

            <label className="field-label">Descrizione *</label>
            <input className="field-input" type="text"
              value={form.description} onChange={e => set('description', e.target.value)} required />

            <label className="field-label">Categoria</label>
            {categories.length === 0 ? (
              <p className="field-hint">Nessuna categoria. Creale in <strong>Gestione → Categorie</strong>.</p>
            ) : (
              <select className="field-input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Seleziona...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <label className="field-label">Contatto collegato</label>
            <ContactPicker
              contacts={contacts}
              value={form.contactId}
              onChange={(id, name, type) => setForm(f => ({ ...f, contactId: id, contactName: name, contactType: type }))}
              onAddContact={onAddContact}
              defaultType={form.type === 'ricavo' || form.type === 'credito' ? 'cliente' : 'fornitore'}
            />

            <label className="field-label">Data</label>
            <input className="field-input" type="date"
              value={form.date} onChange={e => set('date', e.target.value)} />

            {needsStatus && (
              <>
                <label className="field-label">Stato</label>
                <div className="radio-group">
                  {Object.entries(STATUS_OPTIONS).map(([key, s]) => (
                    <label key={key} className={`radio-option ${form.status === key ? 'selected' : ''}`}>
                      <input type="radio" name="edit-status" value={key} checked={form.status === key} onChange={() => set('status', key)} />
                      <span style={{ color: s.color }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {projects.length > 0 && (
              <>
                <label className="field-label">Progetto</label>
                <select className="field-input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
                  <option value="">Nessun progetto</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.contactName ? ` — ${p.contactName}` : ''}</option>)}
                </select>
              </>
            )}

            <label className="field-label">Note</label>
            <textarea className="field-input field-textarea"
              value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>
                Annulla
              </button>
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
