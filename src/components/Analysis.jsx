import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ENTRY_TYPES } from '../constants';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}
function pct(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p><strong>{payload[0].payload.name}</strong></p>
      <p>{fmt(payload[0].payload.value)}</p>
    </div>
  );
};

export function PerCategoria({ entries }) {
  const [activeType, setActiveType] = useState('ricavo');
  const [year, setYear] = useState(new Date().getFullYear());

  const years = useMemo(() => {
    const s = new Set(entries.map(e => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      return d.getFullYear();
    }));
    return [...s].sort((a, b) => b - a);
  }, [entries]);

  const filtered = useMemo(() =>
    entries.filter(e => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      return e.type === activeType && d.getFullYear() === year;
    }),
    [entries, activeType, year]
  );

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const key = e.category || 'Senza categoria';
      map[key] = (map[key] || 0) + e.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value, pct: pct(value, total) }));
  }, [filtered]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="analysis-controls">
        <div className="type-tabs">
          {Object.entries(ENTRY_TYPES).map(([key, t]) => (
            <button key={key} type="button"
              className={`type-tab ${activeType === key ? 'active' : ''}`}
              style={activeType === key ? { background: t.color, color: '#fff' } : {}}
              onClick={() => setActiveType(key)}
            >{t.label}</button>
          ))}
        </div>
        {years.length > 1 && (
          <select className="field-input year-select" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      <div className="card analysis-summary">
        <span className="kpi-label">Totale {ENTRY_TYPES[activeType].label.toLowerCase()}i {year}</span>
        <span className="kpi-value" style={{ color: ENTRY_TYPES[activeType].color }}>{fmt(total)}</span>
        <span className="kpi-sub">{filtered.length} voci</span>
      </div>

      {byCategory.length === 0 ? (
        <div className="empty-state">Nessuna voce per questo tipo nell'anno selezionato.</div>
      ) : (
        <div className="analysis-grid">
          <div className="card">
            <h3 className="section-title">Ripartizione per categoria</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, pct }) => `${name} ${pct}`} labelLine={false}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="section-title">Dettaglio categorie</h3>
            {byCategory.map((c, i) => (
              <div key={c.name} className="cat-row">
                <div className="cat-row-left">
                  <span className="cat-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="cat-name">{c.name}</span>
                </div>
                <div className="cat-row-right">
                  <span className="cat-pct">{c.pct}</span>
                  <span className="cat-amount" style={{ color: ENTRY_TYPES[activeType].color }}>{fmt(c.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

