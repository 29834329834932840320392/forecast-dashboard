export type Period = 'Month' | 'Quarter'

export type Channel = {
  id: string
  name: string
  color: string
  leads: number
  apptSetPct: number
  showPct: number
  closePct: number
}

export type PlannerState = {
  newGoal: number
  usedGoal: number
  avgGross: number
  costPerLead: number
  period: Period
  channels: Channel[]
}

export type SavedScenario = {
  id: string
  name: string
  updatedAt: string
  state: PlannerState
}
