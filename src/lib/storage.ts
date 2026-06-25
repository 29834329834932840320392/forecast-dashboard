import type { PlannerState, SavedScenario } from './types'

const STORAGE_KEY = 'ancira-forecast-planner-scenarios'
const GOAL_STORAGE_KEY = 'ancira-forecast-planner-goals'

export type GoalPreferences = Pick<PlannerState, 'newGoal' | 'usedGoal' | 'avgGross'>

export function loadGoalPreferences(): GoalPreferences | null {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GoalPreferences>
    if (
      !Number.isFinite(parsed.newGoal) ||
      !Number.isFinite(parsed.usedGoal) ||
      !Number.isFinite(parsed.avgGross)
    ) {
      return null
    }

    return {
      newGoal: Math.max(0, Number(parsed.newGoal)),
      usedGoal: Math.max(0, Number(parsed.usedGoal)),
      avgGross: Math.max(0, Number(parsed.avgGross)),
    }
  } catch {
    return null
  }
}

export function persistGoalPreferences(preferences: GoalPreferences) {
  localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(preferences))
}

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
