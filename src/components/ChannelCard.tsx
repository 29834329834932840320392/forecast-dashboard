import { Trash2 } from 'lucide-react'
import { channelLeadToSale, isWalkInChannel, wholePercent } from '../lib/calculations'
import type { Channel } from '../lib/types'

type ChannelCardProps = {
  channel: Channel
  volumeMultiplier: number
  canRemove: boolean
  onChange: (channel: Channel) => void
  onRemove: () => void
}

export function ChannelCard({ channel, volumeMultiplier, canRemove, onChange, onRemove }: ChannelCardProps) {
  const update = (patch: Partial<Channel>) => onChange({ ...channel, ...patch })
  const isWalkIn = isWalkInChannel(channel)

  return (
    <article className="channel-card">
      <div className="flex items-start justify-between gap-3">
        <label className="min-w-0 flex-1">
          <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: channel.color }} />
            Channel
          </span>
          <input
            className="channel-name"
            value={channel.name}
            onChange={(event) => update({ name: event.target.value })}
          />
        </label>
        <button
          className="icon-button"
          type="button"
          title="Remove channel"
          aria-label={`Remove ${channel.name}`}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Input
          label={isWalkIn ? 'Showroom Customers' : 'Leads'}
          value={channel.leads * volumeMultiplier}
          onChange={(leads) => update({ leads: leads / volumeMultiplier })}
        />
        {!isWalkIn ? (
          <>
            <Input label="Appt Set %" value={channel.apptSetPct} onChange={(apptSetPct) => update({ apptSetPct })} />
            <Input label="Show %" value={channel.showPct} onChange={(showPct) => update({ showPct })} />
          </>
        ) : null}
        <Input label="Close %" value={channel.closePct} onChange={(closePct) => update({ closePct })} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm font-semibold text-slate-500">{isWalkIn ? 'Show to Sale' : 'Lead to Sale'}</span>
        <strong className="text-lg text-slate-950">{wholePercent.format(channelLeadToSale(channel) * 100)}%</strong>
      </div>
    </article>
  )
}

function Input({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input
        className="field-input"
        min="0"
        step="1"
        type="number"
        value={Math.round(value)}
        onChange={(event) => onChange(Math.round(Number(event.target.value)))}
      />
    </label>
  )
}
