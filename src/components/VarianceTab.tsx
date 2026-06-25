import { Activity, ArrowRight, Gauge, Users } from 'lucide-react'
import { currency, periodMultiplier, varianceResults, wholeNumber, wholePercent } from '../lib/calculations'
import type { PlannerState } from '../lib/types'

type VarianceTabProps = {
  state: PlannerState
  onChange: (patch: Partial<PlannerState>) => void
}

export function VarianceTab({ state, onChange }: VarianceTabProps) {
  const results = varianceResults(state)
  const multiplier = periodMultiplier(state)
  const isAbove = results.totalVariance >= 0
  const totalImpact = Math.abs(results.volumeImpact) + Math.abs(results.closeRateImpact)
  const volumeShare = totalImpact > 0 ? Math.abs(results.volumeImpact) / totalImpact : 0
  const closeShare = totalImpact > 0 ? Math.abs(results.closeRateImpact) / totalImpact : 0
  const primaryDriver =
    totalImpact === 0
      ? 'On forecast'
      : Math.abs(results.volumeImpact) >= Math.abs(results.closeRateImpact)
        ? 'Lead volume'
        : 'Close rate'

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <ArrowRight className="mt-0.5 shrink-0 text-blue-600" size={18} />
          <p>
            Enter what actually happened. The model splits the result into <strong>lead volume</strong> versus{' '}
            <strong>close rate</strong>, so the variance has a measurable explanation.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel">
          <h2 className="section-title">What Actually Happened</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <ActualInput
              label="Actual Total Leads"
              value={state.actualLeads * multiplier}
              onChange={(value) => onChange({ actualLeads: value / multiplier })}
            />
            <ActualInput
              label="Actual Units Sold"
              value={state.actualUnitsSold * multiplier}
              onChange={(value) => onChange({ actualUnitsSold: value / multiplier })}
            />
          </div>
          <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            Forecast baseline: <strong>{wholeNumber.format(results.plannedLeads)} leads</strong> at a{' '}
            <strong>{wholePercent.format(results.plannedCloseRate * 100)}% close rate</strong> ={' '}
            <strong>{wholeNumber.format(results.plannedUnits)} units</strong>.
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <Gauge size={17} />
            Actual close rate: <strong className="text-slate-950">{wholePercent.format(results.actualCloseRate * 100)}%</strong>
          </div>
        </section>

        <section className="panel">
          <h2 className="section-title">Why We Missed (or Beat It)</h2>
          <div
            className={`rounded-lg border-l-4 p-5 ${
              isAbove ? 'border-l-emerald-500 bg-emerald-50' : 'border-l-orange-500 bg-orange-50'
            }`}
          >
            <div className="text-xs font-bold uppercase text-slate-500">Total Variance</div>
            <div className="mt-1 text-4xl font-bold text-slate-950">{signedNumber(results.totalVariance)}</div>
            <div className={`mt-1 text-sm font-bold ${isAbove ? 'text-emerald-700' : 'text-orange-700'}`}>
              units {isAbove ? 'above' : 'below'} forecast
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Detail</th>
                  <th className="text-right">Unit Impact</th>
                </tr>
              </thead>
              <tbody>
                <DriverRow
                  icon={<Users size={17} />}
                  label="Lead volume"
                  detail={`${signedNumber(results.leadDifference)} leads vs plan`}
                  impact={results.volumeImpact}
                />
                <DriverRow
                  icon={<Activity size={17} />}
                  label="Close rate"
                  detail={`${wholePercent.format(results.actualCloseRate * 100)}% vs ${wholePercent.format(results.plannedCloseRate * 100)}%`}
                  impact={results.closeRateImpact}
                />
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase text-slate-500">Primary Driver</div>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{primaryDriver}</h2>
          </div>
          <div className="grid min-w-64 gap-2 text-sm">
            <ShareRow label="Lead volume share" value={volumeShare} color="bg-blue-500" />
            <ShareRow label="Close-rate share" value={closeShare} color="bg-emerald-500" />
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Estimated gross variance: <strong className="text-slate-950">{signedCurrency(results.totalVariance * state.avgGross)}</strong>
        </p>
      </section>
    </div>
  )
}

function ActualInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input
        className="field-input text-right"
        min="0"
        step="1"
        type="number"
        value={Math.round(value)}
        onChange={(event) => onChange(Math.max(0, Math.round(Number(event.target.value))))}
      />
    </label>
  )
}

function DriverRow({
  icon,
  label,
  detail,
  impact,
}: {
  icon: React.ReactNode
  label: string
  detail: string
  impact: number
}) {
  return (
    <tr>
      <td>
        <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
          <span className="text-slate-500">{icon}</span>
          {label}
        </span>
      </td>
      <td>{detail}</td>
      <td className="text-right font-bold text-slate-950">{signedNumber(impact)}</td>
    </tr>
  )
}

function ShareRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-4">
        <span className="text-slate-600">{label}</span>
        <strong>{wholePercent.format(value * 100)}%</strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(value * 100, 100)}%` }} />
      </div>
    </div>
  )
}

function signedNumber(value: number) {
  const rounded = Math.round(value)
  return `${rounded >= 0 ? '+' : ''}${wholeNumber.format(rounded)}`
}

function signedCurrency(value: number) {
  return `${value >= 0 ? '+' : '-'}${currency.format(Math.abs(value))}`
}
