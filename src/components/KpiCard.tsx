type KpiCardProps = {
  label: string
  value: string
  sublabel?: string
  accent?: string
  tone?: 'neutral' | 'positive' | 'warning'
}

export function KpiCard({ label, value, sublabel, accent = '#1B3A5C', tone = 'neutral' }: KpiCardProps) {
  const toneClass =
    tone === 'positive' ? 'text-emerald-700' : tone === 'warning' ? 'text-orange-700' : 'text-slate-950'

  return (
    <article className="kpi-card" style={{ borderLeftColor: accent }}>
      <div className="kpi-label">{label}</div>
      <div className={`mt-2 text-3xl font-bold tracking-normal ${toneClass}`}>{value}</div>
      {sublabel ? <div className="mt-2 text-sm text-slate-500">{sublabel}</div> : null}
    </article>
  )
}
