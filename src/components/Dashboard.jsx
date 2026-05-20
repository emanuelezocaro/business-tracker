import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { ENTRY_TYPES } from '../constants';

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yearStart() { return localDate(new Date(new Date().getFullYear(), 0, 1)); }
function yearEnd()   { return localDate(new Date(new Date().getFullYear(), 12, 0)); }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name === 'ricavi' ? 'Ricavi' : p.name === 'costi' ? 'Costi' : 'Saldo'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard({ entries }) {
  const [dateFrom, setDateFrom] = useState(yearStart());
  const [dateTo, setDateTo] = useState(yearEnd());

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    return entries.filter(e => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [entries, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const ricavi = filtered.filter(e => e.type === 'ricavo').reduce((s, e) => s + e.amount, 0);
    const costi = filtered.filter(e => e.type === 'costo').reduce((s, e) => s + e.amount, 0);
    const crediti = filtered.filter(e => e.type === 'credito' && e.status === 'in_sospeso').reduce((s, e) => s + e.amount, 0);
    const debiti = filtered.filter(e => e.type === 'debito' && e.status === 'in_sospeso').reduce((s, e) => s + e.amount, 0);
    return { ricavi, costi, saldo: ricavi - costi, crediti, debiti };
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTHS.map((name, i) => {
      const month = entries.filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      const ricavi = month.filter(e => e.type === 'ricavo').reduce((s, e) => s + e.amount, 0);
      const costi = month.filter(e => e.type === 'costo').reduce((s, e) => s + e.amount, 0);
      return { name, ricavi, costi, saldo: ricavi - costi };
    });
  }, [entries]);

  const recentEntries = useMemo(() =>
    [...filtered]
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return db2 - da;
      })
      .slice(0, 8),
    [filtered]
  );

  const kpis = [
    { label: 'Ricavi', value: stats.ricavi, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Costi', value: stats.costi, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Saldo netto', value: stats.saldo, color: stats.saldo >= 0 ? '#16a34a' : '#dc2626', bg: stats.saldo >= 0 ? '#dcfce7' : '#fee2e2' },
    { label: 'Crediti in sospeso', value: stats.crediti, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Debiti in sospeso', value: stats.debiti, color: '#d97706', bg: '#fef3c7' },
  ];

  return (
    <div className="page dashboard-page">
      <div className="dash-header">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h2>
        <div className="filter-date-group">
          <label className="filter-date-label">Dal</label>
          <input className="filter-date-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <label className="filter-date-label">Al</label>
          <input className="filter-date-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ background: k.bg }}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value" style={{ color: k.color }}>{fmt(k.value)}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="card chart-card">
          <h3 className="section-title">Ricavi vs Costi <span className="year-badge">{new Date().getFullYear()}</span></h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(v)} />
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

        <div className="card chart-card">
          <h3 className="section-title">Andamento saldo <span className="year-badge">{new Date().getFullYear()}</span></h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-dot" style={{ background: '#2563eb' }} /> Saldo mensile
          </div>
        </div>
      </div>

      {recentEntries.length > 0 && (
        <div className="card">
          <h3 className="section-title">Voci nel periodo</h3>
          <div className="recent-list">
            {recentEntries.map(e => {
              const t = ENTRY_TYPES[e.type];
              return (
                <div key={e.id} className="recent-row">
                  <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span>
                  <span className="recent-desc">{e.description}</span>
                  {e.contactName && <span className="recent-contact">{e.contactName}</span>}
                  <span className="recent-date">{fmtDate(e.date)}</span>
                  <span className="recent-amount" style={{ color: t.color }}>{fmt(e.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="empty-state">
          <p>Nessuna voce ancora.</p>
          <p>Vai su <strong>Aggiungi</strong> per inserire la prima!</p>
        </div>
      )}
    </div>
  );
}
