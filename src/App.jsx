import { useState } from 'react';
import Dashboard from './components/Dashboard';
import AddEntry from './components/AddEntry';
import EntryList from './components/EntryList';
import Analysis from './components/Analysis';
import { useEntries } from './hooks/useEntries';
import './index.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'add', label: 'Aggiungi', icon: '+' },
  { id: 'list', label: 'Voci', icon: '≡' },
  { id: 'analysis', label: 'Analisi', icon: '◉' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const { entries, loading, addEntry, deleteEntry, updateEntryStatus } = useEntries();

  async function handleAdd(data) {
    await addEntry(data);
    setTab('list');
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">◈</span>
        <h1 className="app-name">Business Tracker</h1>
      </header>

      <main className="app-main">
        {tab === 'dashboard' && <Dashboard entries={entries} />}
        {tab === 'add' && <AddEntry onAdd={handleAdd} onNavigate={setTab} />}
        {tab === 'list' && <EntryList entries={entries} onDelete={deleteEntry} onUpdateStatus={updateEntryStatus} />}
        {tab === 'analysis' && <Analysis entries={entries} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
