import { channelRows, oneDecimal, wholeNumber } from '../lib/calculations'
import type { Channel } from '../lib/types'

export function FunnelTable({ channels }: { channels: Channel[] }) {
  const rows = channelRows(channels)
  const totals = rows.reduce(
    (sum, row) => ({
      leads: sum.leads + row.leads,
      appts: sum.appts + row.appts,
      shown: sum.shown + row.shown,
      units: sum.units + row.units,
    }),
    { leads: 0, appts: 0, shown: 0, units: 0 },
  )
  const totalLeadToSale = totals.leads > 0 ? totals.units / totals.leads : 0

  return (
    <section className="panel">
      <h2 className="section-title">Funnel by Channel</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Leads</th>
              <th>Appts Set</th>
              <th>Shown</th>
              <th>Lead to Sale</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.name}
                  </span>
                </td>
                <td>{wholeNumber.format(row.leads)}</td>
                <td>{oneDecimal.format(row.appts)}</td>
                <td>{oneDecimal.format(row.shown)}</td>
                <td>{oneDecimal.format(row.leadToSale * 100)}%</td>
                <td>{oneDecimal.format(row.units)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total</td>
              <td>{wholeNumber.format(totals.leads)}</td>
              <td>{oneDecimal.format(totals.appts)}</td>
              <td>{oneDecimal.format(totals.shown)}</td>
              <td>{oneDecimal.format(totalLeadToSale * 100)}%</td>
              <td>{oneDecimal.format(totals.units)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
