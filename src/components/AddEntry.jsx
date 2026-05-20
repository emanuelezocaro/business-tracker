import { useState } from 'react';
import { ENTRY_TYPES, buildCategories, STATUS_OPTIONS } from '../constants';
import { CONTACT_TYPES } from './Contacts';

const today = () => new Date().toISOString().split('T')[0];

export default function AddEntry({ onAdd, contacts = [], customCategories = [], entries = [] }) {
  const [form, setForm] = useState({
    type: 'ricavo',
    category: '',
    amount: '',
    description: '',
    date: today(),
    status: 'completato',
    notes: '',
    contactId: '',
    linkedRevenueId: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = buildCategories(form.type, customCategories);
  const needsStatus = form.type === 'credito' || form.type === 'debito';

  // Ricavi disponibili a cui collegare un costo
  const ricavi = entries.filter(e => e.type === 'ricavo');

  function set(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { category: '', linkedRevenueId: '' } : {}),
    }));
  }

  function fmtDate(val) {
    if (!val) return '';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fmt(n) {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    const linkedRevenue = ricavi.find(r => r.id === form.linkedRevenueId);
    await onAdd({
      type: form.type,
      category: form.category || null,
      amount: form.amount,
      description: form.description,
      date: new Date(form.date),
      status: needsStatus ? form.status : 'completato',
      notes: form.notes,
      contactId: form.contactId || null,
      contactName: contact?.name || null,
      contactType: contact?.type || null,
      linkedRevenueId: linkedRevenue?.id || null,
      linkedRevenueDescription: linkedRevenue?.description || null,
    });
    setSaving(false);
    setSuccess(true);
    setForm({ type: form.type, category: '', amount: '', description: '', date: today(), status: 'completato', notes: '', contactId: '', linkedRevenueId: '' });
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <div className="page">
      <h2 className="page-title">Aggiungi voce</h2>

      <form className="form" onSubmit={handleSubmit}>
        <div className="type-tabs">
          {Object.entries(ENTRY_TYPES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              className={`type-tab ${form.type === key ? 'active' : ''}`}
              style={form.type === key ? { background: t.color, color: '#fff' } : {}}
              onClick={() => set('type', key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <label className="field-label">Importo (€) *</label>
        <input
          className="field-input"
          type="number"
          inputMode="decimal"
          placeholder="0,00"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          required
          min="0"
          step="0.01"
        />

        <label className="field-label">Descrizione *</label>
        <input
          className="field-input"
          type="text"
          placeholder="Es. Consulenza Mario Rossi"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          required
        />

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

        {/* Collega a ricavo — solo per i costi */}
        {form.type === 'costo' && (
          <>
            <label className="field-label">Collega a ricavo (opzionale)</label>
            {ricavi.length === 0 ? (
              <p className="field-hint">Nessun ricavo ancora inserito.</p>
            ) : (
              <select className="field-input" value={form.linkedRevenueId} onChange={e => set('linkedRevenueId', e.target.value)}>
                <option value="">Nessuno</option>
                {ricavi.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.description}{r.contactName ? ` — ${r.contactName}` : ''} ({fmt(r.amount)}, {fmtDate(r.date)})
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <label className="field-label">Data</label>
        <input
          className="field-input"
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />

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

        <label className="field-label">Note (opzionale)</label>
        <textarea
          className="field-input field-textarea"
          placeholder="Aggiungi dettagli..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
        />

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvataggio...' : success ? '✓ Salvato!' : 'Aggiungi voce'}
        </button>
      </form>
    </div>
  );
}
