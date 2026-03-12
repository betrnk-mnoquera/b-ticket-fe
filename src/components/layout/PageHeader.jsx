import Link from 'next/link'
import Icon from '../ui/Icon'

export default function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <Icon name="chevron_right" size={14} />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-primary">{crumb.label}</Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
