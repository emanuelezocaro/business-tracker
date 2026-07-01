const TABS = [
  { id: 'today', label: 'Oggi', icon: '☀️' },
  { id: 'week', label: 'Settimana', icon: '📅' },
  { id: 'report', label: 'Report', icon: '📊' },
  { id: 'activities', label: 'Attività', icon: '⚙️' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav__tab ${active === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
