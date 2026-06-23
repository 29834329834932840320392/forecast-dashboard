import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import {
  blendedCloseRate,
  channelRows,
  currency,
  goalSplit,
  oneDecimal,
  projectedUnits,
  totalTarget,
  wholeNumber,
} from '../lib/calculations'
import type { PlannerState } from '../lib/types'
import { FunnelTable } from './FunnelTable'
import { KpiCard } from './KpiCard'

export function ForecastTab({ state }: { state: PlannerState }) {
  const units = projectedUnits(state.channels)
  const target = totalTarget(state)
  const gap = units - target
  const split = goalSplit(state)
  const rows = channelRows(state.channels)
  const periodLabel = state.period.toLowerCase()

  return (
    <div className="space-y-6">
      <p className="print-note text-sm font-semibold text-slate-500">Projecting a full {periodLabel}</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projected Units"
          value={oneDecimal.format(units)}
          sublabel={`${oneDecimal.format(units * split.newShare)} new · ${oneDecimal.format(units * split.usedShare)} used`}
          accent="#2563EB"
        />
        <KpiCard
          label="Gap to Goal"
          value={`${gap >= 0 ? '+' : ''}${oneDecimal.format(gap)}`}
          sublabel={gap >= 0 ? 'At or above target' : `${oneDecimal.format(Math.abs(gap))} units short`}
          accent={gap >= 0 ? '#16A34A' : '#F97316'}
          tone={gap >= 0 ? 'positive' : 'warning'}
        />
        <KpiCard
          label="Projected Gross"
          value={currency.format(units * state.avgGross)}
          sublabel={`${currency.format(state.avgGross)} average gross per unit`}
          accent="#16A34A"
        />
        <KpiCard
          label="Blended Close Rate"
          value={`${oneDecimal.format(blendedCloseRate(state.channels) * 100)}%`}
          sublabel={`${wholeNumber.format(state.channels.reduce((sum, channel) => sum + channel.leads, 0))} total leads`}
          accent="#1B3A5C"
        />
      </div>

      <section className="panel chart-panel">
        <h2 className="section-title">Projected Units by Channel</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 18, right: 20, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [oneDecimal.format(Number(value)), 'Units']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                {rows.map((row) => (
                  <Cell key={row.id} fill={row.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <FunnelTable channels={state.channels} />
    </div>
  )
}
