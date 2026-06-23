import { backIntoItRows, oneDecimal, totalTarget, wholeNumber } from '../lib/calculations'
import type { PlannerState } from '../lib/types'
import { KpiCard } from './KpiCard'

export function BackIntoItTab({ state }: { state: PlannerState }) {
  const results = backIntoItRows(state)

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold text-slate-600">
        Holding your current ratios steady, here's the lead volume each channel needs to hit the target. The gap is the
        conversation: more leads, or a better close rate.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Leads Needed"
          value={wholeNumber.format(results.leadsNeededTotal)}
          sublabel={`${wholeNumber.format(totalTarget(state))} unit target`}
          accent="#2563EB"
        />
        <KpiCard
          label="Leads You're Pacing To Finish With"
          value={wholeNumber.format(results.currentLeads)}
          sublabel={`${oneDecimal.format(results.currentUnits)} projected units`}
          accent="#1B3A5C"
        />
        <KpiCard
          label="Additional Leads"
          value={results.additionalTotal > 0 ? wholeNumber.format(results.additionalTotal) : 'On pace'}
          sublabel={results.additionalTotal > 0 ? 'Needed to close the gap' : 'Current volume reaches the target'}
          accent={results.additionalTotal > 0 ? '#F97316' : '#16A34A'}
          tone={results.additionalTotal > 0 ? 'warning' : 'positive'}
        />
        <KpiCard
          label="% More Volume"
          value={results.additionalTotal > 0 ? `${oneDecimal.format(results.percentMoreVolume * 100)}%` : '0.0%'}
          sublabel="Compared with current entered leads"
          accent="#7C3AED"
        />
      </div>

      <section className="panel">
        <h2 className="section-title">Required Leads by Channel</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Leads Today</th>
                <th>Leads Needed</th>
                <th>Add'l</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row) => {
                const positive = row.additional > 0
                return (
                  <tr key={row.id}>
                    <td>
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.name}
                      </span>
                    </td>
                    <td>{wholeNumber.format(row.leadsToday)}</td>
                    <td>{wholeNumber.format(row.leadsNeeded)}</td>
                    <td>
                      <span className={positive ? 'pill pill-warn' : 'pill pill-good'}>
                        {positive ? wholeNumber.format(row.additional) : '0'}
                      </span>
                    </td>
                    <td>{row.status}</td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td>Total</td>
                <td>{wholeNumber.format(results.currentLeads)}</td>
                <td>{wholeNumber.format(results.leadsNeededTotal)}</td>
                <td>{wholeNumber.format(results.additionalTotal)}</td>
                <td>{results.additionalTotal > 0 ? 'Needs volume' : 'On pace'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
