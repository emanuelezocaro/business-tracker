import { useCallback, useEffect, useState } from 'react'

const ACTIVITIES_KEY = 'weekly:activities'
const LOGS_KEY = 'weekly:logs'

const DEFAULT_ACTIVITIES = [
  { id: 'leggere', name: 'Leggere', emoji: '📖' },
  { id: 'sport', name: 'Sport', emoji: '🏃' },
  { id: 'inglese', name: 'Inglese', emoji: '🇬🇧' },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼' },
]

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function makeId() {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function useHabitData() {
  const [activities, setActivities] = useState(() =>
    loadJSON(ACTIVITIES_KEY, DEFAULT_ACTIVITIES),
  )
  const [logs, setLogs] = useState(() => loadJSON(LOGS_KEY, {}))

  useEffect(() => {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
  }, [activities])

  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
  }, [logs])

  const toggleEntry = useCallback((iso, activityId) => {
    setLogs((prev) => {
      const day = prev[iso] || {}
      const nextDay = { ...day, [activityId]: !day[activityId] }
      return { ...prev, [iso]: nextDay }
    })
  }, [])

  const addActivity = useCallback((name, emoji) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setActivities((prev) => [...prev, { id: makeId(), name: trimmed, emoji: emoji || '✅' }])
  }, [])

  const renameActivity = useCallback((id, name, emoji) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: name.trim() || a.name, emoji: emoji || a.emoji } : a)),
    )
  }, [])

  const deleteActivity = useCallback((id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
    setLogs((prev) => {
      const next = {}
      for (const [iso, day] of Object.entries(prev)) {
        const { [id]: _removed, ...rest } = day
        next[iso] = rest
      }
      return next
    })
  }, [])

  const reorderActivities = useCallback((fromIndex, toIndex) => {
    setActivities((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  return {
    activities,
    logs,
    toggleEntry,
    addActivity,
    renameActivity,
    deleteActivity,
    reorderActivities,
  }
}
