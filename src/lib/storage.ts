import type { PlannerState, SavedScenario } from './types'

const STORAGE_KEY = 'ancira-forecast-planner-scenarios'

export function loadScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function persistScenarios(scenarios: SavedScenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

export function saveScenario(name: string, state: PlannerState, existingId?: string) {
  const scenarios = loadScenarios()
  const now = new Date().toISOString()
  const id = existingId ?? crypto.randomUUID()
  const scenario: SavedScenario = { id, name, updatedAt: now, state }
  const next = scenarios.some((item) => item.id === id)
    ? scenarios.map((item) => (item.id === id ? scenario : item))
    : [...scenarios, scenario]

  persistScenarios(next)
  return scenario
}

export function deleteScenario(id: string) {
  persistScenarios(loadScenarios().filter((scenario) => scenario.id !== id))
}
