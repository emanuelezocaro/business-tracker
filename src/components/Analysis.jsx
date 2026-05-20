import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ENTRY_TYPES } from '../constants';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
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

function PerCategoria({ entries }) {
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

function PerRicavo({ entries }) {
  const [selectedId, setSelectedId] = useState(null);

  const ricavi = useMemo(() =>
    entries.filter(e => e.type === 'ricavo' || e.type === 'credito').sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return db2 - da;
    }),
    [entries]
  );

  // Raggruppa per descrizione + contatto
  const grouped = useMemo(() => {
    const map = new Map();
    ricavi.forEach(r => {
      const key = `${r.description}||${r.contactName || ''}`;
      if (!map.has(key)) {
        map.set(key, { key, entries: [r], description: r.description, contactName: r.contactName, contactType: r.contactType });
      } else {
        map.get(key).entries.push(r);
      }
    });
    return [...map.values()];
  }, [ricavi]);

  // Solo costi non collegati — i debiti non vanno qui
  const costiNonCollegati = useMemo(() =>
    entries.filter(e => e.type === 'costo' && !e.linkedEntryId && !e.linkedRevenueId),
    [entries]
  );

  function getCostiFor(id) {
    return entries.filter(e =>
      (e.type === 'costo' || e.type === 'debito') &&
      (e.linkedEntryId === id || e.linkedRevenueId === id)
    );
  }

  function fmtDate(val) {
    if (!val) return '';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (grouped.length === 0 && costiNonCollegati.length === 0) {
    return <div className="empty-state">Nessun ricavo ancora inserito.</div>;
  }

  return (
    <div className="revenue-breakdown">
      {grouped.map(group => {
        const costi = group.entries.flatMap(r => getCostiFor(r.id));
        // Separare ricavi incassati da crediti ancora da incassare
        const totalIncassato = group.entries.filter(e => e.type === 'ricavo').reduce((s, r) => s + r.amount, 0);
        const totalCrediti = group.entries.filter(e => e.type === 'credito').reduce((s, r) => s + r.amount, 0);
        const totaleCosti = costi.reduce((s, c) => s + c.amount, 0);
        const margine = totalIncassato - totaleCosti;
        const isOpen = selectedId === group.key;
        const latestDate = group.entries.reduce((latest, r) => {
          const d = r.date?.toDate ? r.date.toDate() : new Date(r.date);
          return d > latest ? d : latest;
        }, new Date(0));

        return (
          <div key={group.key} className={`revenue-card ${isOpen ? 'open' : ''}`}>
            <div className="revenue-card-header" onClick={() => setSelectedId(isOpen ? null : group.key)}>
              <div className="revenue-card-left">
                <span className="revenue-toggle">{isOpen ? '▾' : '▸'}</span>
                <div>
                  <p className="revenue-name">{group.description}</p>
                  <div className="revenue-meta">
                    {group.contactName && (
                      <span className="contact-chip" style={{ background: '#dcfce7', color: '#16a34a' }}>{group.contactName}</span>
                    )}
                    <span className="entry-date">{fmtDate(latestDate)}</span>
                    {totalCrediti > 0 && (
                      <span className="rev-credit-badge">⏳ {fmt(totalCrediti)} da incassare</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="revenue-card-kpis">
                <div className="rev-kpi">
                  <span className="rev-kpi-label">Incassato</span>
                  <span className="rev-kpi-value" style={{ color: '#16a34a' }}>{fmt(totalIncassato)}</span>
                </div>
                <div className="rev-kpi">
                  <span className="rev-kpi-label">Costi</span>
                  <span className="rev-kpi-value" style={{ color: '#dc2626' }}>{fmt(totaleCosti)}</span>
                </div>
                <div className="rev-kpi">
                  <span className="rev-kpi-label">Margine</span>
                  <span className="rev-kpi-value" style={{ color: margine >= 0 ? '#16a34a' : '#dc2626', fontWeight: 800 }}>{fmt(margine)}</span>
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="revenue-card-detail">
                {group.entries.length > 1 && (
                  <div className="rev-subentries">
                    {group.entries.map(r => (
                      <div key={r.id} className="rev-subentry-row">
                        <span style={{ fontSize: 11, fontWeight: 700, color: r.type === 'ricavo' ? '#16a34a' : '#d97706' }}>
                          {r.type === 'ricavo' ? '↑ Ricavo' : '⏳ Credito'}
                        </span>
                        <span className="rev-cost-desc" style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(r.date)}</span>
                        <span className="rev-cost-amount" style={{ color: r.type === 'ricavo' ? '#16a34a' : '#d97706' }}>{fmt(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {costi.length === 0 ? (
                  <p className="cat-empty">Nessun costo collegato a questo ricavo.</p>
                ) : (
                  costi.map(c => (
                    <div key={c.id} className="rev-cost-row">
                      <span className="rev-cost-desc">{c.description}</span>
                      {c.contactName && <span className="contact-chip" style={{ background: '#dbeafe', color: '#2563eb' }}>{c.contactName}</span>}
                      {c.category && <span className="entry-cat">{c.category}</span>}
                      <span className="rev-cost-date">{fmtDate(c.date)}</span>
                      <span className="rev-cost-amount" style={{ color: '#dc2626' }}>{fmt(c.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {costiNonCollegati.length > 0 && (
        <div className="revenue-card">
          <div className="revenue-card-header" onClick={() => setSelectedId(selectedId === '__none__' ? null : '__none__')}>
            <div className="revenue-card-left">
              <span className="revenue-toggle">{selectedId === '__none__' ? '▾' : '▸'}</span>
              <div>
                <p className="revenue-name" style={{ color: '#64748b' }}>Costi senza ricavo collegato</p>
              </div>
            </div>
            <div className="revenue-card-kpis">
              <div className="rev-kpi">
                <span className="rev-kpi-label">Totale</span>
                <span className="rev-kpi-value" style={{ color: '#dc2626' }}>{fmt(costiNonCollegati.reduce((s, e) => s + e.amount, 0))}</span>
              </div>
            </div>
          </div>
          {selectedId === '__none__' && (
            <div className="revenue-card-detail">
              {costiNonCollegati.map(c => (
                <div key={c.id} className="rev-cost-row">
                  <span className="rev-cost-desc">{c.description}</span>
                  {c.contactName && <span className="contact-chip" style={{ background: '#dbeafe', color: '#2563eb' }}>{c.contactName}</span>}
                  {c.category && <span className="entry-cat">{c.category}</span>}
                  <span className="rev-cost-amount" style={{ color: '#dc2626' }}>{fmt(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Analysis({ entries }) {
  const [view, setView] = useState('categoria');

  return (
    <div className="page">
      <h2 className="page-title">Analisi</h2>

      <div className="subnav">
        <button className={`subnav-btn ${view === 'categoria' ? 'active' : ''}`} onClick={() => setView('categoria')}>
          Per categoria
        </button>
        <button className={`subnav-btn ${view === 'ricavo' ? 'active' : ''}`} onClick={() => setView('ricavo')}>
          Per ricavo
        </button>
      </div>

      {view === 'categoria' && <PerCategoria entries={entries} />}
      {view === 'ricavo' && <PerRicavo entries={entries} />}
    </div>
  );
}
