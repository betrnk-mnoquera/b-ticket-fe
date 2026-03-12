import Icon from './Icon'

export default function StatsCard({ icon, label, value, change, highlight = false }) {
  const isPositive = change && !change.startsWith('-')

  return (
    <div className={`rounded-xl p-5 ${highlight ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'} shadow-[0_2px_4px_rgba(0,0,0,0.04)]`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${highlight ? 'bg-white/15' : 'bg-muted'}`}>
          <Icon name={icon} size={18} className={highlight ? 'text-white' : 'text-primary'} />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            highlight
              ? 'bg-white/15 text-white'
              : isPositive
                ? 'bg-success-bg text-success-fg'
                : 'bg-error-bg text-error-fg'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-foreground'}`}>{value}</div>
      <div className={`text-xs mt-1 ${highlight ? 'text-white/70' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  )
}
