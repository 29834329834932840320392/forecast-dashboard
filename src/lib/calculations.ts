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

export function periodMultiplier(state: PlannerState) {
  return state.period === 'Quarter' ? 3 : 1
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
  return (state.newGoal + state.usedGoal) * periodMultiplier(state)
}

export function targetGross(state: PlannerState) {
  return totalTarget(state) * state.avgGross
}

export function totalLeads(channels: Channel[], multiplier = 1) {
  return channels.reduce((sum, channel) => sum + channel.leads, 0) * multiplier
}

export function projectedUnits(channels: Channel[], multiplier = 1) {
  return channels.reduce((sum, channel) => sum + channelUnits(channel), 0) * multiplier
}

export function blendedCloseRate(channels: Channel[]) {
  const leads = totalLeads(channels)
  return leads > 0 ? projectedUnits(channels) / leads : 0
}

export function goalSplit(state: PlannerState) {
  const target = state.newGoal + state.usedGoal
  if (target <= 0) {
    return { newShare: 0.5, usedShare: 0.5 }
  }

  return {
    newShare: state.newGoal / target,
    usedShare: state.usedGoal / target,
  }
}

export function channelRows(channels: Channel[], multiplier = 1) {
  return channels.map((channel) => ({
    ...channel,
    leads: channel.leads * multiplier,
    appts: channelAppts(channel) * multiplier,
    shown: channelShown(channel) * multiplier,
    leadToSale: channelLeadToSale(channel),
    units: channelUnits(channel) * multiplier,
  }))
}

export function backIntoItRows(state: PlannerState) {
  const multiplier = periodMultiplier(state)
  const leads = totalLeads(state.channels, multiplier)
  const target = totalTarget(state)
  const currentUnits = projectedUnits(state.channels, multiplier)
  const blended = blendedCloseRate(state.channels)
  const leadsNeededTotal = blended > 0 ? target / blended : 0
  const additionalTotal = Math.max(0, leadsNeededTotal - leads)
  const percentMoreVolume = leads > 0 ? additionalTotal / leads : 0

  const rows = state.channels.map((channel) => {
    const leadsToday = channel.leads * multiplier
    const share = leads > 0 ? leadsToday / leads : 1 / Math.max(state.channels.length, 1)
    const leadsNeeded = leadsNeededTotal * share
    const additional = leadsNeeded - leadsToday

    return {
      ...channel,
      leadsToday,
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

export function whichLeverResults(state: PlannerState) {
  const multiplier = periodMultiplier(state)
  const target = totalTarget(state)
  const currentLeads = totalLeads(state.channels, multiplier)
  const currentUnits = projectedUnits(state.channels, multiplier)
  const unitGap = Math.max(0, target - currentUnits)
  const currentCloseRate = currentLeads > 0 ? currentUnits / currentLeads : 0
  const additionalLeads = currentCloseRate > 0 ? unitGap / currentCloseRate : 0
  const estimatedMediaCost = additionalLeads * state.costPerLead
  const costPerExtraUnit = unitGap > 0 ? estimatedMediaCost / unitGap : 0
  const requiredCloseRate = currentLeads > 0 ? target / currentLeads : 0
  const liftPoints = Math.max(0, requiredCloseRate - currentCloseRate)
  const relativeLift = currentCloseRate > 0 ? liftPoints / currentCloseRate : 0
  const closeRateFeasible = requiredCloseRate <= 1
  const addedGross = unitGap * state.avgGross

  let recommendation: 'On pace' | 'Buy more leads' | 'Close better' = 'On pace'
  let rationale = 'Current volume and conversion assumptions already reach the target.'

  if (unitGap > 0 && !closeRateFeasible) {
    recommendation = 'Buy more leads'
    rationale = 'The close rate required at current volume is above 100%, so additional volume is necessary.'
  } else if (unitGap > 0) {
    recommendation = 'Close better'
    rationale = `Improving conversion reaches the same target without the estimated ${currency.format(estimatedMediaCost)} in added media spend.`
  }

  return {
    target,
    currentLeads,
    currentUnits,
    unitGap,
    currentCloseRate,
    additionalLeads,
    estimatedMediaCost,
    costPerExtraUnit,
    requiredCloseRate,
    liftPoints,
    relativeLift,
    closeRateFeasible,
    addedGross,
    recommendation,
    rationale,
  }
}

export function varianceResults(state: PlannerState) {
  const multiplier = periodMultiplier(state)
  const plannedLeads = totalLeads(state.channels, multiplier)
  const plannedUnits = Math.round(projectedUnits(state.channels, multiplier))
  const plannedCloseRate = plannedLeads > 0 ? plannedUnits / plannedLeads : 0
  const actualLeads = Math.round(state.actualLeads * multiplier)
  const actualUnits = Math.round(state.actualUnitsSold * multiplier)
  const actualCloseRate = actualLeads > 0 ? actualUnits / actualLeads : 0
  const leadDifference = actualLeads - plannedLeads
  const volumeImpact = leadDifference * plannedCloseRate
  const closeRateImpact = actualUnits - actualLeads * plannedCloseRate
  const totalVariance = actualUnits - plannedUnits

  return {
    plannedLeads,
    plannedUnits,
    plannedCloseRate,
    actualLeads,
    actualUnits,
    actualCloseRate,
    leadDifference,
    volumeImpact,
    closeRateImpact,
    totalVariance,
  }
}

export const sampleState: PlannerState = {
  newGoal: 250,
  usedGoal: 150,
  avgGross: 2414,
  costPerLead: 75,
  actualLeads: 2969,
  actualUnitsSold: 378.529668,
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
