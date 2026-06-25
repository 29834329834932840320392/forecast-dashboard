import { ArrowRight, BadgeDollarSign, Target, TrendingUp } from 'lucide-react'
import { currency, whichLeverResults, wholeNumber, wholePercent } from '../lib/calculations'
import type { PlannerState } from '../lib/types'

type WhichLeverTabProps = {
  state: PlannerState
  onChange: (patch: Partial<PlannerState>) => void
}

export function WhichLeverTab({ state, onChange }: WhichLeverTabProps) {
  const results = whichLeverResults(state)
  const liftPoints = results.liftPoints * 100
  const isOnPace = results.unitGap <= 0

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <ArrowRight className="mt-0.5 shrink-0 text-blue-600" size={18} />
          <p>
            Same target, two ways to get there. <strong>Lever A</strong> buys volume at today's close rate.{' '}
            <strong>Lever B</strong> holds volume and lifts the close rate. Compare the cost.
          </p>
        </div>
      </section>

      <section className="panel no-print">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title mb-1">Cost Assumption</h2>
            <p className="text-sm text-slate-500">Average media cost for each additional lead.</p>
          </div>
          <label className="field-label w-48">
            <span>Cost per lead</span>
            <div className="flex items-center rounded-md border border-slate-200 bg-white px-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
              <span className="text-sm font-bold text-slate-500">$</span>
              <input
                className="h-10 min-w-0 flex-1 border-0 px-2 text-sm font-bold text-slate-900 outline-none"
                min="0"
                step="1"
                type="number"
                value={Math.round(state.costPerLead)}
                onChange={(event) => onChange({ costPerLead: Math.max(0, Math.round(Number(event.target.value))) })}
              />
            </div>
          </label>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <LeverCard
          badge="Lever A"
          badgeClass="bg-blue-600"
          icon={<BadgeDollarSign size={20} />}
          title="Buy more leads"
          description="Keep the close rate where it is and add volume."
          headline={isOnPace ? '0' : `+${wholeNumber.format(results.additionalLeads)}`}
          headlineLabel="additional leads needed"
          rows={[
            ['Est. media cost', currency.format(results.estimatedMediaCost)],
            ['Cost per extra unit', currency.format(results.costPerExtraUnit)],
            ['Close rate', `${wholePercent.format(results.currentCloseRate * 100)}% (unchanged)`],
          ]}
        />
        <LeverCard
          badge="Lever B"
          badgeClass="bg-emerald-600"
          icon={<TrendingUp size={20} />}
          title="Close better"
          description="Keep today's lead volume and convert more of it."
          headline={
            results.closeRateFeasible ? `${wholePercent.format(results.requiredCloseRate * 100)}%` : 'Not feasible'
          }
          headlineLabel={`close rate required (from ${wholePercent.format(results.currentCloseRate * 100)}%)`}
          rows={[
            [
              'Lift required',
              results.closeRateFeasible
                ? `+${wholePercent.format(liftPoints)} pts (+${wholePercent.format(results.relativeLift * 100)}% relative)`
                : 'Above 100%',
            ],
            ['Extra units vs today', `+${wholeNumber.format(results.unitGap)}`],
            ['Added gross (no ad spend)', currency.format(results.addedGross)],
            ['Added media spend', '$0'],
          ]}
        />
      </div>

      <section
        className={`rounded-lg border p-5 ${
          isOnPace
            ? 'border-emerald-200 bg-emerald-50'
            : results.recommendation === 'Close better'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-orange-200 bg-orange-50'
        }`}
      >
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 shrink-0" size={22} />
          <div>
            <div className="text-xs font-bold uppercase text-slate-600">Verdict - Which Lever?</div>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{results.recommendation}</h2>
            <p className="mt-1 text-sm text-slate-700">{results.rationale}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function LeverCard({
  badge,
  badgeClass,
  icon,
  title,
  description,
  headline,
  headlineLabel,
  rows,
}: {
  badge: string
  badgeClass: string
  icon: React.ReactNode
  title: string
  description: string
  headline: string
  headlineLabel: string
  rows: Array<[string, string]>
}) {
  return (
    <article className="panel">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-slate-500">{icon}</span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <div className="mt-7">
        <div className="text-4xl font-bold text-slate-950">{headline}</div>
        <div className="mt-1 text-sm font-semibold text-slate-500">{headlineLabel}</div>
      </div>
      <dl className="mt-6 divide-y divide-slate-200 border-t border-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-600">{label}</dt>
            <dd className="text-right font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
