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
import { organizationService } from '@/lib/api/services/organizationService'
import { storeService } from '@/lib/api/services/storeService'

const AD_PLACEMENTS = [
  { value: 'top_banner_web', label: 'Top Banner', type: 'Web', dimensions: '1200 × 300 px', ratio: '4/1', icon: 'web', rate: 500 },
  { value: 'main_hero_web', label: 'Main Hero', type: 'Web', dimensions: '1350 × 634 px', ratio: '1350/634', icon: 'web', badge: 'Most Popular', rate: 1500 },
  { value: 'side_banner_web', label: 'Side Banner', type: 'Web', dimensions: '224 × 852 px', ratio: '224/852', icon: 'web', badge: 'Best Value', rate: 300 },
  { value: 'popup_banner_web', label: 'Pop-up Banner', type: 'Web', dimensions: '900 × 600 px', ratio: '3/2', icon: 'web', rate: 800 },
  { value: 'featured_banner_mobile', label: 'Featured Banner', type: 'Mobile', dimensions: '1200 × 300 px', ratio: '4/1', icon: 'phone_iphone', rate: 600 },
  { value: 'popup_banner_mobile', label: 'Pop-up Banner', type: 'Mobile', dimensions: '1200 × 300 px', ratio: '4/1', icon: 'phone_iphone', rate: 700 },
]

const filters = ['All', 'Running', 'Scheduled', 'Paused', 'Ended']

export default function AdsManagement() {
  const [viewMode, setViewMode] = useState('cards') // 'table' or 'cards'
  const [wizardStep, setWizardStep] = useState(0) // 0=goal, 1=placement, 2=details, 3=review
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showDescription, setShowDescription] = useState(false)
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
  const [organizations, setOrganizations] = useState([])
  const [stores, setStores] = useState([])
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [formData, setFormData] = useState({
    goal: '', name: '', description: '', placementType: '', placementId: null,
    organizationId: '', organizationName: '', storeId: '', storeName: '',
    targetUrl: '', audience: 'All Users',
    budget: '', billingPlan: 'daily', ratePerDay: '',
    paymentMethod: '', paymentReference: '',
    startDate: '', endDate: '',
  })

  const perPage = 10

  const updateFormField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))
  const getPlacementRate = (placementValue) => {
    const dbPlc = placements.find(p => p.value === placementValue)
    const staticPlc = AD_PLACEMENTS.find(p => p.value === placementValue)
    return Number(dbPlc?.rate || staticPlc?.rate || 0)
  }

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
        { icon: 'campaign', label: 'Total Campaigns', value: String(data.totalCampaigns ?? '0'), filterTo: 'All' },
        { icon: 'play_circle', label: 'Running Now', value: String(data.runningNow ?? '0'), filterTo: 'Running' },
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

  const fetchOrgsAndStores = useCallback(async () => {
    try {
      const [orgRes, storeRes] = await Promise.all([
        organizationService.getOrganizations({ perPage: 100 }),
        storeService.getStores({ perPage: 100 }),
      ])
      setOrganizations((orgRes.data?.data || orgRes.data || []))
      setStores((storeRes.data?.data || storeRes.data || []))
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    fetchPlacements()
    fetchOrgsAndStores()
  }, [fetchStats, fetchPlacements, fetchOrgsAndStores])

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

  const resetForm = () => {
    setFormData({
      goal: '', name: '', description: '', placementType: '', placementId: null,
      organizationId: '', organizationName: '', storeId: '', storeName: '',
      targetUrl: '', audience: 'All Users',
      budget: '', billingPlan: 'daily', ratePerDay: '',
      paymentMethod: '', paymentReference: '',
      startDate: '', endDate: '',
    })
    setEditingCampaign(null)
    setWizardStep(0)
    setShowDescription(false)
  }

  const openCreateDrawer = () => {
    resetForm()
    setWizardStep(0)
    setDrawerOpen(true)
  }

  const openEditDrawer = (campaign) => {
    const c = campaign
    setEditingCampaign(c)
    setWizardStep(1) // skip goal for edit
    // placementType in DB is "Web"/"Mobile" but form needs the value like "top_banner_web"
    const placementValue = c.placement?.value || AD_PLACEMENTS.find(p => p.value === c.placementType)?.value || ''
    setFormData({
      goal: c.goal || 'brand_awareness', name: c.name || '', description: c.description || '',
      placementType: placementValue,
      placementId: c.placementId || c.placement?.id || null,
      organizationId: c.organizationId || '', organizationName: c.organizationName || '',
      storeId: c.storeId || '', storeName: c.storeName || c.merchantName || '',
      targetUrl: c.targetUrl || '', audience: c.audience || 'All Users',
      budget: c.budget || '', billingPlan: c.billingPlan || 'daily',
      ratePerDay: c.ratePerDay || '',
      paymentMethod: c.paymentMethod || '', paymentReference: c.paymentReference || '',
      startDate: c.startDate ? String(c.startDate).split('T')[0] : '',
      endDate: c.endDate ? String(c.endDate).split('T')[0] : '',
    })
    setDrawerOpen(true)
  }

  const buildPayload = () => {
    const selectedPlc = AD_PLACEMENTS.find(p => p.value === formData.placementType)
    const dbPlacement = placements.find(p => p.value === formData.placementType)
    const rate = getPlacementRate(formData.placementType)
    return {
      name: formData.name,
      description: formData.description,
      placementId: dbPlacement?.id || formData.placementId,
      placementType: selectedPlc?.type || formData.placementType || '',
      organizationId: formData.organizationId || null,
      organizationName: formData.organizationName || '',
      storeId: formData.storeId || null,
      storeName: formData.storeName || '',
      merchantId: formData.storeId || formData.organizationId || null,
      merchantName: formData.storeName || formData.organizationName || '',
      targetUrl: formData.targetUrl || '',
      audience: formData.audience || 'All Users',
      budget: formData.budget ? Number(formData.budget) : null,
      billingPlan: formData.billingPlan || 'daily',
      ratePerDay: rate || formData.ratePerDay || null,
      paymentMethod: formData.paymentMethod || null,
      paymentReference: formData.paymentReference || null,
      startDate: formData.startDate,
      endDate: formData.endDate,
    }
  }

  const handleSave = async () => {
    if (!formData.name) { toast('Campaign name is required'); return }
    if (!formData.placementType) { toast('Please select a placement'); return }
    if (!formData.startDate || !formData.endDate) { toast('Start and end dates are required'); return }

    setCreating(true)
    try {
      const payload = buildPayload()
      if (editingCampaign) {
        await campaignService.updateCampaign(editingCampaign.id, payload)
        toast('Campaign updated')
      } else {
        await campaignService.createCampaign(payload)
        toast('Campaign created')
      }
      setDrawerOpen(false)
      resetForm()
      fetchCampaigns()
      fetchStats()
    } catch (err) {
      const msg = err.errors ? Object.values(err.errors).flat().join(', ') : err.message
      toast(msg || 'Failed to save campaign')
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
                  <button onClick={() => openEditDrawer(detail)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="edit" size={14} /> Edit</button>
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
          <button onClick={openCreateDrawer} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            <Icon name="add" size={16} /> Create Campaign
          </button>
        }
      />

      {/* Stats Cards — clickable to filter */}
      <div className="mb-6">
        {stats.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <button key={i} onClick={() => { if (s.filterTo) { setFilter(s.filterTo) } }}
                className="text-left hover:-translate-y-0.5 transition-transform duration-200">
                <StatsCard {...s} />
              </button>
            ))}
          </div>
        ) : (
          <CardSkeleton count={4} />
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex-1">
            <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} searchValue={search} onSearchChange={setSearch} />
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon name="grid_view" size={16} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon name="view_list" size={16} />
            </button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchCampaigns} />
        ) : loading ? (
          <LoadingSkeleton rows={perPage} columns={6} />
        ) : campaigns.length === 0 ? (
          /* Encouraging Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Icon name="campaign" size={36} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Ready to grow your business?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">Create your first ad campaign and reach thousands of customers across our web and mobile platforms.</p>
            <button onClick={openCreateDrawer} className="px-6 py-3 text-sm font-semibold rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
              <Icon name="add" size={18} /> Create Your First Campaign
            </button>
            <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-lg">
              {AD_PLACEMENTS.filter(p => ['main_hero_web', 'top_banner_web', 'featured_banner_mobile'].includes(p.value)).map(p => (
                <div key={p.value} className="rounded-xl border border-border p-3 text-center bg-muted/20">
                  <div className={`w-full rounded-lg bg-muted/50 flex items-center justify-center mb-2`} style={{ aspectRatio: p.value.includes('hero') ? '1350/634' : '4/1', maxHeight: 50 }}>
                    <div className="bg-muted-foreground/20 rounded" style={{ width: '60%', height: '50%' }} />
                  </div>
                  <div className="text-xs font-medium">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.type}</div>
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          /* Card Grid View */
          <div className="p-4 grid grid-cols-3 gap-4">
            {campaigns.map(c => {
              const placementType = c.placement?.type || c.placementType || ''
              const placementLabel = c.placement?.label || c.placement?.name || AD_PLACEMENTS.find(p => p.value === (c.placement?.value || c.placementType))?.label || '—'
              const budgetPct = c.budget > 0 ? Math.min(100, Math.round((c.spent || 0) / c.budget * 100)) : 0
              return (
                <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  {/* Color header strip */}
                  <div className={`h-2 ${placementType === 'Web' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-orange-400 to-orange-600'}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{c.name}</h4>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon name="store" size={12} /> {c.merchantName || c.storeName || 'Unknown'}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${placementType === 'Web' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{placementLabel}</span>
                    </div>
                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-1.5 rounded-lg bg-muted/30">
                        <div className="text-xs font-bold">{(c.impressions ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-muted/30">
                        <div className="text-xs font-bold">{(c.clicks ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">Clicks</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-muted/30">
                        <div className="text-xs font-bold">{c.ctr ?? '0'}%</div>
                        <div className="text-[10px] text-muted-foreground">CTR</div>
                      </div>
                    </div>
                    {/* Budget progress */}
                    {c.budget > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Budget</span>
                          <span>₱{Number(c.spent || 0).toLocaleString()} / ₱{Number(c.budget).toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${budgetPct}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                      <Icon name="date_range" size={12} /> {c.startDate} — {c.endDate}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleSelectCampaign(c)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-center">View</button>
                      <button onClick={() => openEditDrawer(c)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-center">Edit</button>
                      <button onClick={() => setDeleteTarget(c)} className="py-1.5 px-2 text-xs rounded-lg border border-border hover:bg-error-bg hover:text-error-fg hover:border-error-fg"><Icon name="delete" size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
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
                          <button onClick={() => openEditDrawer(c)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
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
        {campaigns.length > 0 && <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={perPage} onPageChange={setPage} />
        </div>}
      </div>

      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); resetForm() }}
        title={editingCampaign ? 'Edit Campaign' : ['What\'s your goal?', 'Choose placement', 'Campaign details', 'Review & launch'][wizardStep]}
        width="w-[640px]"
        footer={(() => {
          const rate = getPlacementRate(formData.placementType)
          const days = formData.startDate && formData.endDate ? Math.max(1, Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / 86400000)) : 0
          const total = rate && days ? days * rate : 0
          const isLastStep = wizardStep === 3
          const canNext = wizardStep === 0 ? !!formData.goal : wizardStep === 1 ? !!formData.placementType : wizardStep === 2 ? !!(formData.name && formData.startDate && formData.endDate) : true
          return (
            <div className="flex items-center justify-between w-full">
              {editingCampaign ? (
                <button onClick={() => { setDrawerOpen(false); resetForm() }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
              ) : wizardStep > 0 ? (
                <button onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted flex items-center gap-1">
                  <Icon name="arrow_back" size={14} /> Back
                </button>
              ) : (
                <button onClick={() => { setDrawerOpen(false); resetForm() }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
              )}
              <div className="flex items-center gap-2">
                {/* Step indicators - only show for create mode */}
                {!editingCampaign && <div className="flex items-center gap-1 mr-2">
                  {[0,1,2,3].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s === wizardStep ? 'bg-primary scale-125' : s < wizardStep ? 'bg-primary/50' : 'bg-border'}`} />
                  ))}
                </div>}
                {isLastStep || editingCampaign ? (
                  <button onClick={handleSave} disabled={creating || !canNext}
                    className="px-5 py-2.5 text-sm font-semibold rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20">
                    {creating ? 'Launching...' : editingCampaign ? 'Update Campaign' : total > 0 ? `Launch Campaign — ₱${total.toLocaleString()}` : 'Launch Campaign'}
                  </button>
                ) : (
                  <button onClick={() => setWizardStep(s => s + 1)} disabled={!canNext}
                    className="px-5 py-2.5 text-sm font-semibold rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                    Continue <Icon name="arrow_forward" size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })()}
      >
        <div>
          {/* ===== Edit Mode: Clickable Tab Navigation ===== */}
          {editingCampaign && (
            <div className="flex gap-1 mb-5 border-b border-border -mx-1">
              {[
                { step: 1, label: 'Placement', icon: 'dashboard' },
                { step: 2, label: 'Details', icon: 'edit_note' },
                { step: 3, label: 'Review', icon: 'preview' },
              ].map(tab => (
                <button key={tab.step} onClick={() => setWizardStep(tab.step)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${wizardStep === tab.step ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  <Icon name={tab.icon} size={16} /> {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ===== STEP 0: Goal/Objective ===== */}
          {wizardStep === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose a goal for your campaign. This helps us optimize your ad delivery.</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'brand_awareness', icon: 'visibility', label: 'Brand Awareness', desc: 'Get your brand seen by more people', color: 'from-blue-500 to-blue-600' },
                  { value: 'drive_traffic', icon: 'open_in_new', label: 'Drive Traffic', desc: 'Send customers to your store or website', color: 'from-emerald-500 to-emerald-600' },
                  { value: 'boost_sales', icon: 'shopping_cart', label: 'Boost Sales', desc: 'Promote products and increase conversions', color: 'from-orange-500 to-orange-600' },
                  { value: 'promote_event', icon: 'event', label: 'Promote Event', desc: 'Spread the word about your upcoming event', color: 'from-purple-500 to-purple-600' },
                ].map(g => {
                  const isSelected = formData.goal === g.value
                  return (
                    <button key={g.value} type="button" onClick={() => updateFormField('goal', g.value)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.01] ${isSelected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/30'}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center shrink-0`}>
                        <Icon name={g.icon} size={22} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{g.label}</div>
                        <div className="text-xs text-muted-foreground">{g.desc}</div>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Icon name="check" size={12} className="text-white" />
                        </div>
                      ) : <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== STEP 1: Placement ===== */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Pick where your ad will appear. Higher visibility placements get more reach.</p>
              <div className="grid grid-cols-2 gap-3">
                {AD_PLACEMENTS.map(p => {
                  const isSelected = formData.placementType === p.value
                  const dbPlc = placements.find(dp => dp.value === p.value)
                  return (
                    <button key={p.value} type="button" onClick={() => updateFormField('placementType', p.value)}
                      className={`relative rounded-xl border-2 p-3 text-left transition-all duration-200 hover:scale-[1.02] ${isSelected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/40 hover:bg-muted/20'}`}>
                      {p.badge && (
                        <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.badge === 'Most Popular' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{p.badge}</span>
                      )}
                      {isSelected ? (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Icon name="check" size={12} className="text-white" />
                        </div>
                      ) : <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-border" />}
                      <div className={`w-full rounded-lg ${isSelected ? 'bg-primary/15' : 'bg-muted/50'} flex items-center justify-center mb-2 overflow-hidden`}
                        style={{ aspectRatio: p.value.includes('side') ? '1/2' : p.value.includes('hero') ? '1350/634' : '4/1', maxHeight: 80 }}>
                        <div className={`${isSelected ? 'bg-primary/30' : 'bg-muted-foreground/15'} rounded`}
                          style={{ width: p.value.includes('side') ? '30%' : p.value.includes('popup') ? '40%' : '70%', height: p.value.includes('side') ? '30%' : p.value.includes('hero') ? '60%' : '50%' }} />
                      </div>
                      <div className="font-medium text-sm">{p.label} <span className="text-muted-foreground font-normal">({p.type})</span></div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{p.dimensions}</span>
                        <span className="text-xs font-bold text-primary">₱{Number(dbPlc?.rate || p.rate).toLocaleString()}/day</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {/* Preview mockup */}
              {formData.placementType && (() => {
                const plc = AD_PLACEMENTS.find(p => p.value === formData.placementType)
                return (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Icon name="preview" size={14} /> Ad Preview — {plc.label} ({plc.type})
                    </div>
                    <div className="bg-white rounded-lg border border-border overflow-hidden relative" style={{ maxHeight: 200 }}>
                      {/* Simplified page mockup */}
                      <div className="p-3 space-y-2">
                        {formData.placementType.includes('top_banner') && <>
                          <div className="w-full h-10 rounded bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary/60 border border-primary/20">YOUR AD HERE</div>
                          <div className="h-2 w-1/3 bg-muted rounded" /><div className="h-1.5 w-2/3 bg-muted/60 rounded" />
                        </>}
                        {formData.placementType.includes('hero') && <>
                          <div className="w-full h-24 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary/60 border border-primary/20">YOUR AD HERE</div>
                        </>}
                        {formData.placementType.includes('side') && <div className="flex gap-2">
                          <div className="flex-1 space-y-1.5"><div className="h-2 w-full bg-muted rounded" /><div className="h-1.5 w-3/4 bg-muted/60 rounded" /><div className="h-1.5 w-1/2 bg-muted/60 rounded" /></div>
                          <div className="w-14 h-28 rounded bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary/60 border border-primary/20 shrink-0">AD</div>
                        </div>}
                        {formData.placementType.includes('popup') && <>
                          <div className="h-1.5 w-2/3 bg-muted/40 rounded" /><div className="h-1 w-1/2 bg-muted/30 rounded" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-3/4 h-20 rounded-lg bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-[9px] font-bold text-primary/60 shadow-lg">YOUR AD HERE</div>
                          </div>
                        </>}
                        {formData.placementType.includes('featured') && <>
                          <div className="h-1.5 w-1/3 bg-muted rounded mb-1" />
                          <div className="w-full h-12 rounded bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary/60 border border-primary/20">YOUR AD HERE</div>
                          <div className="h-1 w-2/3 bg-muted/40 rounded" />
                        </>}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ===== STEP 2: Campaign Details ===== */}
          {wizardStep === 2 && (
            <div className="space-y-3">
              <FormField label="Campaign Name *" placeholder="e.g. Summer Sale Banner, Grand Opening Promo" value={formData.name} onChange={v => updateFormField('name', v)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Organization</label>
                  <select className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.organizationId} onChange={e => {
                      const org = organizations.find(o => String(o.id) === e.target.value)
                      updateFormField('organizationId', e.target.value)
                      updateFormField('organizationName', org?.name || '')
                      updateFormField('storeId', ''); updateFormField('storeName', '')
                    }}>
                    <option value="">Select organization...</option>
                    {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Store (optional)</label>
                  <select className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.storeId} onChange={e => {
                      const store = stores.find(s => String(s.id) === e.target.value)
                      updateFormField('storeId', e.target.value)
                      updateFormField('storeName', store?.storeName || store?.name || '')
                      if (store?.organizationId && !formData.organizationId) {
                        updateFormField('organizationId', store.organizationId)
                        updateFormField('organizationName', store.organization?.name || '')
                      }
                    }}>
                    <option value="">All stores / Org-wide</option>
                    {stores.filter(s => !formData.organizationId || String(s.organizationId) === String(formData.organizationId))
                      .map(s => <option key={s.id} value={s.id}>{s.storeName || s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Date *" type="date" value={formData.startDate} onChange={v => updateFormField('startDate', v)} />
                <FormField label="End Date *" type="date" value={formData.endDate} onChange={v => updateFormField('endDate', v)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Banner Image</label>
                {formData.placementType && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium mb-2">
                    <Icon name="photo_size_select_large" size={14} />
                    Recommended: {AD_PLACEMENTS.find(p => p.value === formData.placementType)?.dimensions}
                  </div>
                )}
                <FileUpload compact accept="JPG, PNG, WebP" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Target URL" placeholder="https://yoursite.com/promo" value={formData.targetUrl} onChange={v => updateFormField('targetUrl', v)} />
                <FormField label="Audience" select options={['All Users', 'New Users', 'Returning Users', 'Premium Members']} value={formData.audience} onChange={v => updateFormField('audience', v)} />
              </div>
              {showDescription ? (
                <FormField label="Description" textarea placeholder="Tell us about your campaign..." value={formData.description} onChange={v => updateFormField('description', v)} />
              ) : (
                <button onClick={() => setShowDescription(true)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                  <Icon name="add" size={14} /> Add description
                </button>
              )}
            </div>
          )}

          {/* ===== STEP 3: Review & Launch ===== */}
          {wizardStep === 3 && (() => {
            const plcInfo = AD_PLACEMENTS.find(p => p.value === formData.placementType)
            const rate = getPlacementRate(formData.placementType)
            const days = formData.startDate && formData.endDate ? Math.max(1, Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / 86400000)) : 0
            const total = rate && days ? days * rate : 0
            const goalLabel = { brand_awareness: 'Brand Awareness', drive_traffic: 'Drive Traffic', boost_sales: 'Boost Sales', promote_event: 'Promote Event' }[formData.goal] || formData.goal
            return (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Review your campaign before launching.</p>

                {/* Summary card */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-base">{formData.name || 'Untitled Campaign'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formData.storeName || formData.organizationName || 'No merchant'}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{goalLabel}</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                    <div><div className="text-[10px] text-muted-foreground uppercase tracking-wide">Placement</div><div className="font-medium mt-0.5">{plcInfo?.label} ({plcInfo?.type})</div></div>
                    <div><div className="text-[10px] text-muted-foreground uppercase tracking-wide">Dimensions</div><div className="font-medium mt-0.5">{plcInfo?.dimensions}</div></div>
                    <div><div className="text-[10px] text-muted-foreground uppercase tracking-wide">Duration</div><div className="font-medium mt-0.5">{formData.startDate} — {formData.endDate} ({days} days)</div></div>
                    <div><div className="text-[10px] text-muted-foreground uppercase tracking-wide">Audience</div><div className="font-medium mt-0.5">{formData.audience}</div></div>
                    {formData.targetUrl && <div className="col-span-2"><div className="text-[10px] text-muted-foreground uppercase tracking-wide">Target URL</div><div className="font-medium mt-0.5 text-primary truncate">{formData.targetUrl}</div></div>}
                  </div>
                </div>

                {/* Estimated performance */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5"><Icon name="insights" size={14} /> Estimated Performance</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">{(days * (formData.placementType?.includes('hero') ? 800 : 300)).toLocaleString()}</div>
                      <div className="text-[10px] text-blue-600">Est. Impressions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">{(days * (formData.placementType?.includes('hero') ? 40 : 15)).toLocaleString()}</div>
                      <div className="text-[10px] text-blue-600">Est. Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">{formData.placementType?.includes('hero') ? '5.0' : '4.2'}%</div>
                      <div className="text-[10px] text-blue-600">Est. CTR</div>
                    </div>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4">
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5"><Icon name="payments" size={14} /> Cost Breakdown</div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Rate</span><span>₱{rate ? rate.toLocaleString() : '—'}/day</span></div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Duration</span><span>{days} day{days > 1 ? 's' : ''}</span></div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-primary/15 mt-1">
                    <span>Total Investment</span>
                    <span className="text-primary">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Payment Method" select options={['Bank Transfer', 'GCash', 'Credit Card', 'Cash']} value={formData.paymentMethod} onChange={v => updateFormField('paymentMethod', v)} />
                  <FormField label="Reference #" placeholder="e.g. TXN-12345" value={formData.paymentReference} onChange={v => updateFormField('paymentReference', v)} />
                </div>
                <FileUpload compact accept="PDF, JPG, PNG" label="Upload compliance certificate (optional)" />
              </div>
            )
          })()}
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], placeholder, value, onChange, disabled }) {
  const cls = `w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring ${disabled ? 'bg-muted cursor-not-allowed' : ''}`
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} placeholder={placeholder} value={value || ''} onChange={e => onChange?.(e.target.value)} /> :
       select ? <select className={cls} disabled={disabled} value={value || ''} onChange={e => onChange?.(e.target.value)}><option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select> :
       <input type={type} className={cls} placeholder={placeholder} value={value || ''} onChange={e => onChange?.(e.target.value)} disabled={disabled} />}
    </div>
  )
}
