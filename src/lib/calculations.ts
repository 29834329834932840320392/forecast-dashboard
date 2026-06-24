import type { Channel, PlannerState } from './types'

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const wholeNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export const wholePercent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function pctToDecimal(value: number) {
  return clampNumber(value, 0, 100) / 100
}

export function clampNumber(value: number, min = 0, max = Number.POSITIVE_INFINITY) {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

export function isWalkInChannel(channel: Channel) {
  return channel.id === 'walk-in'
}

export function channelLeadToSale(channel: Channel) {
  if (isWalkInChannel(channel)) {
    return pctToDecimal(channel.closePct)
  }

  return pctToDecimal(channel.apptSetPct) * pctToDecimal(channel.showPct) * pctToDecimal(channel.closePct)
}

export function channelAppts(channel: Channel) {
  if (isWalkInChannel(channel)) {
    return 0
  }

  return channel.leads * pctToDecimal(channel.apptSetPct)
}

export function channelShown(channel: Channel) {
  if (isWalkInChannel(channel)) {
    return channel.leads
  }

  return channelAppts(channel) * pctToDecimal(channel.showPct)
}

export function channelUnits(channel: Channel) {
  return channel.leads * channelLeadToSale(channel)
}

export function totalTarget(state: PlannerState) {
  return state.newGoal + state.usedGoal
}

export function targetGross(state: PlannerState) {
  return totalTarget(state) * state.avgGross
}

export function totalLeads(channels: Channel[]) {
  return channels.reduce((sum, channel) => sum + channel.leads, 0)
}

export function projectedUnits(channels: Channel[]) {
  return channels.reduce((sum, channel) => sum + channelUnits(channel), 0)
}

export function blendedCloseRate(channels: Channel[]) {
  const leads = totalLeads(channels)
  return leads > 0 ? projectedUnits(channels) / leads : 0
}

export function goalSplit(state: PlannerState) {
  const target = totalTarget(state)
  if (target <= 0) {
    return { newShare: 0.5, usedShare: 0.5 }
  }

  return {
    newShare: state.newGoal / target,
    usedShare: state.usedGoal / target,
  }
}

export function channelRows(channels: Channel[]) {
  return channels.map((channel) => ({
    ...channel,
    appts: channelAppts(channel),
    shown: channelShown(channel),
    leadToSale: channelLeadToSale(channel),
    units: channelUnits(channel),
  }))
}

export function backIntoItRows(state: PlannerState) {
  const leads = totalLeads(state.channels)
  const target = totalTarget(state)
  const currentUnits = projectedUnits(state.channels)
  const blended = blendedCloseRate(state.channels)
  const leadsNeededTotal = blended > 0 ? target / blended : 0
  const additionalTotal = Math.max(0, leadsNeededTotal - leads)
  const percentMoreVolume = leads > 0 ? additionalTotal / leads : 0

  const rows = state.channels.map((channel) => {
    const share = leads > 0 ? channel.leads / leads : 1 / Math.max(state.channels.length, 1)
    const leadsNeeded = leadsNeededTotal * share
    const additional = leadsNeeded - channel.leads

    return {
      ...channel,
      leadsToday: channel.leads,
      leadsNeeded,
      additional,
      status: additional > 0 ? 'Needs volume' : 'On pace',
    }
  })

  return {
    leadsNeededTotal,
    currentLeads: leads,
    additionalTotal,
    percentMoreVolume,
    currentUnits,
    rows,
  }
}

export const sampleState: PlannerState = {
  newGoal: 250,
  usedGoal: 150,
  avgGross: 2414,
  period: 'Month',
  channels: [
    {
      id: 'internet-bdc',
      name: 'Internet / BDC',
      color: '#F97316',
      leads: 2262,
      apptSetPct: 27,
      showPct: 70,
      closePct: 47,
    },
    {
      id: 'phone',
      name: 'Phone',
      color: '#2563EB',
      leads: 432,
      apptSetPct: 47,
      showPct: 78,
      closePct: 34,
    },
    {
      id: 'walk-in',
      name: 'Walk-in',
      color: '#16A34A',
      leads: 275,
      apptSetPct: 13.5,
      showPct: 66.7,
      closePct: 45,
    },
  ],
}

export const channelPalette = ['#F97316', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#0891B2', '#CA8A04', '#BE123C']
