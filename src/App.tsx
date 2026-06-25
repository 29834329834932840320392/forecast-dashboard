import { BarChart3, FileUp, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackIntoItTab } from './components/BackIntoItTab'
import { ChannelCard } from './components/ChannelCard'
import { ForecastTab } from './components/ForecastTab'
import { GoalBar } from './components/GoalBar'
import { ScenarioBar } from './components/ScenarioBar'
import { VarianceTab } from './components/VarianceTab'
import { WhichLeverTab } from './components/WhichLeverTab'
import { periodMultiplier, sampleState } from './lib/calculations'
import { importLeadReport } from './lib/importReport'
import { buildShareUrl, stateFromUrl } from './lib/shareLink'
import { deleteScenario, loadScenarios, saveScenario } from './lib/storage'
import type { Channel, PlannerState, SavedScenario } from './lib/types'

type Tab = 'forecast' | 'back-into-it' | 'which-lever' | 'variance'

const tabs: Array<{ id: Tab; label: string; disabled?: boolean }> = [
  { id: 'forecast', label: 'Forecast' },
  { id: 'back-into-it', label: 'Back Into It' },
  { id: 'which-lever', label: 'Which Lever?' },
  { id: 'variance', label: 'Variance / Why We Missed' },
]

function withSupportedPeriod(state: PlannerState): PlannerState {
  const channels = sampleState.channels.map(
    (defaultChannel) => state.channels.find((channel) => channel.id === defaultChannel.id) ?? defaultChannel,
  )
  return {
    ...state,
    costPerLead: Number.isFinite(state.costPerLead) ? state.costPerLead : sampleState.costPerLead,
    actualLeads: Number.isFinite(state.actualLeads) ? state.actualLeads : sampleState.actualLeads,
    actualUnitsSold: Number.isFinite(state.actualUnitsSold) ? state.actualUnitsSold : sampleState.actualUnitsSold,
    period: state.period === 'Quarter' ? 'Quarter' : 'Month',
    channels,
  }
}

function App() {
  const crmReportInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<PlannerState>(() => withSupportedPeriod(stateFromUrl() ?? sampleState))
  const [activeTab, setActiveTab] = useState<Tab>('forecast')
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => loadScenarios())
  const [selectedScenarioId, setSelectedScenarioId] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(state))
  const [toast, setToast] = useState('')

  const isDirty = useMemo(() => JSON.stringify(state) !== savedSnapshot, [savedSnapshot, state])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const updateState = (patch: Partial<PlannerState>) => {
    setState((current) => ({ ...current, ...patch }))
  }

  const updateChannel = (updated: Channel) => {
    setState((current) => ({
      ...current,
      channels: current.channels.map((channel) => (channel.id === updated.id ? updated : channel)),
    }))
  }

  const refreshScenarios = () => setScenarios(loadScenarios())

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id)
    if (!id) {
      setSavedSnapshot(JSON.stringify(state))
      return
    }

    const scenario = loadScenarios().find((item) => item.id === id)
    if (!scenario) return
    const normalizedState = withSupportedPeriod(scenario.state)
    setState(normalizedState)
    setSavedSnapshot(JSON.stringify(normalizedState))
  }

  const handleSave = () => {
    if (!selectedScenarioId) {
      handleSaveAs()
      return
    }

    const currentName = scenarios.find((scenario) => scenario.id === selectedScenarioId)?.name ?? 'Forecast Scenario'
    const saved = saveScenario(currentName, state, selectedScenarioId)
    refreshScenarios()
    setSelectedScenarioId(saved.id)
    setSavedSnapshot(JSON.stringify(state))
    setToast('Scenario saved')
  }

  const handleSaveAs = () => {
    const fallback = selectedScenarioId
      ? scenarios.find((scenario) => scenario.id === selectedScenarioId)?.name
      : 'Forecast Scenario'
    const name = window.prompt('Scenario name', fallback ?? 'Forecast Scenario')
    if (!name?.trim()) return

    const saved = saveScenario(name.trim(), state)
    refreshScenarios()
    setSelectedScenarioId(saved.id)
    setSavedSnapshot(JSON.stringify(state))
    setToast('Scenario saved')
  }

  const handleDelete = () => {
    if (!selectedScenarioId) return
    deleteScenario(selectedScenarioId)
    refreshScenarios()
    setSelectedScenarioId('')
    setSavedSnapshot(JSON.stringify(state))
    setToast('Scenario deleted')
  }

  const handleShare = async () => {
    const url = buildShareUrl(state)
    await navigator.clipboard.writeText(url)
    window.history.replaceState(null, '', url)
    setToast('Share link copied')
  }

  const handleReset = () => {
    setState(sampleState)
    setSelectedScenarioId('')
    setSavedSnapshot(JSON.stringify(sampleState))
    setToast('Sample data restored')
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `forecast-planner-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const result = await importLeadReport(file, state.channels)
      const multiplier = periodMultiplier(state)
      const channels = state.channels.map((currentChannel) => {
        const importedChannel = result.channels.find((channel) => channel.id === currentChannel.id)
        return importedChannel
          ? { ...importedChannel, color: currentChannel.color, leads: importedChannel.leads / multiplier }
          : currentChannel
      })
      setState((current) => ({ ...current, channels }))
      setSelectedScenarioId('')
      setToast(
        `Imported ${result.importedRows} rows from ${result.sheetName}: ${result.channels.length} channels updated`,
      )
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not import that file')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-slate-500">Ancira</div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-950">Forecast Planner</h1>
                <span className="beta-pill">BETA</span>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            Projecting
            <select
              className="select-control w-32"
              value={state.period}
              onChange={(event) => updateState({ period: event.target.value as PlannerState['period'] })}
            >
              <option>Month</option>
              <option>Quarter</option>
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <GoalBar state={state} onChange={updateState} />
        <ScenarioBar
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          isDirty={isDirty}
          onSelect={handleSelectScenario}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onDelete={handleDelete}
          onShare={handleShare}
          onReset={handleReset}
          onDownload={handleDownload}
          onPrint={() => window.print()}
        />

        <div className="no-print mt-6 flex flex-wrap gap-2 rounded-lg bg-slate-200 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="no-print space-y-4">
            <div className="rounded-lg border border-orange-200 bg-white p-4 shadow-sm">
              <input
                ref={crmReportInputRef}
                className="sr-only"
                type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) handleImport(file)
                  event.target.value = ''
                }}
              />
              <button
                className="primary-button w-full justify-center"
                type="button"
                onClick={() => crmReportInputRef.current?.click()}
              >
                <FileUp size={17} />
                Upload CRM Report
              </button>
              <p className="mt-2 text-center text-xs font-medium text-slate-500">
                VinSolutions Lead Source ROI report
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Lead Channels</h2>
              <p className="text-sm text-slate-500">Edit assumptions; results update instantly.</p>
            </div>
            {state.channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                volumeMultiplier={periodMultiplier(state)}
                onChange={updateChannel}
              />
            ))}
          </aside>

          <section className="min-w-0">
            <div className="print-title hidden">
              <BarChart3 size={24} />
              <h1>Ancira Forecast Planner</h1>
            </div>
            {activeTab === 'forecast' ? <ForecastTab state={state} /> : null}
            {activeTab === 'back-into-it' ? <BackIntoItTab state={state} /> : null}
            {activeTab === 'which-lever' ? <WhichLeverTab state={state} onChange={updateState} /> : null}
            {activeTab === 'variance' ? <VarianceTab state={state} onChange={updateState} /> : null}
          </section>
        </div>
      </main>

      {toast ? <div className="toast no-print">{toast}</div> : null}
    </div>
  )
}

export default App
