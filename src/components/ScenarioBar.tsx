import { Copy, Download, FilePlus2, FileUp, Printer, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import type { SavedScenario } from '../lib/types'

type ScenarioBarProps = {
  scenarios: SavedScenario[]
  selectedScenarioId: string
  isDirty: boolean
  onSelect: (id: string) => void
  onSave: () => void
  onSaveAs: () => void
  onDelete: () => void
  onShare: () => void
  onReset: () => void
  onImport: (file: File) => void
  onDownload: () => void
  onPrint: () => void
}

export function ScenarioBar({
  scenarios,
  selectedScenarioId,
  isDirty,
  onSelect,
  onSave,
  onSaveAs,
  onDelete,
  onShare,
  onReset,
  onImport,
  onDownload,
  onPrint,
}: ScenarioBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="scenario-bar no-print">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <select className="select-control" value={selectedScenarioId} onChange={(event) => onSelect(event.target.value)}>
          <option value="">Working draft (unsaved)</option>
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
        {isDirty ? <span className="status-badge">Not saved</span> : <span className="status-badge saved">Saved</span>}
      </div>
      <div className="action-row">
        <button className="soft-button" type="button" onClick={onSave}>
          <Save size={16} />
          Save
        </button>
        <button className="soft-button" type="button" onClick={onSaveAs}>
          <FilePlus2 size={16} />
          Save As
        </button>
        <button className="soft-button" type="button" disabled={!selectedScenarioId} onClick={onDelete}>
          <Trash2 size={16} />
          Delete
        </button>
        <button className="soft-button" type="button" onClick={onShare}>
          <Copy size={16} />
          Copy Share Link
        </button>
        <button className="soft-button" type="button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset to Sample
        </button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImport(file)
            event.target.value = ''
          }}
        />
        <button className="soft-button" type="button" onClick={() => fileInputRef.current?.click()}>
          <FileUp size={16} />
          Import Leads
        </button>
        <button className="soft-button" type="button" onClick={onDownload}>
          <Download size={16} />
          Download
        </button>
        <button className="primary-button" type="button" onClick={onPrint}>
          <Printer size={16} />
          Print / PDF
        </button>
      </div>
    </section>
  )
}
