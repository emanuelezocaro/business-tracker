import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ENTRY_TYPES } from '../constants';

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard({ entries }) {
  const stats = useMemo(() => {
    const ricavi = entries.filter(e => e.type === 'ricavo').reduce((s, e) => s + e.amount, 0);
    const costi = entries.filter(e => e.type === 'costo').reduce((s, e) => s + e.amount, 0);
    const crediti = entries.filter(e => e.type === 'credito' && e.status === 'in_sospeso').reduce((s, e) => s + e.amount, 0);
    const debiti = entries.filter(e => e.type === 'debito' && e.status === 'in_sospeso').reduce((s, e) => s + e.amount, 0);
    return { ricavi, costi, saldo: ricavi - costi, crediti, debiti };
  }, [entries]);

  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTHS.map((name, i) => {
      const month = entries.filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      return {
        name,
        ricavi: month.filter(e => e.type === 'ricavo').reduce((s, e) => s + e.amount, 0),
        costi: month.filter(e => e.type === 'costo').reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [entries]);

  const kpis = [
    { label: 'Ricavi totali', value: stats.ricavi, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Costi totali', value: stats.costi, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Saldo netto', value: stats.saldo, color: stats.saldo >= 0 ? '#16a34a' : '#dc2626', bg: stats.saldo >= 0 ? '#dcfce7' : '#fee2e2' },
    { label: 'Crediti in sospeso', value: stats.crediti, color: '#d97706', bg: '#fef3c7' },
    { label: 'Debiti in sospeso', value: stats.debiti, color: '#7c3aed', bg: '#ede9fe' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name === 'ricavi' ? 'Ricavi' : 'Costi'}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>

      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ background: k.bg }}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value" style={{ color: k.color }}>{fmt(k.value)}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="section-title">Ricavi vs Costi ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ricavi" fill="#16a34a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="costi" fill="#dc2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <span className="legend-dot" style={{ background: '#16a34a' }} /> Ricavi
          <span className="legend-dot" style={{ background: '#dc2626', marginLeft: 12 }} /> Costi
        </div>
      </div>

      {entries.length === 0 && (
        <div className="empty-state">
          <p>Nessuna voce ancora.</p>
          <p>Vai su <strong>Aggiungi</strong> per inserire la prima!</p>
        </div>
      )}
    </div>
  );
}
