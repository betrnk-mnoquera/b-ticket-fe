'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '../ui/Icon'
import { useAuth } from '@/lib/auth/AuthContext'

const merchantNavSections = [
  {
    label: 'Main',
    items: [
      { href: '/', icon: 'space_dashboard', label: 'Dashboard' },
      { href: '/merchant/stores', icon: 'storefront', label: 'My Stores' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/merchant/coupons', icon: 'local_offer', label: 'My Coupons' },
      { href: '/merchant/products', icon: 'inventory_2', label: 'Products' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/merchant/staff', icon: 'badge', label: 'My Staff' },
    ],
  },
]

export default function MerchantSidebar({ collapsed, onToggle }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = user?.initials ?? user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??'

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-[280px]'} min-h-screen glass-sidebar flex flex-col fixed top-0 left-0 bottom-0 z-10 transition-all duration-300 overflow-hidden`}>
      <div className={`${collapsed ? 'px-3' : 'px-8'} py-6 border-b border-sidebar-border flex justify-center items-center`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon name="storefront" size={20} className="text-white" />
          </div>
        ) : (
          <img src="/logo-dark.svg" alt="B-ticket" className="h-10" />
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'} py-4 space-y-5`}>
        {merchantNavSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-section px-3 mb-2">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-inactive hover:bg-white/5'
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`${collapsed ? 'px-2' : 'px-4'} py-4 border-t border-sidebar-border`}>
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-white" title={user?.name ?? 'User'}>
              {initials}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</div>
              <div className="text-xs text-sidebar-section truncate">{user?.email ?? ''}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-sidebar-inactive hover:text-white transition-colors"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-accent border-2 border-[#1A4D42] flex items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
      >
        <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={14} />
      </button>
    </aside>
  )
}
