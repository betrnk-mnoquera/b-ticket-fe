'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Drawer from '@/components/ui/Drawer'
import { DeleteModal } from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import { organizations } from '@/data/mockData'

const stats = [
  { icon: 'corporate_fare', label: 'Total Organizations', value: '24' },
  { icon: 'store', label: 'Total Stores', value: '161' },
  { icon: 'storefront', label: 'Independent Stores', value: '5' },
  { icon: 'payments', label: 'Avg. Revenue/Store', value: 'PHP 3.2K' },
]

const filters = ['All', 'Pending', 'For Review', 'Verified', 'Declined']

const hours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Organizations() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selectedStore, setSelectedStore] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [drawerType, setDrawerType] = useState('store')
  const [activeTab, setActiveTab] = useState('overview')
  const toast = useToast()

  const filtered = filter === 'All' ? organizations : organizations.filter(o => o.status === filter.toLowerCase().replace(/\s+/g, '_'))

  if (selectedStore) {
    return (
      <div>
        <button onClick={() => setSelectedStore(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '#' }, { label: selectedStore.storeName }]}
          title=""
        />
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="store" size={28} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedStore.storeName}</h2>
                  <StatusBadge status={selectedStore.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="corporate_fare" size={14} /> {selectedStore.organization}</span>
                  <span className="flex items-center gap-1"><Icon name="tag" size={14} /> {selectedStore.storeId}</span>
                  <span className="flex items-center gap-1"><Icon name="location_on" size={14} /> Manila, PH</span>
                  <span className="flex items-center gap-1"><Icon name="category" size={14} /> {selectedStore.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/edit-store" className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="edit" size={14} /> Edit Store
              </Link>
              <button onClick={() => setDeleteTarget(selectedStore)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg hover:border-error-fg flex items-center gap-1.5">
                <Icon name="delete" size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard icon="photo_library" label="Photos" value="12" />
          <StatsCard icon="inventory_2" label="Products & Services" value="8" />
          <StatsCard icon="confirmation_number" label="Active Coupons" value="5" />
          <StatsCard icon="visibility" label="App Views" value="1.2K" />
        </div>

        <div className="flex gap-1 mb-4 border-b border-border">
          {['overview', 'photos', 'products'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab === 'products' ? 'Products & Services' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <DetailCard title="Business Details">
                <DetailGrid items={[
                  ['Store Name', selectedStore.storeName],
                  ['Category', selectedStore.category],
                  ['Status', <StatusBadge key="s" status={selectedStore.status} />],
                  ['Organization', selectedStore.organization],
                  ['Price Range', '$$'],
                  ['Payment', 'Cash, Card, GCash'],
                ]} />
              </DetailCard>
              <DetailCard title="Location & Contact">
                <DetailGrid items={[
                  ['Email', 'store@acme.com'],
                  ['Phone', '+63 912 345 6789'],
                  ['Address', '123 Main St, Manila'],
                  ['Country', 'Philippines'],
                ]} />
              </DetailCard>
            </div>
            <div className="space-y-4">
              <DetailCard title="Operating Hours">
                <div className="space-y-2">
                  {hours.map(day => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day}</span>
                      <span className="text-muted-foreground">{day === 'Sunday' ? 'Closed' : '9:00 AM – 9:00 PM'}</span>
                    </div>
                  ))}
                </div>
              </DetailCard>
              <DetailCard title="Recent Activity">
                <div className="space-y-3">
                  {['Store verified by admin', 'Photos updated', 'New coupon added', 'Business hours updated'].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="text-sm">{item}</div>
                        <div className="text-xs text-muted-foreground">{i + 1}d ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailCard>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-4 gap-4">
            <div className="aspect-square bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40">
              <Icon name="add_photo_alternate" size={32} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Upload Photo</span>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl relative group">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button className="p-1.5 rounded-lg bg-white/90"><Icon name="visibility" size={16} /></button>
                  <button className="p-1.5 rounded-lg bg-white/90"><Icon name="delete" size={16} className="text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40">
              <Icon name="add_circle" size={32} className="text-muted-foreground" />
              <span className="text-sm font-medium mt-2">Add Product</span>
            </div>
            {['Signature Burger', 'Classic Pizza', 'Grilled Salmon'].map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20" />
                <div className="p-4">
                  <h4 className="font-semibold text-sm">{p}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Delicious {p.toLowerCase()}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary">PHP 299</span>
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-muted"><Icon name="edit" size={14} className="text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-muted"><Icon name="delete" size={14} className="text-destructive" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { setDeleteTarget(null); setSelectedStore(null); toast('Store deleted successfully') }}
          entityName={deleteTarget?.storeName}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores' }]}
        title="Organizations & Stores"
        subtitle="Manage all organizations and their stores"
        actions={
          <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            <Icon name="add" size={16} /> Add New
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
              <th className="text-left px-4 py-3 font-medium">Store</th>
              <th className="text-left px-4 py-3 font-medium">Organization</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(org => (
              <tr key={org.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="store" size={16} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{org.storeName}</div>
                      <div className="text-xs text-muted-foreground">{org.storeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {org.organization === 'Independent' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Independent</span>
                  ) : org.organization}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{org.category}</td>
                <td className="px-4 py-3"><StatusBadge status={org.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedStore(org)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => setDeleteTarget(org)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={2} totalItems={organizations.length} itemsPerPage={8} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add New"
        footer={<>
          <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={() => { setDrawerOpen(false); toast('Created successfully') }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90">Save</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['organization', 'store'].map(t => (
                <button key={t} onClick={() => setDrawerType(t)}
                  className={`p-4 rounded-xl border text-center text-sm font-medium capitalize ${drawerType === t ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'}`}>
                  <Icon name={t === 'organization' ? 'corporate_fare' : 'store'} size={24} className="block mx-auto mb-1" />
                  {t}
                </button>
              ))}
            </div>
          </div>
          {drawerType === 'organization' ? (
            <>
              <FormField label="Organization Name" />
              <FormField label="Email" type="email" />
              <FormField label="Description" textarea />
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Logo</label><FileUpload compact /></div>
            </>
          ) : (
            <>
              <FormField label="Store Name" />
              <FormField label="Organization" select options={['Acme Corp', 'TechHub Inc', 'Style Group', 'Independent']} />
              <FormField label="Category" select options={['Food & Beverage', 'Retail & Fashion', 'Electronics', 'Health & Wellness']} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Email" type="email" />
                <FormField label="Phone" type="tel" />
              </div>
              <FormField label="Address" />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City" />
                <FormField label="Country" select options={['Philippines', 'Singapore', 'Malaysia']} />
              </div>
              <FormField label="Description" textarea />
            </>
          )}
        </div>
      </Drawer>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDeleteTarget(null); toast('Deleted successfully') }}
        entityName={deleteTarget?.storeName}
      />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [] }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} /> :
       select ? <select className={cls}><option value="">Select {label}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select> :
       <input type={type} className={cls} />}
    </div>
  )
}

function DetailCard({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}

function DetailGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {items.map(([label, value], i) => (
        <div key={i}>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-sm font-medium mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  )
}
