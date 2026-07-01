import { useState } from 'react'
import BottomNav from './components/BottomNav'
import TodayView from './components/TodayView'
import WeekView from './components/WeekView'
import ReportView from './components/ReportView'
import ActivitiesView from './components/ActivitiesView'
import { useHabitData } from './hooks/useHabitData'
import './App.css'

const TITLES = {
  today: 'Oggi',
  week: 'Settimana',
  report: 'Report',
  activities: 'Attività',
}

function App() {
  const [tab, setTab] = useState('today')
  const {
    activities,
    logs,
    toggleEntry,
    addActivity,
    renameActivity,
    deleteActivity,
    reorderActivities,
    exportData,
    importData,
  } = useHabitData()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Weekly</h1>
        <p className="app-header__subtitle">{TITLES[tab]}</p>
      </header>

      <main className="app-main">
        {tab === 'today' && (
          <TodayView activities={activities} logs={logs} onToggle={toggleEntry} />
        )}
        {tab === 'week' && (
          <WeekView activities={activities} logs={logs} onToggle={toggleEntry} />
        )}
        {tab === 'report' && <ReportView activities={activities} logs={logs} />}
        {tab === 'activities' && (
          <ActivitiesView
            activities={activities}
            onAdd={addActivity}
            onRename={renameActivity}
            onDelete={deleteActivity}
            onReorder={reorderActivities}
            onExport={exportData}
            onImport={importData}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
