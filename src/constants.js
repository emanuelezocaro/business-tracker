export const ENTRY_TYPES = {
  ricavo: { label: 'Ricavo', color: '#16a34a', bg: '#dcfce7', icon: '↑' },
  costo: { label: 'Costo', color: '#dc2626', bg: '#fee2e2', icon: '↓' },
  credito: { label: 'Credito', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  debito: { label: 'Debito', color: '#7c3aed', bg: '#ede9fe', icon: '⚠' },
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
