import { useState, useMemo, useEffect } from 'react';
import { ENTRY_TYPES, buildCategories, STATUS_OPTIONS } from '../constants';
import { CONTACT_TYPES } from './Contacts';
import { PerCategoria } from './Analysis';

export const PROJECT_STATUSES = {
  in_corso:   { label: 'In corso',   color: '#2563eb', bg: '#dbeafe' },
  completato: { label: 'Completato', color: '#16a34a', bg: '#dcfce7' },
  sospeso:    { label: 'Sospeso',    color: '#d97706', bg: '#fef3c7' },
};

function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

function fmtDate(val) {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const today = () => new Date().toISOString().split('T')[0];

function getStats(project, entries) {
  const pe = entries.filter(e => e.projectId === project.id);
  const ricavi  = pe.filter(e => e.type === 'ricavo').reduce((s, e)  => s + e.amount, 0);
  const crediti = pe.filter(e => e.type === 'credito').reduce((s, e) => s + e.amount, 0);
  const costi   = pe.filter(e => e.type === 'costo').reduce((s, e)   => s + e.amount, 0);
  const debiti  = pe.filter(e => e.type === 'debito').reduce((s, e)  => s + e.amount, 0);
  const fatturato = ricavi + crediti;
  const daFatturare = Math.max(0, (project.value || 0) - fatturato);
  const margineOggi = ricavi - costi;
  const margineCompletamento = (ricavi + crediti) - (costi + debiti);
  const pct = project.value ? Math.min(100, Math.round((fatturato / project.value) * 100)) : 0;
  return { ricavi, crediti, costi, debiti, fatturato, daFatturare, margineOggi, margineCompletamento, pct, projectEntries: pe };
}

// ── Nuovo progetto ────────────────────────────────────

function NewProjectModal({ contacts, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', contactId: '', value: '', status: 'in_corso', notes: '' });
  const [saving, setSaving] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.value) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    await onSave({
      name: form.name,
      contactId: form.contactId || null,
      contactName: contact?.name || null,
      contactType: contact?.type || null,
      value: form.value,
      status: form.status,
      notes: form.notes,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Nuovo progetto</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <label className="field-label">Nome progetto *</label>
            <input className="field-input" type="text" placeholder="Es. Sito web Azienda X"
              value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />

            <label className="field-label">Cliente</label>
            <select className="field-input" value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">Nessuno</option>
              {contacts.map(c => {
                const t = CONTACT_TYPES.find(x => x.key === c.type);
                return <option key={c.id} value={c.id}>{c.name} — {t?.label || c.type}</option>;
              })}
            </select>

            <label className="field-label">Valore concordato (€) *</label>
            <input className="field-input" type="number" inputMode="decimal" placeholder="0,00" min="0" step="0.01"
              value={form.value} onChange={e => set('value', e.target.value)} required />

            <label className="field-label">Stato</label>
            <select className="field-input" value={form.status} onChange={e => set('status', e.target.value)}>
              {Object.entries(PROJECT_STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>

            <label className="field-label">Note (opzionale)</label>
            <textarea className="field-input field-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>Annulla</button>
              <button className="btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Salvataggio...' : 'Crea progetto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Aggiungi voce al progetto ─────────────────────────

function ProjectEntryModal({ project, customCategories, contacts, entries, onSave, onClose }) {
  const [form, setForm] = useState({
    type: 'ricavo', amount: '', description: '', category: '',
    contactId: project.contactId || '', date: today(), status: 'in_sospeso', linkedEntryId: '',
  });
  const [saving, setSaving] = useState(false);

  const cats = buildCategories(form.type, customCategories);
  const needsStatus = form.type === 'credito' || form.type === 'debito';
  const canLink = form.type === 'costo' || form.type === 'debito';

  const linkableEntries = useMemo(() =>
    entries.filter(e => ['ricavo', 'credito'].includes(e.type) && (e.projectId === project.id || !e.projectId)),
    [entries, project.id]
  );

  function set(f, v) {
    setForm(p => ({ ...p, [f]: v, ...(f === 'type' ? { category: '', linkedEntryId: '' } : {}) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSaving(true);
    const contact = contacts.find(c => c.id === form.contactId);
    const linked = entries.find(r => r.id === form.linkedEntryId);
    await onSave({
      type: form.type,
      amount: form.amount,
      description: form.description,
      category: form.category || null,
      contactId: form.contactId || null,
      contactName: contact?.name || project.contactName || null,
      contactType: contact?.type || project.contactType || null,
      date: new Date(form.date),
      status: needsStatus ? form.status : 'completato',
      notes: '',
      projectId: project.id,
      linkedEntryId: linked?.id || null,
      linkedEntryDescription: linked?.description || null,
      linkedEntryType: linked?.type || null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Aggiungi — {project.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <div className="type-tabs">
              {Object.entries(ENTRY_TYPES).map(([key, t]) => (
                <button key={key} type="button"
                  className={`type-tab ${form.type === key ? 'active' : ''}`}
                  style={form.type === key ? { background: t.color, color: '#fff' } : {}}
                  onClick={() => set('type', key)}
                >{t.icon} {t.label}</button>
              ))}
            </div>

            <label className="field-label">Importo (€) *</label>
            <input className="field-input" type="number" inputMode="decimal" placeholder="0,00" min="0" step="0.01"
              value={form.amount} onChange={e => set('amount', e.target.value)} required autoFocus />

            <label className="field-label">Descrizione *</label>
            <input className="field-input" type="text" value={form.description} onChange={e => set('description', e.target.value)} required />

            {cats.length > 0 && (
              <>
                <label className="field-label">Categoria</label>
                <select className="field-input" value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Seleziona...</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}

            <label className="field-label">Contatto</label>
            <select className="field-input" value={form.contactId} onChange={e => set('contactId', e.target.value)}>
              <option value="">Nessuno</option>
              {contacts.map(c => {
                const t = CONTACT_TYPES.find(x => x.key === c.type);
                return <option key={c.id} value={c.id}>{c.name} — {t?.label || c.type}</option>;
              })}
            </select>

            {canLink && linkableEntries.length > 0 && (
              <>
                <label className="field-label">Collega a ricavo/credito</label>
                <select className="field-input" value={form.linkedEntryId} onChange={e => set('linkedEntryId', e.target.value)}>
                  <option value="">Nessuno</option>
                  {linkableEntries.map(r => (
                    <option key={r.id} value={r.id}>{r.description} ({fmt(r.amount)})</option>
                  ))}
                </select>
              </>
            )}

            <label className="field-label">Data</label>
            <input className="field-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />

            {needsStatus && (
              <>
                <label className="field-label">Stato</label>
                <div className="radio-group">
                  {Object.entries(STATUS_OPTIONS).map(([key, s]) => (
                    <label key={key} className={`radio-option ${form.status === key ? 'selected' : ''}`}>
                      <input type="radio" name="pe-status" value={key} checked={form.status === key} onChange={() => set('status', key)} />
                      <span style={{ color: s.color }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>Annulla</button>
              <button className="btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? '...' : 'Aggiungi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Dettaglio progetto ────────────────────────────────

function ProjectDetail({ project, entries, contacts, customCategories, onBack, onAddEntry, onDeleteProject }) {
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { ricavi, crediti, costi, debiti, fatturato, daFatturare, margineOggi, margineCompletamento, pct, projectEntries } =
    useMemo(() => getStats(project, entries), [project, entries]);

  const entrate = projectEntries.filter(e => e.type === 'ricavo' || e.type === 'credito');
  const uscite  = projectEntries.filter(e => e.type === 'costo'  || e.type === 'debito');

  const st = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.in_corso;
  const ct = project.contactType ? CONTACT_TYPES.find(x => x.key === project.contactType) : null;

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Tutti i progetti</button>

      <div className="proj-detail-titlerow">
        <div>
          <h2 className="page-title" style={{ marginBottom: 6 }}>{project.name}</h2>
          <div className="revenue-meta">
            {project.contactName && (
              <span className="contact-chip" style={{ background: ct?.bg || '#dcfce7', color: ct?.color || '#16a34a' }}>
                {project.contactName}
              </span>
            )}
            <span className="entry-type-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Concordato: <strong style={{ color: 'var(--text)' }}>{fmt(project.value || 0)}</strong>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {confirmDelete ? (
            <>
              <span className="confirm-text">Eliminare?</span>
              <button className="btn-danger-sm" onClick={() => { onDeleteProject(project.id); onBack(); }}>Sì</button>
              <button className="btn-ghost-sm" onClick={() => setConfirmDelete(false)}>No</button>
            </>
          ) : (
            <button className="btn-icon btn-icon-danger" onClick={() => setConfirmDelete(true)} title="Elimina progetto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="proj-progress-bar">
          <div className="proj-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="proj-progress-label">{pct}% fatturato — {fmt(fatturato)} di {fmt(project.value || 0)}</p>
      </div>

      {/* KPI grid */}
      <div className="proj-kpi-grid">
        <div className="proj-kpi"><span className="proj-kpi-label">Incassato</span><span className="proj-kpi-value" style={{ color: '#16a34a' }}>{fmt(ricavi)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Da incassare</span><span className="proj-kpi-value" style={{ color: crediti > 0 ? '#d97706' : '#94a3b8' }}>{fmt(crediti)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Da fatturare</span><span className="proj-kpi-value" style={{ color: daFatturare > 0 ? '#2563eb' : '#94a3b8' }}>{fmt(daFatturare)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Costi pagati</span><span className="proj-kpi-value" style={{ color: costi > 0 ? '#dc2626' : '#94a3b8' }}>{fmt(costi)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Debiti</span><span className="proj-kpi-value" style={{ color: debiti > 0 ? '#7c3aed' : '#94a3b8' }}>{fmt(debiti)}</span></div>
        <div className="proj-kpi proj-kpi-accent"><span className="proj-kpi-label">Margine oggi</span><span className="proj-kpi-value" style={{ color: margineOggi >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(margineOggi)}</span></div>
        <div className="proj-kpi"><span className="proj-kpi-label">Margine completamento</span><span className="proj-kpi-value" style={{ color: margineCompletamento >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(margineCompletamento)}</span></div>
      </div>

      {/* Entrate */}
      <div className="proj-section">
        <div className="proj-section-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Entrate</h3>
          <button className="btn-add" onClick={() => setShowEntryModal(true)}>+ Aggiungi</button>
        </div>
        {entrate.length === 0 ? (
          <p className="cat-empty">Nessuna entrata collegata a questo progetto.</p>
        ) : (
          <div className="proj-entry-list">
            {entrate.map(e => {
              const t = ENTRY_TYPES[e.type];
              return (
                <div key={e.id} className="proj-entry-row">
                  <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span>
                  <span className="proj-entry-desc">{e.description}</span>
                  {e.contactName && <span className="contact-chip" style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11 }}>{e.contactName}</span>}
                  <span className="proj-entry-date">{fmtDate(e.date)}</span>
                  <span className="proj-entry-amount" style={{ color: t.color }}>{fmt(e.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Uscite */}
      <div className="proj-section">
        <div className="proj-section-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Uscite</h3>
          <button className="btn-add" onClick={() => setShowEntryModal(true)}>+ Aggiungi</button>
        </div>
        {uscite.length === 0 ? (
          <p className="cat-empty">Nessuna uscita collegata a questo progetto.</p>
        ) : (
          <div className="proj-entry-list">
            {uscite.map(e => {
              const t = ENTRY_TYPES[e.type];
              return (
                <div key={e.id} className="proj-entry-row">
                  <span className="entry-type-badge" style={{ background: t.bg, color: t.color }}>{t.icon} {t.label}</span>
                  <span className="proj-entry-desc">{e.description}</span>
                  {e.contactName && <span className="contact-chip" style={{ background: '#dbeafe', color: '#2563eb', fontSize: 11 }}>{e.contactName}</span>}
                  <span className="proj-entry-date">{fmtDate(e.date)}</span>
                  <span className="proj-entry-amount" style={{ color: t.color }}>{fmt(e.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEntryModal && (
        <ProjectEntryModal
          project={project}
          customCategories={customCategories}
          contacts={contacts}
          entries={entries}
          onSave={onAddEntry}
          onClose={() => setShowEntryModal(false)}
        />
      )}
    </div>
  );
}

// ── Card lista progetti ───────────────────────────────

function ProjectCard({ project, entries, onClick }) {
  const { ricavi, crediti, costi, margineOggi, pct } = useMemo(() => getStats(project, entries), [project, entries]);
  const st = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.in_corso;
  const ct = project.contactType ? CONTACT_TYPES.find(x => x.key === project.contactType) : null;

  return (
    <div className="proj-card" onClick={onClick}>
      <div className="proj-card-top">
        <div>
          <p className="proj-card-name">{project.name}</p>
          <div className="revenue-meta" style={{ marginTop: 4 }}>
            {project.contactName && (
              <span className="contact-chip" style={{ background: ct?.bg || '#dcfce7', color: ct?.color || '#16a34a' }}>
                {project.contactName}
              </span>
            )}
            <span className="entry-type-badge" style={{ background: st.bg, color: st.color, fontSize: 10 }}>{st.label}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>Concordato</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{fmt(project.value || 0)}</p>
        </div>
      </div>

      <div className="proj-progress-bar" style={{ margin: '10px 0 4px' }}>
        <div className="proj-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="proj-progress-label">{pct}% fatturato</p>

      <div className="proj-card-kpis">
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Incassato</span>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>{fmt(ricavi)}</span>
        </div>
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Crediti</span>
          <span style={{ color: crediti > 0 ? '#d97706' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{fmt(crediti)}</span>
        </div>
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Costi</span>
          <span style={{ color: costi > 0 ? '#dc2626' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{fmt(costi)}</span>
        </div>
        <div className="proj-card-kpi">
          <span className="proj-kpi-label">Margine oggi</span>
          <span style={{ color: margineOggi >= 0 ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: 13 }}>{fmt(margineOggi)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────

export default function Projects({ projects, entries, contacts, customCategories, onAdd, onUpdate, onDelete, onAddEntry }) {
  const [view, setView] = useState('lista');
  const [selectedId, setSelectedId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (selectedId && !projects.find(p => p.id === selectedId)) setSelectedId(null);
  }, [projects, selectedId]);

  const selectedProject = selectedId ? projects.find(p => p.id === selectedId) : null;

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        entries={entries}
        contacts={contacts}
        customCategories={customCategories}
        onBack={() => setSelectedId(null)}
        onAddEntry={onAddEntry}
        onUpdateProject={onUpdate}
        onDeleteProject={(id) => { onDelete(id); setSelectedId(null); }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <h2 className="page-title">Progetti</h2>
        <button className="btn-add" onClick={() => setShowNewModal(true)}>+ Nuovo</button>
      </div>

      <div className="subnav">
        <button className={`subnav-btn ${view === 'lista' ? 'active' : ''}`} onClick={() => setView('lista')}>Lista</button>
        <button className={`subnav-btn ${view === 'analisi' ? 'active' : ''}`} onClick={() => setView('analisi')}>Per categoria</button>
      </div>

      {view === 'lista' && (
        projects.length === 0
          ? <div className="empty-state">Nessun progetto. Crea il primo con "+ Nuovo".</div>
          : <div className="proj-list">{projects.map(p => <ProjectCard key={p.id} project={p} entries={entries} onClick={() => setSelectedId(p.id)} />)}</div>
      )}

      {view === 'analisi' && <PerCategoria entries={entries} />}

      {showNewModal && (
        <NewProjectModal contacts={contacts} onSave={onAdd} onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
}
