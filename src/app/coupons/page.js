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
import Accordion, { AccordionGroup } from '@/components/ui/Accordion'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { couponService } from '@/lib/api/services/couponService'
import { storeService } from '@/lib/api/services/storeService'
import { organizationService } from '@/lib/api/services/organizationService'
import { useAuth } from '@/lib/auth/AuthContext'

const perPage = 10
const filters = ['All', 'Active', 'Scheduled', 'For Review', 'Expired']

function formatDiscount(coupon) {
  if (coupon.discountType === 'percentage') return `${coupon.discountValue}%`
  if (coupon.discountType === 'fixed') return `₱${coupon.discountValue}`
  if (coupon.discountType === 'bogo') return 'BOGO'
  if (coupon.discountType === 'free_shipping') return 'Free Ship'
  return coupon.discountValue ?? '—'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapFilterToStatus(filter) {
  if (filter === 'All') return undefined
  if (filter === 'For Review') return 'for_review'
  return filter.toLowerCase()
}

export default function Coupons() {
  const { isSuperAdmin, organizationId } = useAuth()
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [discountType, setDiscountType] = useState('percentage')
  const toast = useToast()

  // API state
  const [coupons, setCoupons] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [stores, setStores] = useState([])

  // Detail view state
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [redemptions, setRedemptions] = useState([])

  // Form state
  const [formData, setFormData] = useState({})
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        per_page: perPage,
        ...(mapFilterToStatus(filter) && { status: mapFilterToStatus(filter) }),
        ...(searchQuery && { search: searchQuery }),
        ...(orgFilter && { organization_id: orgFilter }),
        ...(storeFilter && { store_id: storeFilter }),
      }
      const res = await couponService.getCoupons(params)
      setCoupons(res.data || res.items || res)
      setTotalPages(res.meta?.totalPages || res.lastPage || res.totalPages || 1)
      setTotalItems(res.meta?.total || res.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [page, filter, searchQuery, orgFilter, storeFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await couponService.getStats()
      const d = res.data || res
      setStats([
        { icon: 'confirmation_number', label: 'Total Coupons', value: (d.totalCoupons ?? 0).toLocaleString(), subtitle: `+${d.newThisMonth ?? 0} this month` },
        { icon: 'check_circle', label: 'Active Coupons', value: (d.activeCoupons ?? 0).toLocaleString(), subtitle: 'Currently live' },
        { icon: 'redeem', label: 'Total Redemptions', value: (d.totalRedemptions ?? 0).toLocaleString() },
        { icon: 'trending_up', label: 'Avg. Redemption Rate', value: `${d.avgRedemptionRate ?? 0}%` },
      ])
    } catch {
      setStats([
        { icon: 'confirmation_number', label: 'Total Coupons', value: '—' },
        { icon: 'check_circle', label: 'Active Coupons', value: '—' },
        { icon: 'redeem', label: 'Total Redemptions', value: '—' },
        { icon: 'trending_up', label: 'Avg. Redemption Rate', value: '—' },
      ])
    }
  }, [])

  const fetchStores = useCallback(async () => {
    try {
      const params = { perPage: 100 }
      // Org admins only see their own stores
      if (!isSuperAdmin && organizationId) {
        params.organization_id = organizationId
      }
      const res = await storeService.getStores(params)
      setStores(res.data || res.items || res)
    } catch {
      setStores([])
    }
  }, [isSuperAdmin, organizationId])

  const fetchOrganizations = useCallback(async () => {
    if (!isSuperAdmin) return
    try {
      const res = await organizationService.getOrganizations({ perPage: 100 })
      const result = res.data || res
      setOrganizations(result.data || result || [])
    } catch {
      setOrganizations([])
    }
  }, [isSuperAdmin])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  useEffect(() => {
    fetchStats()
    fetchStores()
    fetchOrganizations()
  }, [fetchStats, fetchStores, fetchOrganizations])

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setPage(1)
  }, [filter, searchQuery, orgFilter, storeFilter])

  const handleFilterChange = (f) => {
    setFilter(f)
  }

  const handleSearch = (q) => {
    setSearchQuery(q)
  }

  const handleSelectCoupon = async (coupon) => {
    setSelected(coupon)
    setDetailLoading(true)
    try {
      const [detail, redemptionRes] = await Promise.all([
        couponService.getCoupon(coupon.id),
        couponService.getRedemptions(coupon.id),
      ])
      setDetailData(detail.data || detail)
      setRedemptions(redemptionRes.data || redemptionRes.items || redemptionRes)
    } catch {
      // Fall back to list-level data
      setDetailData(coupon)
      setRedemptions([])
    } finally {
      setDetailLoading(false)
    }
  }

  const openEditDrawer = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      name: coupon.name || '',
      code: coupon.code || '',
      status: coupon.status || '',
      storeName: coupon.storeName || '',
      storeId: coupon.storeId || '',
      description: coupon.termsAndConditions || coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      maxDiscountCap: coupon.maxDiscountCap || '',
      minSpend: coupon.minSpend || '',
      usageLimitPerUser: coupon.usageLimitPerUser || '',
      totalRedemptionLimit: coupon.maxRedemptions || '',
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      validDays: coupon.validDays || '',
      validHours: coupon.validHours || '',
      products: coupon.products || '',
      plan: coupon.plan || '',
      customerEligibility: coupon.customerEligibility || '',
    })
    setDiscountType(coupon.discountType || 'percentage')
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setFormData({})
    setEditingCoupon(null)
  }

  const buildPayload = () => {
    const dt = discountType || formData.discountType || 'percentage'
    let dv = formData.discountValue || '0'
    if (dt === 'bogo') {
      dv = `${formData.buyQuantity || 1}:${formData.getQuantity || 1}`
    } else if (dt === 'free_shipping') {
      dv = '0'
    }

    return {
      name: formData.name || '',
      code: formData.code || '',
      storeId: formData.storeId || null,
      storeName: formData.storeName || '',
      organizationId: (() => {
        const store = stores.find(s => s.id === formData.storeId || (s.storeName || s.name) === formData.storeName)
        return store?.organizationId || store?.organization?.id || null
      })(),
      organizationName: (() => {
        const store = stores.find(s => s.id === formData.storeId || (s.storeName || s.name) === formData.storeName)
        return store?.organization?.name || ''
      })(),
      products: formData.products || '',
      discountType: dt,
      discountValue: String(dv),
      minSpend: formData.minSpend ? Number(formData.minSpend) : null,
      maxDiscountCap: formData.maxDiscountCap ? Number(formData.maxDiscountCap) : null,
      maxRedemptions: formData.totalRedemptionLimit ? Number(formData.totalRedemptionLimit) : null,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
      termsAndConditions: formData.description || '',
      usageLimitPerUser: formData.usageLimitPerUser || null,
      validDays: formData.validDays || null,
      validHours: formData.validHours || null,
      plan: formData.plan || null,
      customerEligibility: formData.customerEligibility || null,
    }
  }

  const validateForm = () => {
    if (!formData.name) { toast('Coupon name is required'); return false }
    if (!formData.code) { toast('Coupon code is required'); return false }
    if (!discountType) { toast('Discount type is required'); return false }
    if (discountType !== 'bogo' && discountType !== 'free_shipping' && !formData.discountValue) {
      toast('Discount value is required'); return false
    }
    if (!formData.validFrom) { toast('Valid from date is required'); return false }
    if (!formData.validUntil) { toast('Valid until date is required'); return false }
    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      toast('Valid until must be after valid from'); return false
    }
    return true
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    try {
      setCreating(true)
      await couponService.createCoupon(buildPayload())
      closeDrawer()
      toast('Coupon created successfully')
      fetchCoupons()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to create coupon')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCoupon) return
    if (!validateForm()) return
    try {
      setCreating(true)
      await couponService.updateCoupon(editingCoupon.id, buildPayload())
      closeDrawer()
      toast('Coupon updated successfully')
      fetchCoupons()
      fetchStats()
      if (selected?.id === editingCoupon.id) {
        handleSelectCoupon(editingCoupon)
      }
    } catch (err) {
      toast(err.message || 'Failed to update coupon')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await couponService.deleteCoupon(deleteTarget.id)
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) setSelected(null)
      toast('Coupon deleted')
      fetchCoupons()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to delete coupon')
    } finally {
      setDeleting(false)
    }
  }

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const prefix = (formData.name || '').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()
    const random = Array.from({ length: prefix ? 4 : 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return prefix ? `${prefix}${random}` : random
  }

  // Detail view
  if (selected) {
    const c = detailData || selected
    const discount = formatDiscount(c)
    const storeName = c.storeName || c.store || '—'

    return (
      <div>
        <button onClick={() => { setSelected(null); setDetailData(null); setRedemptions([]) }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Coupons', href: '#' }, { label: c.name }]} title="" />

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: (c.color || '#205C50') + '20' }}>
                <Icon name={c.icon || 'local_offer'} size={24} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{c.name}</h2>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="store" size={14} /> {storeName}</span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{c.code}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEditDrawer(c)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="edit" size={14} /> Edit
              </button>
              <button onClick={() => setDeleteTarget(c)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg flex items-center gap-1.5">
                <Icon name="delete" size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        {detailLoading ? (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatsCard icon="redeem" label="Total Redemptions" value={(c.redemptions ?? 0).toLocaleString()} />
              <StatsCard icon="person" label="Unique Users" value={(c.uniqueUsers ?? Math.floor((c.redemptions ?? 0) * 0.7)).toLocaleString()} />
              <StatsCard icon="savings" label="Savings Given" value={`₱${(c.savingsGiven ?? (c.redemptions ?? 0) * 4.2).toLocaleString()}`} />
              <StatsCard icon="schedule" label="Days Remaining" value={c.daysRemaining != null ? String(c.daysRemaining) : c.validUntil ? String(Math.max(0, Math.ceil((new Date(c.validUntil) - new Date()) / 86400000))) : '—'} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Coupon Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      ['Code', c.code],
                      ['Discount Type', c.discountType === 'percentage' ? 'Percentage' : c.discountType === 'fixed' ? 'Fixed Amount' : c.discountType === 'bogo' ? 'Buy X Get Y Free' : c.discountType || '—'],
                      ['Discount Value', discount],
                      ['Min Spend', c.minSpend != null ? `₱${Number(c.minSpend).toLocaleString()}` : '—'],
                      ['Max Discount Cap', c.maxDiscountCap != null ? `₱${Number(c.maxDiscountCap).toLocaleString()}` : '—'],
                      ['Max Redemptions', c.maxRedemptions != null ? Number(c.maxRedemptions).toLocaleString() : '—'],
                      ['Products & Services', c.products || 'All Menu Items'],
                      ['Valid From', formatDate(c.validFrom)],
                      ['Valid Until', formatDate(c.validUntil)],
                      ['Status', c.status || '—'],
                    ].map(([l, v], i) => (
                      <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Recent Redemptions</h3>
                  <div className="space-y-3">
                    {redemptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No redemptions yet.</p>
                    ) : (
                      redemptions.slice(0, 4).map((r, i) => (
                        <div key={r.id || i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {(r.userName || r.name || 'U').split(' ').map(w => w[0]).join('')}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{r.userName || r.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{r.redeemedAt || r.createdAt || ''}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-primary">-₱{(r.discountAmount ?? 0).toFixed(2)}</div>
                            {r.plan && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{r.plan}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{c.termsAndConditions || c.description || `Get ${discount} off at ${storeName}. Limited time offer!`}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Store</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="store" size={18} className="text-primary" /></div>
                    <div>
                      <div className="text-sm font-medium">{storeName}</div>
                      <div className="text-xs text-muted-foreground">{c.storeLocation || 'Manila, PH'}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Activity</h3>
                  <div className="space-y-3">
                    {(c.activity || [
                      { label: 'Coupon created', timeAgo: c.createdAt ? formatDate(c.createdAt) : '—' },
                      ...(c.updatedAt && c.updatedAt !== c.createdAt ? [{ label: 'Last updated', timeAgo: formatDate(c.updatedAt) }] : []),
                      ...(c.status === 'active' ? [{ label: 'Status changed to active', timeAgo: formatDate(c.updatedAt || c.createdAt) }] : []),
                    ]).map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div><div className="text-sm">{item.label || item}</div><div className="text-xs text-muted-foreground">{item.timeAgo || '—'}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
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
          <button onClick={() => { setFormData({}); setEditingCoupon(null); setDiscountType('percentage'); setDrawerOpen(true) }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            <Icon name="add" size={16} /> Add Coupon
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.length > 0
          ? stats.map((s, i) => <StatsCard key={i} {...s} />)
          : Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        }
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar
            filters={filters}
            activeFilter={filter}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            searchPlaceholder="Search coupons by name, code, or store..."
            dropdowns={isSuperAdmin ? [
              {
                label: 'Organization',
                options: [{ value: '', label: 'All Organizations' }, ...organizations.map(o => ({ value: String(o.id), label: o.name }))],
                value: orgFilter,
                onChange: (v) => { setOrgFilter(v); setStoreFilter('') },
              },
              {
                label: 'Store',
                options: [
                  { value: '', label: 'All Stores' },
                  ...(orgFilter
                    ? stores.filter(s => String(s.organizationId) === orgFilter || String(s.organization?.id) === orgFilter)
                    : stores
                  ).map(s => ({ value: String(s.id), label: s.storeName || s.name })),
                ],
                value: storeFilter,
                onChange: setStoreFilter,
              },
            ] : undefined}
          />
        </div>

        {loading ? (
          <LoadingSkeleton rows={10} columns={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCoupons} />
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="confirmation_number" size={40} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No coupons found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Coupon</th>
                <th className="text-left px-4 py-3 font-medium">Store</th>
                <th className="text-left px-4 py-3 font-medium">Products & Services</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Redemptions</th>
                <th className="text-left px-4 py-3 font-medium">Valid Period</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const storeName = c.storeName || c.store || '—'
                const discount = formatDiscount(c)
                return (
                  <tr key={c.id} onClick={() => handleSelectCoupon(c)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (c.color || '#205C50') + '20' }}>
                          <Icon name={c.icon || 'local_offer'} size={16} style={{ color: c.color || '#205C50' }} />
                        </div>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{c.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon name="store" size={12} /> {storeName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.products || 'All Menu Items'}</td>
                    <td className="px-4 py-3 font-semibold">{discount}</td>
                    <td className="px-4 py-3">{(c.redemptions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.validFrom)} - {formatDate(c.validUntil)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openEditDrawer(c) }} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c) }} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={perPage} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={closeDrawer} title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'} width="w-[560px]"
        footer={<>
          <button onClick={closeDrawer} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={editingCoupon ? handleUpdate : handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {creating ? (editingCoupon ? 'Updating...' : 'Creating...') : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
          </button>
        </>}
      >
        <AccordionGroup defaultOpen="Coupon Info">
          <Accordion title="Coupon Info">
            <div className="space-y-3">
              <FormField label="Coupon Name" value={formData.name} onChange={(v) => {
                updateFormField('name', v)
                // Auto-generate code if code is empty or was auto-generated
                if (!formData.code || formData._autoCode) {
                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                  const prefix = (v || '').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()
                  const random = Array.from({ length: prefix ? 4 : 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
                  updateFormField('code', prefix ? `${prefix}${random}` : random)
                  updateFormField('_autoCode', true)
                }
              }} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                    placeholder="e.g. SUMMER20"
                    value={formData.code || ''}
                    onChange={(e) => { updateFormField('code', e.target.value.toUpperCase()); updateFormField('_autoCode', false) }}
                  />
                  <button
                    type="button"
                    onClick={() => { updateFormField('code', generateCouponCode()); updateFormField('_autoCode', true) }}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted flex items-center gap-1"
                  >
                    <Icon name="autorenew" size={14} /> Generate
                  </button>
                </div>
              </div>
              <FormField label="Status" select options={['Active', 'Scheduled', 'Paused']} value={formData.status} onChange={(v) => updateFormField('status', v)} />
              <FormField label="Store" select options={stores.map(s => s.storeName || s.name)} value={formData.storeName} onChange={(v) => {
                const store = stores.find(s => (s.storeName || s.name) === v)
                updateFormField('storeName', v)
                if (store) updateFormField('storeId', store.id)
              }} />
              <FormField label="Description" textarea value={formData.description} onChange={(v) => updateFormField('description', v)} />
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Coupon Image</label><FileUpload compact accept="JPG, PNG up to 5MB" /></div>
            </div>
          </Accordion>
          <Accordion title="Discount Configuration" subtitle="Type, value & discount cap" icon="local_offer">
            <div className="space-y-4">
              <FormField label="Discount Type" select options={['Percentage', 'Fixed Amount', 'Buy X Get Y Free']} value={
                discountType === 'percentage' ? 'Percentage' : discountType === 'fixed' ? 'Fixed Amount' : discountType === 'bogo' ? 'Buy X Get Y Free' : ''
              } onChange={(v) => {
                const key = v === 'Percentage' ? 'percentage' : v === 'Fixed Amount' ? 'fixed' : v === 'Buy X Get Y Free' ? 'bogo' : ''
                setDiscountType(key)
                updateFormField('discountType', key)
              }} />
              {discountType === 'bogo' ? (
                <>
                  <div className="rounded-lg border-l-4 border-primary bg-muted/30 p-4 space-y-3">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wide">Buy</div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Quantity" type="number" placeholder="1" value={formData.buyQuantity} onChange={(v) => updateFormField('buyQuantity', v)} />
                      <FormField label="Product(s)" select options={formData.storeName ? ['Any Item', 'Specific Products'] : []} placeholder={!formData.storeName ? 'Select store first...' : undefined} value={formData.buyProduct} onChange={(v) => updateFormField('buyProduct', v)} />
                    </div>
                  </div>
                  <div className="rounded-lg border-l-4 border-orange-400 bg-muted/30 p-4 space-y-3">
                    <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Get Free</div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Quantity" type="number" placeholder="1" value={formData.getQuantity} onChange={(v) => updateFormField('getQuantity', v)} />
                      <FormField label="Product(s)" select options={formData.storeName ? ['Any Item', 'Specific Products'] : []} placeholder={!formData.storeName ? 'Select store first...' : undefined} value={formData.getProduct} onChange={(v) => updateFormField('getProduct', v)} />
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-center">
                    Buy <strong>{formData.buyQuantity || 1}</strong> {formData.buyProduct?.toLowerCase() === 'specific products' ? 'selected item' : 'any item'}, get <strong>{formData.getQuantity || 1}</strong> item <strong>FREE</strong>
                  </div>
                </>
              ) : (
                <>
                  <FormField label="Discount Value" type="number" placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'} value={formData.discountValue} onChange={(v) => updateFormField('discountValue', v)} />
                  <FormField label="Max Discount Cap" type="number" placeholder="e.g. 100" value={formData.maxDiscountCap} onChange={(v) => updateFormField('maxDiscountCap', v)} />
                </>
              )}
            </div>
          </Accordion>
          <Accordion title="Rules & Limits">
            <div className="space-y-3">
              <FormField label="Minimum Spend" type="number" placeholder="e.g. 500" value={formData.minSpend} onChange={(v) => updateFormField('minSpend', v)} />
              <FormField label="Usage Limit Per User" select options={['1', '2', '3', '5', 'Unlimited']} value={formData.usageLimitPerUser} onChange={(v) => updateFormField('usageLimitPerUser', v)} />
              <FormField label="Total Redemption Limit" type="number" placeholder="e.g. 1000" value={formData.totalRedemptionLimit} onChange={(v) => updateFormField('totalRedemptionLimit', v)} />
            </div>
          </Accordion>
          <Accordion title="Coupon Validity">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Valid From" type="date" value={formData.validFrom} onChange={(v) => updateFormField('validFrom', v)} />
                <FormField label="Valid Until" type="date" value={formData.validUntil} onChange={(v) => updateFormField('validUntil', v)} />
              </div>
              <FormField label="Valid Days" select options={['All Days', 'Weekdays', 'Weekends', 'Custom']} value={formData.validDays} onChange={(v) => updateFormField('validDays', v)} />
              <FormField label="Valid Hours" select options={['All Day', 'Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)']} value={formData.validHours} onChange={(v) => updateFormField('validHours', v)} />
            </div>
          </Accordion>
          <Accordion title="Coupon Availability">
            <div className="space-y-3">
              <FormField label="Products & Services" select options={['All Products', 'Signature Burger', 'Classic Pizza', 'Grilled Salmon']} value={formData.products} onChange={(v) => updateFormField('products', v)} />
              <FormField label="Plan" select options={['All Plans', 'Basic', 'Premium', 'VIP']} value={formData.plan} onChange={(v) => updateFormField('plan', v)} />
              <FormField label="Customer Eligibility" select options={['All Customers', 'New Customers', 'Returning Customers']} value={formData.customerEligibility} onChange={(v) => updateFormField('customerEligibility', v)} />
            </div>
          </Accordion>
        </AccordionGroup>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], placeholder, value, onChange }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  const handleChange = (e) => onChange?.(e.target.value)
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} placeholder={placeholder} value={value || ''} onChange={handleChange} /> :
       select ? <select className={cls} value={value || ''} onChange={handleChange}><option value="">Select...</option>{options.map(o => <option key={o}>{o}</option>)}</select> :
       <input type={type} className={cls} placeholder={placeholder} value={value || ''} onChange={handleChange} />}
    </div>
  )
}
