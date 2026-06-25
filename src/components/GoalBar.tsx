import { currency, periodMultiplier, targetGross, totalTarget, wholeNumber } from '../lib/calculations'
import type { PlannerState } from '../lib/types'

type GoalBarProps = {
  state: PlannerState
  onChange: (patch: Partial<PlannerState>) => void
}

export function GoalBar({ state, onChange }: GoalBarProps) {
  const multiplier = periodMultiplier(state)

  return (
    <section className="goal-bar">
      <NumberField
        label="New Units Goal"
        value={state.newGoal * multiplier}
        onChange={(newGoal) => onChange({ newGoal: newGoal / multiplier })}
      />
      <NumberField
        label="Used Units Goal"
        value={state.usedGoal * multiplier}
        onChange={(usedGoal) => onChange({ usedGoal: usedGoal / multiplier })}
      />
      <Summary label="Total Target" value={wholeNumber.format(totalTarget(state))} />
      <NumberField
        label="Avg Gross / Unit"
        value={state.avgGross}
        prefix="$"
        onChange={(avgGross) => onChange({ avgGross })}
      />
      <Summary label="Target Gross" value={currency.format(targetGross(state))} />
    </section>
  )
}

function NumberField({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string
  value: number
  prefix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="goal-field">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        {prefix ? <span className="text-white/70">{prefix}</span> : null}
        <input
          className="goal-input"
          min="0"
          step="1"
          type="number"
          value={Math.round(value)}
          onChange={(event) => onChange(Math.round(Number(event.target.value)))}
        />
      </div>
    </label>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="goal-summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
