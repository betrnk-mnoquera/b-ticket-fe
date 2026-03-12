'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '../ui/Icon'

const navSections = [
  {
    label: 'Main',
    items: [
      { href: '/', icon: 'dashboard', label: 'Dashboard' },
      { href: '/organizations', icon: 'corporate_fare', label: 'Organizations & Stores' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/coupons', icon: 'confirmation_number', label: 'Coupons' },
      { href: '/ads', icon: 'campaign', label: 'Ads Management' },
      { href: '/brochures', icon: 'menu_book', label: 'Brochures' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/subscribers', icon: 'group', label: 'Subscribers' },
      { href: '/line-of-business', icon: 'category', label: 'Line of Business' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/users', icon: 'person', label: 'Users' },
      { href: '/roles', icon: 'admin_panel_settings', label: 'Roles' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[280px] min-h-screen bg-sidebar-bg flex flex-col fixed top-0 left-0 bottom-0 z-10 border-r border-sidebar-border">
      <div className="px-8 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon name="confirmation_number" size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base">B-ticket</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
              <span className="text-sidebar-section text-[10px]">Admin Panel</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-section px-3 mb-2">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-inactive hover:bg-white/5'
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">John Doe</div>
            <div className="text-xs text-sidebar-section truncate">admin@bticket.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
