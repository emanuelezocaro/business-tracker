import { useState } from 'react';
import { ENTRY_TYPES, CATEGORIES, STATUS_OPTIONS } from '../constants';

const today = () => new Date().toISOString().split('T')[0];

export default function AddEntry({ onAdd, onNavigate }) {
  const [form, setForm] = useState({
    type: 'ricavo',
    category: '',
    customCategory: '',
    amount: '',
    description: '',
    date: today(),
    status: 'completato',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = CATEGORIES[form.type] || [];
  const needsStatus = form.type === 'credito' || form.type === 'debito';

  function set(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { category: '', customCategory: '' } : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSaving(true);
    const cat = form.category === 'custom' ? form.customCategory : form.category;
    await onAdd({
      type: form.type,
      category: cat || 'Altro',
      amount: form.amount,
      description: form.description,
      date: new Date(form.date),
      status: needsStatus ? form.status : 'completato',
      notes: form.notes,
    });
    setSaving(false);
    setSuccess(true);
    setForm({ type: form.type, category: '', customCategory: '', amount: '', description: '', date: today(), status: 'completato', notes: '' });
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
          placeholder="Es. Consulenza cliente Mario Rossi"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          required
        />

        <label className="field-label">Categoria</label>
        <select className="field-input" value={form.category} onChange={e => set('category', e.target.value)}>
          <option value="">Seleziona...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="custom">+ Categoria personalizzata</option>
        </select>

        {form.category === 'custom' && (
          <>
            <label className="field-label">Nome categoria</label>
            <input
              className="field-input"
              type="text"
              placeholder="Es. Formazione"
              value={form.customCategory}
              onChange={e => set('customCategory', e.target.value)}
            />
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
