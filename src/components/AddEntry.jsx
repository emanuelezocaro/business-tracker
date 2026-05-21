import { useState } from 'react';
import { ENTRY_TYPES, buildCategories, STATUS_OPTIONS, IVA_RATES, calcNetto, calcLordo, calcIva } from '../constants';
import { CONTACT_TYPES } from './Contacts';

const today = () => new Date().toISOString().split('T')[0];

function fmtPreview(n) {
  if (!n || isNaN(n)) return '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

export default function AddEntry({ onAdd, contacts = [], customCategories = [], entries = [], projects = [] }) {
  const [form, setForm] = useState({
    type: 'ricavo',
    category: '',
    amount: '',
    ivaRate: 22,
    ivaMode: 'lordo',   // 'lordo' | 'netto'
    description: '',
    date: today(),
    status: 'completato',
    notes: '',
    contactId: '',
    projectId: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = buildCategories(form.type, customCategories);
  const needsStatus = form.type === 'credito' || form.type === 'debito';

  const amountNum  = parseFloat(form.amount);
  const hasIva     = form.ivaRate > 0 && form.amount && !isNaN(amountNum);
  // Se l'utente inserisce netto → calcoliamo il lordo; se lordo → calcoliamo il netto
  const lordoVal   = hasIva ? (form.ivaMode === 'netto' ? calcLordo(amountNum, form.ivaRate) : amountNum)       : null;
  const nettoVal   = hasIva ? (form.ivaMode === 'lordo' ? calcNetto(amountNum, form.ivaRate) : amountNum)       : null;
  const ivaVal     = hasIva ? calcIva(lordoVal, form.ivaRate) : null;
  // Importo che verrà salvato (sempre lordo)
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
    if (!form.amount || !form.description) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    await onAdd({
      type:        form.type,
      category:    form.category || null,
      amount:      savedAmount,   // sempre lordo
      ivaRate:     form.ivaRate,
      description: form.description,
      date:        new Date(form.date),
      status:      needsStatus ? form.status : 'completato',
      notes:       form.notes,
      contactId:   form.contactId  || null,
      contactName: contact?.name   || null,
      contactType: contact?.type   || null,
      projectId:   form.projectId  || null,
    });
    setSaving(false);
    setSuccess(true);
    setForm({ type: form.type, category: '', amount: '', ivaRate: 22, ivaMode: 'lordo', description: '', date: today(), status: 'completato', notes: '', contactId: '', projectId: '' });
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <div className="page">
      <h2 className="page-title">Aggiungi voce</h2>

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

        {/* Importo + IVA affiancati */}
        <div className="amount-iva-row">
          <div className="amount-iva-col">
            <div className="field-label-row">
              <label className="field-label">Importo * ({form.ivaMode === 'lordo' ? 'lordo' : 'netto'})</label>
              <div className="ln-toggle">
                <button type="button" className={`ln-pill${form.ivaMode === 'lordo' ? ' active' : ''}`} onClick={() => set('ivaMode', 'lordo')}>Lordo</button>
                <button type="button" className={`ln-pill${form.ivaMode === 'netto' ? ' active' : ''}`} onClick={() => set('ivaMode', 'netto')}>Netto</button>
              </div>
            </div>
            <input className="field-input" type="number" inputMode="decimal" placeholder="0,00"
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
        <input className="field-input" type="text" placeholder="Es. Consulenza Mario Rossi"
          value={form.description} onChange={e => set('description', e.target.value)} required />

        <label className="field-label">Categoria</label>
        {categories.length === 0 ? (
          <p className="field-hint">Nessuna categoria per questo tipo. Creale in <strong>Gestione → Categorie</strong>.</p>
        ) : (
          <select className="field-input" value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Seleziona...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <label className="field-label">Contatto collegato</label>
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
                  <input type="radio" name="status" value={key} checked={form.status === key} onChange={() => set('status', key)} />
                  <span style={{ color: s.color }}>{s.label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {projects.length > 0 && (
          <>
            <label className="field-label">Progetto (opzionale)</label>
            <select className="field-input" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
              <option value="">Nessun progetto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.contactName ? ` — ${p.contactName}` : ''}</option>)}
            </select>
          </>
        )}

        <label className="field-label">Note (opzionale)</label>
        <textarea className="field-input field-textarea" placeholder="Aggiungi dettagli..."
          value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvataggio...' : success ? '✓ Salvato!' : 'Aggiungi voce'}
        </button>
      </form>
    </div>
  );
}
