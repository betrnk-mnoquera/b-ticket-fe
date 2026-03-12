const variants = {
  active: 'bg-success-bg text-success-fg',
  verified: 'bg-success-bg text-success-fg',
  published: 'bg-success-bg text-success-fg',
  running: 'bg-success-bg text-success-fg',
  pending: 'bg-info-bg text-info-fg',
  scheduled: 'bg-info-bg text-info-fg',
  for_review: 'bg-warning-bg text-warning-fg',
  expiring: 'bg-warning-bg text-warning-fg',
  paused: 'bg-warning-bg text-warning-fg',
  draft: 'bg-inactive-bg text-inactive-fg',
  inactive: 'bg-inactive-bg text-inactive-fg',
  archived: 'bg-inactive-bg text-inactive-fg',
  cancelled: 'bg-inactive-bg text-inactive-fg',
  expired: 'bg-error-bg text-error-fg',
  declined: 'bg-error-bg text-error-fg',
  ended: 'bg-error-bg text-error-fg',
  churned: 'bg-error-bg text-error-fg',
  trial: 'bg-info-bg text-info-fg',
  free_trial: 'bg-info-bg text-info-fg',
}

export default function StatusBadge({ status, className = '' }) {
  const key = status?.toLowerCase().replace(/\s+/g, '_')
  const style = variants[key] || 'bg-inactive-bg text-inactive-fg'
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}>
      {label}
    </span>
  )
}
