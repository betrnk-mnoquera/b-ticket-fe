'use client'

import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Drawer from '@/components/ui/Drawer'
import { DeleteModal } from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { subscribers } from '@/data/mockData'

const stats = [
  { icon: 'group', label: 'Total Subscribers', value: '2,847' },
  { icon: 'check_circle', label: 'Active', value: '2,340' },
  { icon: 'calendar_month', label: 'Monthly Plan', value: '1,560' },
  { icon: 'star', label: 'Yearly Plan', value: '780' },
]

const filters = ['All', 'Active', 'Expiring', 'Free Trial', 'Churned', 'Cancelled']
const planColors = { monthly: 'bg-blue-50 text-blue-700', yearly: 'bg-purple-50 text-purple-700', trial: 'bg-gray-100 text-gray-600' }

export default function Subscribers() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const toast = useToast()

  const filtered = filter === 'All' ? subscribers : subscribers.filter(s => {
    const key = filter.toLowerCase().replace(/\s+/g, '_')
    return s.status === key || s.plan === key
  })

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Subscribers', href: '#' }, { label: selected.name }]} title="" />

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{selected.avatar}</div>
              <div>
                <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{selected.name}</h2><StatusBadge status={selected.status} /></div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="email" size={14} /> {selected.email}</span>
                  <span className="flex items-center gap-1"><Icon name="phone" size={14} /> +63 912 345 6789</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="edit" size={14} /> Edit</button>
              <button onClick={() => setDeleteTarget(selected)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg flex items-center gap-1.5"><Icon name="delete" size={14} /> Delete</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard icon="credit_card" label="Current Plan" value={selected.plan.charAt(0).toUpperCase() + selected.plan.slice(1)} />
          <StatsCard icon="confirmation_number" label="Coupons Redeemed" value={String(selected.couponsUsed)} />
          <StatsCard icon="savings" label="Total Savings" value={`$${selected.couponsUsed * 6.5}`} />
          <StatsCard icon="trending_up" label="Engagement" value={`${selected.engagement}%`} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Subscription Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[['Subscriber ID', `SUB-${String(selected.id).padStart(3, '0')}`], ['Plan', <span key="p" className={`text-xs px-2 py-0.5 rounded-full ${planColors[selected.plan]}`}>{selected.plan}</span>], ['Subscribed Since', selected.subscribedDate], ['Next Renewal', '2025-08-15'], ['Payment Method', 'GCash'], ['Location', 'Manila, PH']].map(([l, v], i) => (
                  <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Recent Coupons Used</h3>
              <div className="space-y-3">
                {['Summer Sale 20%', 'Welcome Discount', 'VIP Exclusive'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">Acme Downtown • {i + 2}d ago</div></div>
                    <span className="text-sm font-semibold text-primary">-${(8 + i * 4).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 h-fit">
            <h3 className="text-sm font-semibold mb-3">Activity</h3>
            <div className="space-y-3">
              {['Subscription renewed', 'Used coupon SUM20', 'Profile updated', 'Joined B-Ticket'].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div><div className="text-sm">{item}</div><div className="text-xs text-muted-foreground">{i + 1}d ago</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setDeleteTarget(null); setSelected(null); toast('Subscriber removed') }} entityName={deleteTarget?.name} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Subscribers' }]}
        title="Subscribers"
        subtitle="View and manage app subscribers"
        actions={<button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Subscriber</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-muted-foreground">
            <th className="text-left px-4 py-3 font-medium">Subscriber</th>
            <th className="text-left px-4 py-3 font-medium">Plan</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Engagement</th>
            <th className="text-left px-4 py-3 font-medium">Coupons Used</th>
            <th className="text-left px-4 py-3 font-medium">Subscribed</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.avatar}</div><div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.email}</div></div></div></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColors[s.plan]}`}>{s.plan}</span></td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${s.engagement}%` }} /></div>
                    <span className="text-xs text-muted-foreground">{s.engagement}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">{s.couponsUsed}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.subscribedDate}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => setSelected(s)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                  <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={28} totalItems={2847} itemsPerPage={10} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Subscriber"
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={() => { setDrawerOpen(false); toast('Subscriber added') }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90">Save</button></>}
      >
        <div className="space-y-4">
          <FormField label="Full Name" />
          <FormField label="Email" type="email" />
          <FormField label="Phone" type="tel" />
          <FormField label="Plan" select options={['Monthly', 'Yearly', 'Trial']} />
          <FormField label="Status" select options={['Active', 'Expiring', 'Churned', 'Cancelled']} />
          <FormField label="Notes" textarea />
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setDeleteTarget(null); toast('Subscriber removed') }} entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [] }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} /> : select ? <select className={cls}><option value="">Select...</option>{options.map(o => <option key={o}>{o}</option>)}</select> : <input type={type} className={cls} />}
    </div>
  )
}
