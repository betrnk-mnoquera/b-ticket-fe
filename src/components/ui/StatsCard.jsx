import Icon from './Icon'

export default function StatsCard({ icon, label, value, change, highlight = false }) {
  const isPositive = change && !change.startsWith('-')

  return (
    <div className={`rounded-2xl p-5 transition-all duration-200 ${highlight ? 'glass-card-highlight' : 'glass-card'} hover:shadow-lg hover:shadow-black/[0.06]`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? 'bg-white/15' : 'bg-primary/8'}`}>
          <Icon name={icon} size={18} className={highlight ? 'text-white' : 'text-primary'} />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full glass-badge ${
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
