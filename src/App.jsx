import { useState } from 'react';
import Dashboard from './components/Dashboard';
import AddEntry from './components/AddEntry';
import EntryList from './components/EntryList';
import Projects from './components/Projects';
import Contacts from './components/Contacts';
import { useEntries } from './hooks/useEntries';
import { useContacts } from './hooks/useContacts';
import { useCategories } from './hooks/useCategories';
import { useProjects } from './hooks/useProjects';
import './index.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'progetti', label: 'Progetti', icon: '◫' },
  { id: 'add', label: 'Aggiungi', icon: '+' },
  { id: 'list', label: 'Voci', icon: '≡' },
  { id: 'contacts', label: 'Gestione', icon: '⚙' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const { entries, loading: loadingEntries, addEntry, deleteEntry, updateEntryStatus, updateEntry } = useEntries();
  const { contacts, loading: loadingContacts, addContact, updateContact, deleteContact } = useContacts();
  const { categories, loading: loadingCategories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { projects, loading: loadingProjects, addProject, updateProject, deleteProject } = useProjects();

  async function handleAdd(data) {
    await addEntry(data);
    setTab('list');
  }

  if (loadingEntries || loadingContacts || loadingCategories || loadingProjects) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Caricamento...</p>
      </div>
    );
  }

  const content = (
    <>
      {tab === 'dashboard' && <Dashboard entries={entries} projects={projects} contacts={contacts} />}
      {tab === 'progetti' && <Projects projects={projects} entries={entries} contacts={contacts} customCategories={categories} onAdd={addProject} onUpdate={updateProject} onDelete={deleteProject} onAddEntry={addEntry} />}
      {tab === 'add' && <AddEntry onAdd={handleAdd} contacts={contacts} customCategories={categories} entries={entries} projects={projects} />}
      {tab === 'list' && <EntryList entries={entries} onDelete={deleteEntry} onUpdateStatus={updateEntryStatus} onUpdate={updateEntry} onAdd={addEntry} contacts={contacts} customCategories={categories} projects={projects} />}
      {tab === 'contacts' && <Contacts contacts={contacts} onAdd={addContact} onUpdate={updateContact} onDelete={deleteContact} categories={categories} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} />}
    </>
  );

  return (
    <div className="app">
      {/* Sidebar — solo desktop */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="app-logo">◈</span>
          <span className="app-name">Business Tracker</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sidebar-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Layout mobile */}
      <div className="mobile-shell">
        <header className="app-header">
          <span className="app-logo">◈</span>
          <h1 className="app-name">Business Tracker</h1>
        </header>
        <main className="app-main">{content}</main>
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

      {/* Contenuto principale — solo desktop */}
      <main className="desktop-main">{content}</main>
    </div>
  );
}
