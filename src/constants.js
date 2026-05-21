export const IVA_RATES = [
  { value: 0,  label: 'Esente' },
  { value: 22, label: '22%'    },
];

/** Calcola l'imponibile dato un importo lordo e l'aliquota IVA */
export function calcNetto(amount, ivaRate) {
  if (!ivaRate) return amount;
  return Math.round((amount / (1 + ivaRate / 100)) * 100) / 100;
}

/** Calcola il lordo dato un importo netto e l'aliquota IVA */
export function calcLordo(netto, ivaRate) {
  if (!ivaRate) return netto;
  return Math.round(netto * (1 + ivaRate / 100) * 100) / 100;
}

/** Calcola la quota IVA dato un importo lordo e l'aliquota */
export function calcIva(amount, ivaRate) {
  return Math.round((amount - calcNetto(amount, ivaRate)) * 100) / 100;
}

export const ENTRY_TYPES = {
  ricavo: { label: 'Ricavo', color: '#16a34a', bg: '#dcfce7', icon: '↑' },
  costo: { label: 'Costo', color: '#dc2626', bg: '#fee2e2', icon: '↓' },
  credito: { label: 'Credito', color: '#7c3aed', bg: '#ede9fe', icon: '⏳' },
  debito: { label: 'Debito', color: '#d97706', bg: '#fef3c7', icon: '⚠' },
};

export function buildCategories(type, customCategories) {
  return customCategories
    .filter(c => Array.isArray(c.types) ? c.types.includes(type) : c.type === type)
    .map(c => c.name);
}

export const STATUS_OPTIONS = {
  completato: { label: 'Completato', color: '#16a34a' },
  in_sospeso: { label: 'In sospeso', color: '#d97706' },
};
