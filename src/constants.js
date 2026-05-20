export const ENTRY_TYPES = {
  ricavo: { label: 'Ricavo', color: '#16a34a', bg: '#dcfce7', icon: '↑' },
  costo: { label: 'Costo', color: '#dc2626', bg: '#fee2e2', icon: '↓' },
  credito: { label: 'Credito', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  debito: { label: 'Debito', color: '#7c3aed', bg: '#ede9fe', icon: '⚠' },
};

export const DEFAULT_CATEGORIES = {
  ricavo: ['Consulenze', 'Servizi ricorrenti', 'Progetti una tantum', 'Altro'],
  costo: ['Personale / Collaboratori', 'Software & Abbonamenti', 'Marketing', 'Tasse & Contributi', 'Spese operative', 'Altro'],
  credito: ['Fattura emessa', 'Acconto atteso', 'Rimborso atteso', 'Altro'],
  debito: ['Fornitore', 'Collaboratore', 'Tasse', 'Affitto', 'Altro'],
};

export function buildCategories(type, customCategories) {
  const defaults = DEFAULT_CATEGORIES[type] || [];
  const custom = customCategories.filter(c => c.type === type).map(c => c.name);
  const all = [...new Set([...defaults, ...custom])];
  return all;
}

export const STATUS_OPTIONS = {
  completato: { label: 'Completato', color: '#16a34a' },
  in_sospeso: { label: 'In sospeso', color: '#d97706' },
};
