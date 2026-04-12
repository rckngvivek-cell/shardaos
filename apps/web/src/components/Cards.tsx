import type { ReactNode } from 'react'

type KpiCardProps = {
  label: string
  value: string
  delta: string
  tone: 'success' | 'warning' | 'info'
}

const toneLabels: Record<KpiCardProps['tone'], string> = {
  success: 'kpi-card--success',
  warning: 'kpi-card--warning',
  info: 'kpi-card--info',
}

export function KpiCard({ label, value, delta, tone }: KpiCardProps) {
  return (
    <article className={`kpi-card ${toneLabels[tone]}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{delta}</span>
    </article>
  )
}

type PanelProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function Panel({ title, subtitle, actions, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
