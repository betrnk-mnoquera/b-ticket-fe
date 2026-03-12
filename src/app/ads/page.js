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
import { adsCampaigns, placementOptions } from '@/data/mockData'

const stats = [
  { icon: 'campaign', label: 'Total Campaigns', value: '36' },
  { icon: 'play_circle', label: 'Running Now', value: '14' },
  { icon: 'visibility', label: 'Total Impressions', value: '207K' },
  { icon: 'ads_click', label: 'Avg. Click Rate', value: '4.2%' },
]

const filters = ['All', 'Running', 'Scheduled', 'Paused', 'Ended']

export default function AdsManagement() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [placement, setPlacement] = useState('')
  const [showPrices, setShowPrices] = useState(false)
  const toast = useToast()

  const filtered = filter === 'All' ? adsCampaigns : adsCampaigns.filter(c => c.status === filter.toLowerCase())
  const selectedPlacement = placementOptions.find(p => p.value === placement)

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Ads Management', href: '#' }, { label: selected.name }]} title="" />

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Icon name="campaign" size={24} className="text-primary" /></div>
              <div>
                <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{selected.name}</h2><StatusBadge status={selected.status} /></div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="store" size={14} /> {selected.merchant}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selected.placement === 'Web' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{selected.placement}</span>
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
          <StatsCard icon="visibility" label="Impressions" value={selected.impressions.toLocaleString()} />
          <StatsCard icon="ads_click" label="Clicks" value={selected.clicks.toLocaleString()} />
          <StatsCard icon="percent" label="CTR" value={selected.ctr} />
          <StatsCard icon="schedule" label="Days Remaining" value="32" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Campaign Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[['Campaign ID', selected.campaignId], ['Placement', selected.placement], ['Audience', 'All Users'], ['Start Date', selected.startDate], ['End Date', selected.endDate], ['Budget', '$2,400'], ['Spent', '$1,680']].map(([l, v], i) => (
                  <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Ad Preview</h3>
              <div className="aspect-video bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white/70 text-sm">Ad Preview</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Merchant</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="store" size={18} className="text-primary" /></div>
                <div><div className="text-sm font-medium">{selected.merchant}</div><div className="text-xs text-muted-foreground">Manila, PH</div></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Activity</h3>
              <div className="space-y-3">
                {['Campaign created', 'Campaign approved', 'First 1K impressions', 'Budget 70% spent'].map((item, i) => (
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
          onConfirm={() => { setDeleteTarget(null); setSelected(null); toast('Campaign deleted') }}
          entityName={deleteTarget?.name} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Ads Management' }]}
        title="Ads Management"
        subtitle="Manage advertising campaigns"
        actions={
          <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            <Icon name="add" size={16} /> Create Campaign
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Campaign</th>
                <th className="text-left px-4 py-3 font-medium">Merchant</th>
                <th className="text-left px-4 py-3 font-medium">Placement</th>
                <th className="text-left px-4 py-3 font-medium">Impressions</th>
                <th className="text-left px-4 py-3 font-medium">Clicks</th>
                <th className="text-left px-4 py-3 font-medium">CTR</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="campaign" size={16} className="text-primary" /></div>
                      <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.campaignId}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Icon name="store" size={14} className="text-muted-foreground" /> {c.merchant}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.placement === 'Web' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{c.placement}</span>
                  </td>
                  <td className="px-4 py-3">{c.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3">{c.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{c.ctr}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.startDate} – {c.endDate}</td>
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
        </div>
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={4} totalItems={36} itemsPerPage={8} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Create Campaign" width="w-[560px]"
        footer={
          <div className="flex items-center justify-between w-full">
            {selectedPlacement && (
              <div className="text-sm">
                <span className="text-muted-foreground">Estimated cost: </span>
                <span className="font-bold text-primary">${selectedPlacement.rate}/day</span>
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
              <button onClick={() => { setDrawerOpen(false); toast('Campaign created') }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90">Create</button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Accordion title="Store & Category" defaultOpen>
            <div className="space-y-3">
              <FormField label="Store" select options={['Acme Downtown', 'TechHub Central', 'Fashion Avenue']} />
              <FormField label="Category" value="Food & Beverage" disabled />
            </div>
          </Accordion>
          <Accordion title="Campaign Information">
            <div className="space-y-3">
              <FormField label="Campaign Name" />
              <FormField label="Goal" select options={['Brand Awareness', 'Drive Traffic', 'Boost Sales', 'Promote Event']} />
              <FormField label="Status" select options={['Running', 'Scheduled', 'Paused']} />
              <FormField label="Description" textarea />
            </div>
          </Accordion>
          <Accordion title="Ad Placement & Link">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Placement</label>
                <select className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={placement} onChange={e => setPlacement(e.target.value)}>
                  <option value="">Select placement...</option>
                  <optgroup label="Web">
                    {placementOptions.filter(p => p.type === 'Web').map(p => <option key={p.value} value={p.value}>{p.label} ({p.dimensions}) — ${p.rate}/day</option>)}
                  </optgroup>
                  <optgroup label="Mobile">
                    {placementOptions.filter(p => p.type === 'Mobile').map(p => <option key={p.value} value={p.value}>{p.label} ({p.dimensions}) — ${p.rate}/day</option>)}
                  </optgroup>
                </select>
              </div>
              {selectedPlacement && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-info-bg text-info-fg text-xs">
                  <Icon name="info" size={16} />
                  <span>{selectedPlacement.label}: {selectedPlacement.dimensions}, ${selectedPlacement.rate}/day ({selectedPlacement.type})</span>
                </div>
              )}
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Banner Image</label><FileUpload compact /></div>
              <FormField label="Link Destination" select options={['Store Page', 'Specific Coupon', 'External Website']} />
            </div>
          </Accordion>
          <Accordion title="Compliance Certificate">
            <FileUpload accept="PDF, JPG, PNG up to 10MB" label="Upload compliance documents" />
          </Accordion>
          <Accordion title="Exposure Period">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date" type="date" />
              <FormField label="End Date" type="date" />
            </div>
          </Accordion>

          <button onClick={() => setShowPrices(!showPrices)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            <Icon name={showPrices ? 'expand_less' : 'expand_more'} size={14} /> Compare placement prices
          </button>
          {showPrices && (
            <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
              <thead><tr className="bg-muted">
                <th className="text-left px-3 py-2 font-medium">Placement</th>
                <th className="text-left px-3 py-2 font-medium">Dimensions</th>
                <th className="text-left px-3 py-2 font-medium">Rate</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
              </tr></thead>
              <tbody>
                {placementOptions.map(p => (
                  <tr key={p.value} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{p.label}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.dimensions}</td>
                    <td className="px-3 py-2 font-semibold text-primary">${p.rate}/day</td>
                    <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${p.type === 'Web' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{p.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDeleteTarget(null); toast('Campaign deleted') }}
        entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], placeholder, value, disabled }) {
  const cls = `w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring ${disabled ? 'bg-muted cursor-not-allowed' : ''}`
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} placeholder={placeholder} /> :
       select ? <select className={cls} disabled={disabled}><option value="">Select...</option>{options.map(o => <option key={o}>{o}</option>)}</select> :
       <input type={type} className={cls} placeholder={placeholder} defaultValue={value} disabled={disabled} />}
    </div>
  )
}
