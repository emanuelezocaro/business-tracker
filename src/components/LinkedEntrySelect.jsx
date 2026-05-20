import { ENTRY_TYPES } from '../constants';

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// costo → ricavi + crediti | debito → ricavi + crediti
const LINKABLE_TYPES = {
  costo: ['ricavo', 'credito'],
  debito: ['ricavo', 'credito'],
};

export function LinkedEntrySelect({ entryType, entries, value, onChange, excludeId }) {
  const allowedTypes = LINKABLE_TYPES[entryType];
  if (!allowedTypes) return null;

  const options = entries.filter(e => allowedTypes.includes(e.type) && e.id !== excludeId);

  const label = entryType === 'costo'
    ? 'Collega a ricavo o credito (opzionale)'
    : 'Collega a ricavo o credito (opzionale)';

  return (
    <>
      <label className="field-label">{label}</label>
      {options.length === 0 ? (
        <p className="field-hint">Nessun ricavo o credito disponibile.</p>
      ) : (
        <select className="field-input" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Nessuno</option>
          {['ricavo', 'credito'].map(type => {
            const group = options.filter(e => e.type === type);
            if (!group.length) return null;
            const t = ENTRY_TYPES[type];
            return (
              <optgroup key={type} label={`${t.icon} ${t.label}i`}>
                {group.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.description}{e.contactName ? ` — ${e.contactName}` : ''} ({fmt(e.amount)}, {fmtDate(e.date)})
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      )}
    </>
  );
}
