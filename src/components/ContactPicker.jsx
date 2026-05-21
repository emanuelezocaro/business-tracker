import { useState, useRef, useEffect } from 'react';
import { CONTACT_TYPES } from './Contacts';

/**
 * ContactPicker – campo autocomplete per selezionare o creare un contatto al volo.
 *
 * Props:
 *   contacts       – array di contatti { id, name, type, ... }
 *   value          – id del contatto selezionato (stringa vuota = nessuno)
 *   onChange(id, name, type) – callback quando la selezione cambia
 *   onAddContact(data) → Promise<{ id, name, type }> – crea un nuovo contatto
 *   defaultType    – tipo pre-selezionato nel pannello di creazione ('cliente'|'fornitore'|...)
 */
export default function ContactPicker({
  contacts = [],
  value = '',
  onChange,
  onAddContact,
  defaultType = 'cliente',
}) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState(defaultType);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef(null);

  const selectedContact = contacts.find(c => c.id === value);

  // Quando il valore esterno cambia (es. reset form) aggiorna il testo
  useEffect(() => {
    if (!open) setText(selectedContact?.name || '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aggiorna il tipo default quando cambia il tipo della voce
  useEffect(() => { setNewType(defaultType); }, [defaultType]);

  // Chiudi cliccando fuori
  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
        // ripristina testo se c'è una selezione, altrimenti lascia quel che ha scritto
        setText(selectedContact?.name || (value ? '' : text));
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [value, selectedContact, text]); // eslint-disable-line react-hooks/exhaustive-deps

  const trimmed = text.trim();

  const filtered = trimmed
    ? contacts.filter(c => c.name.toLowerCase().includes(trimmed.toLowerCase()))
    : contacts;

  const exactMatch = contacts.some(
    c => c.name.toLowerCase() === trimmed.toLowerCase()
  );

  function handleInput(e) {
    setText(e.target.value);
    setOpen(true);
    setCreating(false);
    // deseleziona quando l'utente ricomincia a scrivere
    if (value) onChange('', '', '');
  }

  function selectContact(c) {
    onChange(c.id, c.name, c.type);
    setText(c.name);
    setOpen(false);
    setCreating(false);
  }

  function clearContact() {
    onChange('', '', '');
    setText('');
    setOpen(false);
    setCreating(false);
  }

  async function handleCreate() {
    if (!trimmed || saving) return;
    setSaving(true);
    const result = await onAddContact({ name: trimmed, type: newType, notes: '' });
    setSaving(false);
    if (result) {
      onChange(result.id, result.name, result.type);
      setText(result.name);
    }
    setOpen(false);
    setCreating(false);
  }

  return (
    <div className="contact-picker" ref={wrapRef}>
      {/* Input */}
      <div className="cp-input-wrap">
        <svg className="cp-search-icon" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="field-input cp-input"
          type="text"
          placeholder="Cerca o crea contatto..."
          value={text}
          autoComplete="off"
          onChange={handleInput}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button type="button" className="cp-clear" onClick={clearContact} tabIndex={-1}>
            ✕
          </button>
        )}
      </div>

      {/* Badge contatto selezionato */}
      {value && selectedContact && (
        <div className="cp-selected-badge">
          {(() => {
            const t = CONTACT_TYPES.find(x => x.key === selectedContact.type);
            return (
              <span className="entry-type-badge" style={{ background: t?.bg, color: t?.color, fontSize: 11 }}>
                {t?.label || selectedContact.type}
              </span>
            );
          })()}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="cp-dropdown">
          {/* Lista contatti filtrati */}
          {filtered.map(c => {
            const t = CONTACT_TYPES.find(x => x.key === c.type);
            return (
              <div
                key={c.id}
                className={`cp-item${c.id === value ? ' cp-item--selected' : ''}`}
                onMouseDown={() => selectContact(c)}
              >
                <span className="cp-item-avatar" style={{ background: t?.bg, color: t?.color }}>
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="cp-item-name">{c.name}</span>
                <span className="cp-item-badge" style={{ background: t?.bg, color: t?.color }}>
                  {t?.label || c.type}
                </span>
              </div>
            );
          })}

          {/* Stato vuoto */}
          {filtered.length === 0 && !trimmed && (
            <p className="cp-empty">Nessun contatto — inizia a scrivere per cercare o creare.</p>
          )}
          {filtered.length === 0 && trimmed && !exactMatch && (
            <p className="cp-empty" style={{ marginBottom: 0 }}>Nessun risultato per "{trimmed}"</p>
          )}

          {/* Riga Crea */}
          {trimmed && !exactMatch && (
            <div className="cp-create-row">
              {!creating ? (
                <div
                  className="cp-create-trigger"
                  onMouseDown={e => { e.preventDefault(); setCreating(true); }}
                >
                  <span className="cp-create-plus">+</span>
                  <span>Crea <strong>"{trimmed}"</strong></span>
                </div>
              ) : (
                <div className="cp-create-panel" onMouseDown={e => e.preventDefault()}>
                  <span className="field-label" style={{ marginBottom: 6, display: 'block' }}>
                    Tipo contatto
                  </span>
                  <div className="cp-type-pills">
                    {CONTACT_TYPES.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        className={`cp-type-pill${newType === t.key ? ' active' : ''}`}
                        style={newType === t.key
                          ? { background: t.color, color: '#fff', borderColor: t.color }
                          : {}}
                        onMouseDown={e => { e.preventDefault(); setNewType(t.key); }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ marginTop: 10, width: '100%', fontSize: 13 }}
                    onMouseDown={e => { e.preventDefault(); handleCreate(); }}
                    disabled={saving}
                  >
                    {saving ? 'Creazione...' : `Crea "${trimmed}"`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
