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
import Accordion from '@/components/ui/Accordion'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import { coupons } from '@/data/mockData'

const stats = [
  { icon: 'confirmation_number', label: 'Total Coupons', value: '48' },
  { icon: 'check_circle', label: 'Active Coupons', value: '24' },
  { icon: 'redeem', label: 'Total Redemptions', value: '3,847' },
  { icon: 'trending_up', label: 'Avg. Redemption Rate', value: '34%' },
]

const filters = ['All', 'Active', 'Scheduled', 'For Review', 'Expired']

export default function Coupons() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [discountType, setDiscountType] = useState('percentage')
  const toast = useToast()

  const filtered = filter === 'All' ? coupons : coupons.filter(c => c.status === filter.toLowerCase().replace(/\s+/g, '_'))

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Coupons', href: '#' }, { label: selected.name }]} title="" />

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: selected.color + '20' }}>
                <Icon name={selected.icon} size={24} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="store" size={14} /> {selected.store}</span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{selected.code}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="edit" size={14} /> Edit
              </button>
              <button onClick={() => setDeleteTarget(selected)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg flex items-center gap-1.5">
                <Icon name="delete" size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard icon="redeem" label="Total Redemptions" value={selected.redemptions.toLocaleString()} />
          <StatsCard icon="person" label="Unique Users" value={Math.floor(selected.redemptions * 0.7).toLocaleString()} />
          <StatsCard icon="savings" label="Savings Given" value={`$${(selected.redemptions * 4.2).toFixed(0)}`} />
          <StatsCard icon="schedule" label="Days Remaining" value="45" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Coupon Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[['Code', selected.code], ['Discount Type', 'Percentage'], ['Discount Value', selected.discount], ['Min Spend', '$50'], ['Max Discount Cap', '$100'], ['Usage Limit', '3 per user'], ['Valid From', selected.validFrom], ['Valid Until', selected.validUntil]].map(([l, v], i) => (
                  <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Recent Redemptions</h3>
              <div className="space-y-3">
                {['Maria Santos', 'James Cruz', 'Anna Reyes', 'Carlos Garcia'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{name.split(' ').map(w => w[0]).join('')}</div>
                      <div>
                        <div className="text-sm font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">{i + 1}h ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">-${(12 + i * 3).toFixed(2)}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{['Basic', 'Premium', 'VIP', 'Basic'][i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">Get {selected.discount} off on {selected.products} at {selected.store}. Limited time offer!</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Store</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="store" size={18} className="text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">{selected.store}</div>
                  <div className="text-xs text-muted-foreground">Manila, PH</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Activity</h3>
              <div className="space-y-3">
                {['Coupon created', 'Status changed to active', '100 redemptions reached', 'Coupon edited'].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div><div className="text-sm">{item}</div><div className="text-xs text-muted-foreground">{i + 1}d ago</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
          onConfirm={() => { setDeleteTarget(null); setSelected(null); toast('Coupon deleted') }}
          entityName={deleteTarget?.name} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Coupons' }]}
        title="Coupons"
        subtitle="Create and manage discount coupons"
        actions={
          <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            <Icon name="add" size={16} /> Add Coupon
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Coupon</th>
              <th className="text-left px-4 py-3 font-medium">Store</th>
              <th className="text-left px-4 py-3 font-medium">Discount</th>
              <th className="text-left px-4 py-3 font-medium">Redemptions</th>
              <th className="text-left px-4 py-3 font-medium">Valid Period</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                      <Icon name={c.icon} size={16} style={{ color: c.color }} />
                    </div>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{c.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                    <Icon name="store" size={12} /> {c.store}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{c.discount}</td>
                <td className="px-4 py-3">{c.redemptions.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.validFrom} – {c.validUntil}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => setDrawerOpen(true)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={5} totalItems={48} itemsPerPage={10} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Coupon" width="w-[560px]"
        footer={<>
          <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={() => { setDrawerOpen(false); toast('Coupon created successfully') }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90">Create Coupon</button>
        </>}
      >
        <div className="space-y-4">
          <Accordion title="Coupon Info" defaultOpen>
            <div className="space-y-3">
              <FormField label="Coupon Name" />
              <FormField label="Code" placeholder="e.g. SUMMER20" />
              <FormField label="Status" select options={['Active', 'Scheduled', 'Paused']} />
              <FormField label="Store" select options={['Acme Downtown', 'TechHub Central', 'Fashion Avenue', 'Bella Spa']} />
              <FormField label="Description" textarea />
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Coupon Image</label><FileUpload compact accept="JPG, PNG up to 5MB" /></div>
            </div>
          </Accordion>
          <Accordion title="Discount Configuration">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['percentage', 'Percentage'], ['fixed', 'Fixed Amount'], ['bogo', 'Buy X Get Y']].map(([k, l]) => (
                    <button key={k} onClick={() => setDiscountType(k)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border ${discountType === k ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <FormField label="Discount Value" type="number" placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'} />
              <FormField label="Max Discount Cap" type="number" placeholder="e.g. 100" />
            </div>
          </Accordion>
          <Accordion title="Rules & Limits">
            <div className="space-y-3">
              <FormField label="Minimum Spend" type="number" placeholder="e.g. 500" />
              <FormField label="Usage Limit Per User" select options={['1', '2', '3', '5', 'Unlimited']} />
              <FormField label="Total Redemption Limit" type="number" placeholder="e.g. 1000" />
            </div>
          </Accordion>
          <Accordion title="Coupon Validity">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Valid From" type="date" />
                <FormField label="Valid Until" type="date" />
              </div>
              <FormField label="Valid Days" select options={['All Days', 'Weekdays', 'Weekends', 'Custom']} />
              <FormField label="Valid Hours" select options={['All Day', 'Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)']} />
            </div>
          </Accordion>
          <Accordion title="Coupon Availability">
            <div className="space-y-3">
              <FormField label="Products & Services" select options={['All Products', 'Signature Burger', 'Classic Pizza', 'Grilled Salmon']} />
              <FormField label="Plan" select options={['All Plans', 'Basic', 'Premium', 'VIP']} />
              <FormField label="Customer Eligibility" select options={['All Customers', 'New Customers', 'Returning Customers']} />
            </div>
          </Accordion>
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDeleteTarget(null); toast('Coupon deleted') }}
        entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], placeholder }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} placeholder={placeholder} /> :
       select ? <select className={cls}><option value="">Select...</option>{options.map(o => <option key={o}>{o}</option>)}</select> :
       <input type={type} className={cls} placeholder={placeholder} />}
    </div>
  )
}
