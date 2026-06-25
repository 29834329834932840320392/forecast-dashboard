import { channelPalette } from './calculations'
import type { Channel } from './types'

type ColumnKey = 'leadType' | 'leads' | 'appointments' | 'shown' | 'sold'

type Aggregate = {
  name: string
  leads: number
  appointments: number
  shown: number
  sold: number
}

export type ImportResult = {
  channels: Channel[]
  importedRows: number
  sheetName: string
}

const headerAliases: Record<ColumnKey, string[]> = {
  leadType: ['leadtype', 'channel', 'sourcechannel', 'contacttype'],
  leads: ['goodleads', 'leads', 'totalleads', 'customers', 'showroomcustomers'],
  appointments: ['apptsscheduled', 'appointmentsscheduled', 'apptsset', 'appointmentsset', 'apptset'],
  shown: ['apptsshown', 'appointmentsshown', 'shown', 'shows'],
  sold: ['soldintimeframe', 'sold', 'sales', 'units', 'vehiclesold'],
}

function normalize(value: unknown) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function numberFromCell(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function findColumn(row: unknown[], key: ColumnKey) {
  const aliases = headerAliases[key]
  return row.findIndex((cell) => aliases.includes(normalize(cell)))
}

function findHeader(rows: unknown[][]) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 30); rowIndex += 1) {
    const row = rows[rowIndex]
    const columns = {
      leadType: findColumn(row, 'leadType'),
      leads: findColumn(row, 'leads'),
      appointments: findColumn(row, 'appointments'),
      shown: findColumn(row, 'shown'),
      sold: findColumn(row, 'sold'),
    }

    if (Object.values(columns).every((index) => index >= 0)) {
      return { rowIndex, columns }
    }
  }

  return null
}

function canonicalChannelName(value: unknown) {
  const normalized = normalize(value)
  if (!normalized) return ''
  if (normalized.includes('internet') || normalized.includes('bdc') || normalized.includes('web')) {
    return 'Internet / BDC'
  }
  if (normalized.includes('phone') || normalized.includes('call')) return 'Phone'
  if (normalized.includes('walkin') || normalized.includes('showroom')) return 'Walk-in'
  return ''
}

function channelId(name: string) {
  if (name === 'Internet / BDC') return 'internet-bdc'
  if (name === 'Phone') return 'phone'
  if (name === 'Walk-in') return 'walk-in'
  return `imported-${normalize(name) || crypto.randomUUID()}`
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return Math.round(Math.min(Math.max((numerator / denominator) * 100, 0), 100))
}

function rowsToChannels(rows: unknown[][], existingChannels: Channel[]) {
  const header = findHeader(rows)
  if (!header) return null

  const aggregates = new Map<string, Aggregate>()
  let importedRows = 0

  for (const row of rows.slice(header.rowIndex + 1)) {
    const name = canonicalChannelName(row[header.columns.leadType])
    if (!name) continue

    const leads = numberFromCell(row[header.columns.leads])
    const appointments = numberFromCell(row[header.columns.appointments])
    const shown = numberFromCell(row[header.columns.shown])
    const sold = numberFromCell(row[header.columns.sold])
    if (leads === 0 && appointments === 0 && shown === 0 && sold === 0) continue

    const current = aggregates.get(name) ?? { name, leads: 0, appointments: 0, shown: 0, sold: 0 }
    current.leads += leads
    current.appointments += appointments
    current.shown += shown
    current.sold += sold
    aggregates.set(name, current)
    importedRows += 1
  }

  if (aggregates.size === 0) return null

  const preferredOrder = ['Internet / BDC', 'Phone', 'Walk-in']
  const sorted = [...aggregates.values()].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.name)
    const bIndex = preferredOrder.indexOf(b.name)
    if (aIndex >= 0 || bIndex >= 0) return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex)
    return a.name.localeCompare(b.name)
  })

  const channels = sorted.map((aggregate, index) => {
    const id = channelId(aggregate.name)
    const existing = existingChannels.find(
      (channel) => channel.id === id || normalize(channel.name) === normalize(aggregate.name),
    )
    const isWalkIn = id === 'walk-in'

    return {
      id,
      name: aggregate.name,
      color: existing?.color ?? channelPalette[index % channelPalette.length],
      leads: Math.round(aggregate.leads),
      apptSetPct: isWalkIn ? 0 : percent(aggregate.appointments, aggregate.leads),
      showPct: isWalkIn ? 0 : percent(aggregate.shown, aggregate.appointments),
      closePct: percent(aggregate.sold, isWalkIn ? aggregate.leads : aggregate.shown),
    }
  })

  return { channels, importedRows }
}

export async function importLeadReport(file: File, existingChannels: Channel[]): Promise<ImportResult> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['csv', 'xls', 'xlsx'].includes(extension)) {
    throw new Error('Choose a CSV, XLS, or XLSX file.')
  }

  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
      blankrows: false,
    })
    const result = rowsToChannels(rows, existingChannels)
    if (result) return { ...result, sheetName }
  }

  throw new Error(
    'No compatible table found. Expected Lead Type, Good Leads, Appts Scheduled, Appts Shown, and Sold columns.',
  )
}
