import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ENTRY_TYPES, calcNetto } from '../constants';

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

function fmt(n = 0) {
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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function yearStart() { return localDate(new Date(new Date().getFullYear(), 0, 1)); }
function yearEnd()   { return localDate(new Date(new Date().getFullYear(), 12, 0)); }

/* ── Tooltip grafico ── */
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

/* ── Barra classifica ── */
function RankedBar({ name, value, maxVal, color }) {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
  return (
    <div className="ranked-row">
      <div className="ranked-top">
        <span className="ranked-name">{name}</span>
        <span className="ranked-val" style={{ color }}>{fmt(value)}</span>
      </div>
      <div className="ranked-track">
        <div className="ranked-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function Dashboard({ entries, projects = [], contacts = [] }) {
  const [dateFrom, setDateFrom] = useState(yearStart());
  const [dateTo,   setDateTo]   = useState(yearEnd());
  const [copied,   setCopied]   = useState(false);

  /* filtro per data */
  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to   = dateTo   ? new Date(dateTo + 'T23:59:59') : null;
    return entries.filter(e => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  }, [entries, dateFrom, dateTo]);

  /* KPI */
  const stats = useMemo(() => {
    const ricavi  = filtered.filter(e => e.type === 'ricavo') .reduce((s,e) => s + (e.amount||0), 0);
    const costi   = filtered.filter(e => e.type === 'costo')  .reduce((s,e) => s + (e.amount||0), 0);
    const crediti = filtered.filter(e => e.type === 'credito' && e.status === 'in_sospeso').reduce((s,e) => s + (e.amount||0), 0);
    const debiti  = filtered.filter(e => e.type === 'debito'  && e.status === 'in_sospeso').reduce((s,e) => s + (e.amount||0), 0);
    const ricaviN = filtered.filter(e => e.type === 'ricavo') .reduce((s,e) => s + calcNetto(e.amount||0, e.ivaRate||0), 0);
    const costiN  = filtered.filter(e => e.type === 'costo')  .reduce((s,e) => s + calcNetto(e.amount||0, e.ivaRate||0), 0);
    const hasIva  = filtered.some(e => (e.ivaRate||0) > 0);
    return { ricavi, costi, saldo: ricavi - costi, crediti, debiti, ricaviN, costiN, saldoN: ricaviN - costiN, hasIva };
  }, [filtered]);

  /* grafico mensile */
  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTHS.map((name, i) => {
      const month = entries.filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      const ricavi = month.filter(e => e.type === 'ricavo').reduce((s,e) => s + (e.amount||0), 0);
      const costi  = month.filter(e => e.type === 'costo') .reduce((s,e) => s + (e.amount||0), 0);
      return { name, ricavi, costi };
    });
  }, [entries]);

  /* top costi per categoria */
  const topCosti = useMemo(() => {
    const map = {};
    filtered.filter(e => e.type === 'costo').forEach(e => {
      const k = e.category || '(Senza categoria)';
      map[k] = (map[k] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

  /* top ricavi per categoria */
  const topRicavi = useMemo(() => {
    const map = {};
    filtered.filter(e => e.type === 'ricavo').forEach(e => {
      const k = e.category || '(Senza categoria)';
      map[k] = (map[k] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

  /* top soggetti */
  const topClienti   = useMemo(() => {
    const map = {};
    filtered.filter(e => e.type === 'ricavo' && e.contactName).forEach(e => {
      map[e.contactName] = (map[e.contactName] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value).slice(0, 5);
  }, [filtered]);

  const topFornitori = useMemo(() => {
    const map = {};
    filtered.filter(e => e.type === 'costo' && e.contactName).forEach(e => {
      map[e.contactName] = (map[e.contactName] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value).slice(0, 5);
  }, [filtered]);

  /* ultime voci */
  const recentEntries = useMemo(() =>
    [...filtered].sort((a,b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return db - da;
    }).slice(0, 8),
    [filtered]
  );

  const maxCosto  = topCosti[0]?.value  || 1;
  const maxRicavo = topRicavi[0]?.value || 1;
  const maxCliente   = topClienti[0]?.value   || 1;
  const maxFornitore = topFornitori[0]?.value || 1;

  const kpis = [
    { label: 'Ricavi',             value: stats.ricavi,  netto: stats.ricaviN, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Costi',              value: stats.costi,   netto: stats.costiN,  color: '#dc2626', bg: '#fee2e2' },
    { label: 'Saldo',              value: stats.saldo,   netto: stats.saldoN,  color: stats.saldo >= 0 ? '#16a34a' : '#dc2626', bg: stats.saldo >= 0 ? '#dcfce7' : '#fee2e2' },
    { label: 'Crediti in sospeso', value: stats.crediti, netto: null,          color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Debiti in sospeso',  value: stats.debiti,  netto: null,          color: '#d97706', bg: '#fef3c7' },
  ];

  /* ─── Genera testo per Claude ─── */
  function generateReport() {
    const fmtDate2 = (val) => {
      if (!val) return '—';
      const d = val?.toDate ? val.toDate() : new Date(val);
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    const periodoLabel = `${dateFrom ? new Date(dateFrom).toLocaleDateString('it-IT') : 'inizio'} – ${dateTo ? new Date(dateTo).toLocaleDateString('it-IT') : 'oggi'}`;

    const lines = [];

    lines.push(`# Riepilogo finanziario`);
    lines.push(`Aggiornato al: ${today}`);
    lines.push(`Periodo analizzato: ${periodoLabel}`);
    lines.push('');

    // KPI
    lines.push(`## KPI del periodo`);
    lines.push(`- Ricavi: ${fmt(stats.ricavi)}${stats.hasIva ? ` (imponibile ${fmt(stats.ricaviN)})` : ''}`);
    lines.push(`- Costi: ${fmt(stats.costi)}${stats.hasIva ? ` (imponibile ${fmt(stats.costiN)})` : ''}`);
    lines.push(`- Saldo: ${fmt(stats.saldo)}${stats.hasIva ? ` (imponibile ${fmt(stats.saldoN)})` : ''}`);
    if (stats.crediti > 0) lines.push(`- Crediti in sospeso: ${fmt(stats.crediti)}`);
    if (stats.debiti  > 0) lines.push(`- Debiti in sospeso: ${fmt(stats.debiti)}`);
    lines.push('');

    // Costi per categoria
    if (topCosti.length > 0) {
      lines.push(`## Costi per categoria`);
      topCosti.forEach((item, i) => lines.push(`${i+1}. ${item.name}: ${fmt(item.value)}`));
      lines.push('');
    }

    // Ricavi per categoria
    if (topRicavi.length > 0) {
      lines.push(`## Ricavi per categoria`);
      topRicavi.forEach((item, i) => lines.push(`${i+1}. ${item.name}: ${fmt(item.value)}`));
      lines.push('');
    }

    // Top clienti
    if (topClienti.length > 0) {
      lines.push(`## Top clienti (per ricavi)`);
      topClienti.forEach((item, i) => lines.push(`${i+1}. ${item.name}: ${fmt(item.value)}`));
      lines.push('');
    }

    // Top fornitori
    if (topFornitori.length > 0) {
      lines.push(`## Top fornitori / spese`);
      topFornitori.forEach((item, i) => lines.push(`${i+1}. ${item.name}: ${fmt(item.value)}`));
      lines.push('');
    }

    // Progetti
    if (projects.length > 0) {
      lines.push(`## Progetti`);
      projects.forEach(p => {
        const pe = entries.filter(e => e.projectId === p.id);
        const ricaviP  = pe.filter(e => e.type === 'ricavo') .reduce((s,e) => s + (e.amount||0), 0);
        const costiP   = pe.filter(e => e.type === 'costo')  .reduce((s,e) => s + (e.amount||0), 0);
        const creditiP = pe.filter(e => e.type === 'credito').reduce((s,e) => s + (e.amount||0), 0);
        const fatturato = ricaviP + creditiP;
        const margine   = ricaviP - costiP;
        const statuses  = { in_corso: 'In corso', completato: 'Completato', sospeso: 'Sospeso' };
        const pct = p.value ? Math.round((fatturato / p.value) * 100) : 0;
        lines.push(`- **${p.name}** [${statuses[p.status] || p.status}]${p.contactName ? ` — ${p.contactName}` : ''}`);
        lines.push(`  Valore: ${fmt(p.value||0)} | Fatturato: ${fmt(fatturato)} (${pct}%) | Margine: ${fmt(margine)}`);
      });
      lines.push('');
    }

    // Tutte le voci del periodo
    const sorted = [...filtered].sort((a,b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return da - db;
    });
    if (sorted.length > 0) {
      lines.push(`## Voci del periodo (${sorted.length} totali)`);
      sorted.forEach(e => {
        const typeLabel = { ricavo: 'Ricavo', costo: 'Costo', credito: 'Credito', debito: 'Debito' }[e.type] || e.type;
        const parts = [
          fmtDate2(e.date),
          typeLabel,
          e.description,
          e.category || '',
          e.contactName || '',
          fmt(e.amount),
          e.status === 'in_sospeso' ? '[in sospeso]' : '',
        ].filter(Boolean);
        lines.push(`- ${parts.join(' | ')}`);
      });
    }

    return lines.join('\n');
  }

  function handleCopy() {
    const text = generateReport();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  /* ─── RENDER ─── */
  return (
    <div className="page dashboard-page">

      {/* Header + filtro date */}
      <div className="dash-header">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="filter-date-group">
            <label className="filter-date-label">Dal</label>
            <input className="filter-date-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <label className="filter-date-label">Al</label>
            <input className="filter-date-input" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn-claude-copy" onClick={handleCopy}>
            {copied ? '✓ Copiato!' : '⊹ Copia per Claude'}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ background: k.bg }}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value" style={{ color: k.color }}>{fmt(k.value)}</span>
            {stats.hasIva && k.netto !== null && Math.round(k.netto) !== Math.round(k.value) && (
              <span className="kpi-netto">imponibile {fmt(k.netto)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Grafico mensile */}
      <div className="card chart-card">
        <h3 className="section-title">
          Ricavi vs Costi <span className="year-badge">{new Date().getFullYear()}</span>
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ricavi" fill="#16a34a" radius={[3,3,0,0]} />
            <Bar dataKey="costi"  fill="#dc2626" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <span className="legend-dot" style={{ background: '#16a34a' }} /> Ricavi
          <span className="legend-dot" style={{ background: '#dc2626', marginLeft: 12 }} /> Costi
        </div>
      </div>

      {/* 4 blocchi affiancati */}
      {filtered.length > 0 && (
        <div className="dash-four-col">

          <div className="card">
            <h3 className="section-title" style={{ color: '#dc2626' }}>Costi per categoria</h3>
            {topCosti.length === 0
              ? <p className="cat-empty">Nessun costo nel periodo</p>
              : topCosti.map(item => (
                  <RankedBar key={item.name} name={item.name} value={item.value} maxVal={maxCosto} color="#dc2626" />
                ))
            }
          </div>

          <div className="card">
            <h3 className="section-title" style={{ color: '#16a34a' }}>Ricavi per categoria</h3>
            {topRicavi.length === 0
              ? <p className="cat-empty">Nessun ricavo nel periodo</p>
              : topRicavi.map(item => (
                  <RankedBar key={item.name} name={item.name} value={item.value} maxVal={maxRicavo} color="#16a34a" />
                ))
            }
          </div>

          <div className="card">
            <h3 className="section-title">Top clienti</h3>
            {topClienti.length === 0
              ? <p className="cat-empty">Nessun cliente nel periodo</p>
              : topClienti.map(item => (
                  <RankedBar key={item.name} name={item.name} value={item.value} maxVal={maxCliente} color="#16a34a" />
                ))
            }
          </div>

          <div className="card">
            <h3 className="section-title">Top fornitori / spese</h3>
            {topFornitori.length === 0
              ? <p className="cat-empty">Nessun fornitore nel periodo</p>
              : topFornitori.map(item => (
                  <RankedBar key={item.name} name={item.name} value={item.value} maxVal={maxFornitore} color="#dc2626" />
                ))
            }
          </div>

        </div>
      )}

      {/* Ultime voci */}
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
