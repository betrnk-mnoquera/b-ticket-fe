'use client'

import { useState, useEffect, useCallback } from 'react'
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
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { campaignService } from '@/lib/api/services/campaignService'

const filters = ['All', 'Running', 'Scheduled', 'Paused', 'Ended']

export default function AdsManagement() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [selectedAnalytics, setSelectedAnalytics] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [placement, setPlacement] = useState('')
  const [showPrices, setShowPrices] = useState(false)
  const toast = useToast()

  // API state
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const perPage = 10

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, perPage }
      if (filter !== 'All') params.status = filter.toLowerCase()
      if (search) params.search = search
      const res = await campaignService.getCampaigns(params)
      setCampaigns(res.data || res)
      setTotalPages(res.meta?.totalPages || res.totalPages || 1)
      setTotalItems(res.meta?.total || res.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [filter, search, page])

  const fetchStats = useCallback(async () => {
    try {
      const res = await campaignService.getStats()
      const data = res.data || res
      setStats([
        { icon: 'campaign', label: 'Total Campaigns', value: String(data.totalCampaigns ?? '0') },
        { icon: 'play_circle', label: 'Running Now', value: String(data.runningNow ?? '0') },
        { icon: 'visibility', label: 'Total Impressions', value: String(data.totalImpressions ?? '0') },
        { icon: 'ads_click', label: 'Avg. Click Rate', value: data.avgClickRate ?? '0%' },
      ])
    } catch {
      setStats([
        { icon: 'campaign', label: 'Total Campaigns', value: '--' },
        { icon: 'play_circle', label: 'Running Now', value: '--' },
        { icon: 'visibility', label: 'Total Impressions', value: '--' },
        { icon: 'ads_click', label: 'Avg. Click Rate', value: '--' },
      ])
    }
  }, [])

  const fetchPlacements = useCallback(async () => {
    try {
      const res = await campaignService.getPlacements()
      setPlacements(res.data || res)
    } catch {
      setPlacements([])
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  useEffect(() => {
    fetchStats()
    fetchPlacements()
  }, [fetchStats, fetchPlacements])

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const handleFilterChange = (f) => {
    setFilter(f)
  }

  const handleSelectCampaign = async (campaign) => {
    setSelected(campaign)
    setDetailLoading(true)
    setSelectedDetail(null)
    setSelectedAnalytics(null)
    try {
      const [detail, analytics] = await Promise.all([
        campaignService.getCampaign(campaign.id),
        campaignService.getAnalytics(campaign.id),
      ])
      setSelectedDetail(detail.data || detail)
      setSelectedAnalytics(analytics.data || analytics)
    } catch {
      // Fall back to list data if detail fetch fails
      setSelectedDetail(campaign)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCreate = async (formData) => {
    setCreating(true)
    try {
      await campaignService.createCampaign(formData)
      setDrawerOpen(false)
      toast('Campaign created')
      fetchCampaigns()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await campaignService.deleteCampaign(id)
      setDeleteTarget(null)
      if (selected) setSelected(null)
      toast('Campaign deleted')
      fetchCampaigns()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to delete campaign')
    } finally {
      setDeleting(false)
    }
  }

  const detail = selectedDetail || selected
  const selectedPlacement = placements.find(p => p.value === placement)

  if (selected) {
    return (
      <div>
        <button onClick={() => { setSelected(null); setSelectedDetail(null); setSelectedAnalytics(null) }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Ads Management', href: '#' }, { label: detail?.name || 'Campaign' }]} title="" />

        {detailLoading ? (
          <CardSkeleton count={4} />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Icon name="campaign" size={24} className="text-primary" /></div>
                  <div>
                    <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{detail.name}</h2><StatusBadge status={detail.status} /></div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Icon name="store" size={14} /> {detail.merchantName || detail.merchant}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${(detail.placement?.type || detail.placement) === 'Web' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{detail.placement?.name || detail.placement?.type || detail.placement}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="edit" size={14} /> Edit</button>
                  <button onClick={() => setDeleteTarget(detail)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg flex items-center gap-1.5"><Icon name="delete" size={14} /> Delete</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatsCard icon="visibility" label="Impressions" value={(selectedAnalytics?.impressions ?? detail.impressions ?? 0).toLocaleString()} />
              <StatsCard icon="ads_click" label="Clicks" value={(selectedAnalytics?.clicks ?? detail.clicks ?? 0).toLocaleString()} />
              <StatsCard icon="percent" label="CTR" value={selectedAnalytics?.ctr ?? detail.ctr ?? '0%'} />
              <StatsCard icon="schedule" label="Days Remaining" value={String(selectedAnalytics?.daysRemaining ?? '—')} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Campaign Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      ['Campaign ID', detail.campaignId || detail.id],
                      ['Placement', detail.placement?.name || detail.placement?.type || detail.placement],
                      ['Audience', detail.audience || 'All Users'],
                      ['Start Date', detail.startDate],
                      ['End Date', detail.endDate],
                      ['Budget', detail.budget ? `$${Number(detail.budget).toLocaleString()}` : '—'],
                      ['Spent', detail.spent ? `$${Number(detail.spent).toLocaleString()}` : '—'],
                    ].map(([l, v], i) => (
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
                    <div><div className="text-sm font-medium">{detail.merchantName || detail.merchant}</div><div className="text-xs text-muted-foreground">Manila, PH</div></div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Activity</h3>
                  <div className="space-y-3">
                    {(selectedAnalytics?.activities || ['Campaign created', 'Campaign approved', 'First 1K impressions', 'Budget 70% spent']).map((item, i) => {
                      const label = typeof item === 'string' ? item : item.label
                      const time = typeof item === 'string' ? `${i + 1}d ago` : item.time
                      return (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div><div className="text-sm">{label}</div><div className="text-xs text-muted-foreground">{time}</div></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget?.id)}
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

      <div className="mb-6">
        {stats.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {stats.map((s, i) => <StatsCard key={i} {...s} />)}
          </div>
        ) : (
          <CardSkeleton count={4} />
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} searchValue={search} onSearchChange={setSearch} />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchCampaigns} />
        ) : loading ? (
          <LoadingSkeleton rows={perPage} columns={9} />
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="campaign" size={40} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No campaigns found</p>
          </div>
        ) : (
          <>
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
                {campaigns.map(c => {
                  const placementLabel = c.placement?.name || c.placement?.type || c.placement || '—'
                  const placementType = c.placement?.type || c.placement || ''
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="campaign" size={16} className="text-primary" /></div>
                          <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.campaignId || c.id}</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1"><Icon name="store" size={14} className="text-muted-foreground" /> {c.merchantName || c.merchant}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${placementType === 'Web' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{placementLabel}</span>
                      </td>
                      <td className="px-4 py-3">{(c.impressions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3">{(c.clicks ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium">{c.ctr ?? '0%'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{c.startDate} – {c.endDate}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleSelectCampaign(c)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                          <button onClick={() => setDrawerOpen(true)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={perPage} onPageChange={setPage} />
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
              <button
                onClick={() => handleCreate({ placement })}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
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
                    {placements.filter(p => p.type === 'Web').map(p => <option key={p.value} value={p.value}>{p.label} ({p.dimensions}) — ${p.rate}/day</option>)}
                  </optgroup>
                  <optgroup label="Mobile">
                    {placements.filter(p => p.type === 'Mobile').map(p => <option key={p.value} value={p.value}>{p.label} ({p.dimensions}) — ${p.rate}/day</option>)}
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
                {placements.map(p => (
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
        onConfirm={() => handleDelete(deleteTarget?.id)}
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
