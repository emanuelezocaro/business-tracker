import { useState } from 'react';
import { ENTRY_TYPES, buildCategories, STATUS_OPTIONS } from '../constants';
import { CONTACT_TYPES } from './Contacts';

function toDateInput(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toISOString().split('T')[0];
}

export default function EditModal({ entry, contacts, customCategories, entries, projects = [], onSave, onClose }) {
  const [form, setForm] = useState({
    type: entry.type,
    category: entry.category || '',
    amount: entry.amount,
    description: entry.description || '',
    date: toDateInput(entry.date),
    status: entry.status || 'completato',
    notes: entry.notes || '',
    contactId: entry.contactId || '',
    projectId: entry.projectId || '',
  });
  const [saving, setSaving] = useState(false);

  const categories = buildCategories(form.type, customCategories);
  const needsStatus = form.type === 'credito' || form.type === 'debito';

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
    await onSave(entry.id, {
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
      projectId: form.projectId || null,
    });
    setSaving(false);
    onClose();
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

            <label className="field-label">Importo (€) *</label>
            <input className="field-input" type="number" inputMode="decimal"
              value={form.amount} onChange={e => set('amount', e.target.value)} required min="0" step="0.01" />

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
            <select className="field-input" value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">Nessuno</option>
              {contacts.map(c => {
                const t = CONTACT_TYPES.find(x => x.key === c.type);
                return <option key={c.id} value={c.id}>{c.name} — {t?.label || c.type}</option>;
              })}
            </select>

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
