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
  // If coupon has tiers, show tier summary
  const tiers = coupon.tiers
  if (tiers && Array.isArray(tiers) && tiers.length > 0) {
    return tiers.map(t => {
      const label = `${t.buyQuantity || '?'}+${t.freeQuantity || '?'} Free`
      return t.condition ? `${label} (${t.condition})` : label
    }).join(' / ')
  }
  if (coupon.discountType === 'percentage') return `${coupon.discountValue}%`
  if (coupon.discountType === 'fixed') return `₱${Number(coupon.discountValue || 0).toLocaleString()}`
  if (coupon.discountType === 'bogo') {
    const [buy, free] = (coupon.discountValue || '1:1').split(':')
    let productName = ''
    let getAt = ''
    try {
      const p = JSON.parse(coupon.products)
      productName = p.buy && p.buy !== 'Any Item' ? ` ${p.buy}` : ''
      getAt = p.getItemAt || ''
    } catch {}
    if (getAt && getAt !== 'Free') return `${buy}+${free}${productName} at ${getAt}`
    return `${buy}+${free} Free${productName}`
  }
  if (coupon.discountType === 'free_item') {
    const items = (coupon.discountValue || 'Item').split('\n').filter(Boolean)
    return `Free ${items.join(' + ')}`
  }
  if (coupon.discountType === 'bundle') {
    let comboCount = ''
    try {
      const p = JSON.parse(coupon.products)
      if (p.combos?.length) comboCount = ` (${p.combos.length} combo${p.combos.length > 1 ? 's' : ''})`
    } catch {}
    return `₱${Number(coupon.discountValue || 0).toLocaleString()} Bundle${comboCount}`
  }
  if (coupon.discountType === 'free_shipping') return 'Free Shipping'
  return coupon.discountValue ?? '—'
}

function formatProducts(coupon) {
  if (!coupon.products) return 'All Menu Items'
  try {
    const parsed = JSON.parse(coupon.products)
    // BOGO products
    if (parsed.buy && parsed.get) {
      if (parsed.buy === parsed.get && parsed.buy !== 'Any Item') return parsed.buy
      if (parsed.buy !== 'Any Item') return parsed.buy
      if (parsed.get !== 'Any Item') return parsed.get
    }
    // Bundle combos
    if (parsed.combos && Array.isArray(parsed.combos)) {
      return parsed.combos.join(', ')
    }
  } catch { /* not JSON, use as string */ }
  return coupon.products
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
    const restrictions = coupon.restrictions || {}
    // Parse BOGO quantities from discountValue (e.g., "4:2")
    const [bogoB, bogoG] = coupon.discountType === 'bogo' ? (coupon.discountValue || '1:1').split(':') : ['', '']
    // Parse BOGO products from products JSON
    let buyProduct = 'Any Item', buyProductName = '', getProduct = 'Same as Buy', getProductName = '', getItemAt = 'Free', getItemDiscount = ''
    if (coupon.discountType === 'bogo') {
      try {
        const p = JSON.parse(coupon.products)
        // Restore from rich data if available
        if (p.buyProduct) buyProduct = p.buyProduct
        if (p.buyProductName) buyProductName = p.buyProductName
        if (p.getProduct) getProduct = p.getProduct
        if (p.getProductName) getProductName = p.getProductName
        if (p.getItemAt) getItemAt = p.getItemAt
        if (p.getItemDiscount) getItemDiscount = p.getItemDiscount
        // Fallback to legacy format
        if (!p.buyProduct) {
          if (p.buy && p.buy !== 'Any Item') { buyProduct = 'Specific Product'; buyProductName = p.buy }
          if (p.get && p.get !== 'Any Item' && p.get !== p.buy) { getProduct = 'Specific Product'; getProductName = p.get }
          else if (p.get === p.buy && p.buy !== 'Any Item') { getProduct = 'Same as Buy' }
        }
      } catch { /* products might not be JSON for BOGO */ }
    }
    setFormData({
      name: coupon.name || '',
      code: coupon.code || '',
      status: coupon.status || '',
      storeName: coupon.storeName || '',
      storeId: coupon.storeId || '',
      description: coupon.description || '',
      termsAndConditions: coupon.termsAndConditions || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: ['bogo', 'free_item', 'bundle', 'free_shipping'].includes(coupon.discountType) ? '' : (coupon.discountValue || ''),
      maxDiscountCap: coupon.maxDiscountCap || '',
      minSpend: coupon.minSpend || '',
      usageLimitPerUser: coupon.usageLimitPerUser || '',
      totalRedemptionLimit: coupon.maxRedemptions || '',
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      products: coupon.products || '',
      customerEligibility: coupon.customerEligibility || '',
      // BOGO fields
      buyQuantity: bogoB || '',
      getQuantity: bogoG || '',
      buyProduct,
      buyProductName,
      getProduct,
      getProductName,
      getItemAt: getItemAt || 'Free',
      getItemDiscount: getItemDiscount || '',
      // Free item fields
      freeItemName: coupon.discountType === 'free_item' ? (coupon.discountValue || '') : '',
      freeItemMinSpend: coupon.discountType === 'free_item' ? (coupon.minSpend || '') : '',
      // Bundle fields
      bundleName: (() => { try { const p = JSON.parse(coupon.products); return p.name || '' } catch { return '' } })(),
      bundlePrice: coupon.discountType === 'bundle' ? coupon.discountValue : '',
      bundleItemCount: (() => { try { const p = JSON.parse(coupon.products); return p.itemCount || '' } catch { return '' } })(),
      bundleCombos: (() => { try { const p = JSON.parse(coupon.products); return p.combos || [] } catch { return [] } })(),
      // Tiers & restrictions
      tiers: coupon.tiers || [],
      restrictions: restrictions,
      diningMode: restrictions.diningMode || '',
      minCompanions: restrictions.minCompanions || '',
      specialValidity: restrictions.specialValidity || 'None',
      // Limited time redemption
      limitedTimeRedemption: restrictions.limitedTimeRedemption || false,
      redemptionWindowUnit: restrictions.redemptionWindowUnit || 'Days',
      redemptionWindowValue: restrictions.redemptionWindowValue || '',
      redemptionStartTime: restrictions.redemptionStartTime || '',
      redemptionEndTime: restrictions.redemptionEndTime || '',
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
    let ms = formData.minSpend ? Number(formData.minSpend) : null
    if (dt === 'bogo') {
      dv = `${formData.buyQuantity || 1}:${formData.getQuantity || 1}`
      const buyProd = formData.buyProduct === 'Specific Product' ? formData.buyProductName : 'Any Item'
      const getProd = formData.getProduct === 'Specific Product' ? formData.getProductName : formData.getProduct === 'Same as Buy' ? buyProd : 'Any Item'
      formData._bogoProducts = {
        buy: buyProd,
        get: getProd,
        buyProduct: formData.buyProduct || 'Any Item',
        getProduct: formData.getProduct || 'Any Item',
        buyProductName: formData.buyProductName || '',
        getProductName: formData.getProductName || '',
        getItemAt: formData.getItemAt || 'Free',
        getItemDiscount: formData.getItemDiscount || '',
      }
    } else if (dt === 'free_item') {
      dv = formData.freeItemName || 'Item'
      ms = formData.freeItemMinSpend ? Number(formData.freeItemMinSpend) : ms
    } else if (dt === 'bundle') {
      dv = String(formData.bundlePrice || '0')
      formData._bundleData = {
        name: formData.bundleName || '',
        price: formData.bundlePrice || '',
        itemCount: formData.bundleItemCount || '2',
        combos: (formData.bundleCombos || []).filter(Boolean),
      }
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
      products: dt === 'bogo' && formData._bogoProducts
        ? JSON.stringify(formData._bogoProducts)
        : dt === 'bundle' && formData._bundleData
          ? JSON.stringify(formData._bundleData)
        : formData.productScope === 'Specific Category'
          ? `All ${formData.productCategory || ''}`
          : formData.productScope === 'Specific Products'
            ? (formData.productList || '').split('\n').filter(Boolean).join(', ')
            : (formData.products || 'All Products & Services'),
      discountType: dt,
      discountValue: String(dv),
      minSpend: ms,
      maxDiscountCap: formData.maxDiscountCap ? Number(formData.maxDiscountCap) : null,
      maxRedemptions: formData.totalRedemptionLimit ? Number(formData.totalRedemptionLimit) : null,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
      termsAndConditions: formData.termsAndConditions || formData.description || '',
      tiers: (formData.tiers || []).length > 0 ? formData.tiers : null,
      restrictions: {
        ...(formData.restrictions || {}),
        diningMode: formData.diningMode || null,
        minCompanions: formData.minCompanions ? Number(formData.minCompanions) : null,
        specialValidity: formData.specialValidity || null,
        getItemAt: formData.getItemAt || null,
        getItemDiscount: formData.getItemDiscount || null,
        limitedTimeRedemption: formData.limitedTimeRedemption || false,
        redemptionWindowUnit: formData.redemptionWindowUnit || null,
        redemptionWindowValue: formData.redemptionWindowValue || null,
        redemptionStartTime: formData.redemptionStartTime || null,
        redemptionEndTime: formData.redemptionEndTime || null,
      },
      usageLimitPerUser: formData.usageLimitPerUser || null,
      customerEligibility: formData.customerEligibility || null,
    }
  }

  const validateForm = () => {
    if (!formData.name) { toast('Coupon name is required'); return false }
    if (!formData.code) { toast('Coupon code is required'); return false }
    if (!discountType) { toast('Discount type is required'); return false }
    if (discountType === 'free_item' && !formData.freeItemName) {
      toast('Free item name is required'); return false
    }
    if (discountType === 'free_item' && !formData.freeItemMinSpend) {
      toast('Minimum purchase amount is required for free item'); return false
    }
    if (discountType === 'bundle' && !formData.bundlePrice) {
      toast('Bundle price is required'); return false
    }
    if (!['bogo', 'free_shipping', 'free_item', 'bundle'].includes(discountType) && !formData.discountValue) {
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
                      ['Discount Type', c.discountType === 'percentage' ? 'Percentage' : c.discountType === 'fixed' ? 'Fixed Amount' : c.discountType === 'bogo' ? 'Buy X Get Y Free' : c.discountType === 'free_item' ? 'Free Item' : c.discountType === 'bundle' ? 'Bundle Deal' : c.discountType === 'free_shipping' ? 'Free Shipping' : c.discountType || '—'],
                      ['Discount Value', discount],
                      ['Min Spend', c.minSpend != null ? `₱${Number(c.minSpend).toLocaleString()}` : '—'],
                      ['Max Discount Cap', c.maxDiscountCap != null ? `₱${Number(c.maxDiscountCap).toLocaleString()}` : '—'],
                      ['Max Redemptions', c.maxRedemptions != null ? Number(c.maxRedemptions).toLocaleString() : '—'],
                      ['Products & Services', (() => {
                        if (!c.products) return 'All Menu Items'
                        try {
                          const p = JSON.parse(c.products)
                          // Bundle format
                          if (p.name) return p.name
                          // BOGO format
                          if (p.buy) return [p.buy, p.get].filter(v => v && v !== 'Any Item').join(' → ') || 'Any Item'
                        } catch {}
                        return c.products
                      })()],
                      ['Valid From', formatDate(c.validFrom)],
                      ['Valid Until', formatDate(c.validUntil)],
                      ['Status', c.status || '—'],
                    ].map(([l, v], i) => (
                      <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                    ))}
                  </div>
                  {/* Bundle Combos Display */}
                  {c.discountType === 'bundle' && (() => {
                    try {
                      const p = JSON.parse(c.products)
                      if (p.combos?.length > 0) return (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available Combinations</h4>
                          <div className="space-y-1.5">
                            {p.combos.map((combo, ci) => (
                              <div key={ci} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                                <Icon name="restaurant_menu" size={14} className="text-primary" />
                                <span className="text-sm">{combo}</span>
                              </div>
                            ))}
                          </div>
                          {p.itemCount && <p className="text-xs text-muted-foreground mt-2">{p.itemCount} items included per bundle</p>}
                        </div>
                      )
                    } catch {}
                    return null
                  })()}
                  {/* BOGO Details Display */}
                  {c.discountType === 'bogo' && (() => {
                    try {
                      const p = JSON.parse(c.products)
                      const [buy, get] = (c.discountValue || '1:1').split(':')
                      return (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">BOGO Details</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2">
                              <div className="text-[10px] font-semibold text-primary uppercase">Buy</div>
                              <div className="text-sm font-medium">{buy} × {p.buy || 'Any Item'}</div>
                            </div>
                            <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 px-3 py-2">
                              <div className="text-[10px] font-semibold text-orange-600 uppercase">Get {p.getItemAt && p.getItemAt !== 'Free' ? `at ${p.getItemAt}` : 'Free'}</div>
                              <div className="text-sm font-medium">{get} × {p.get || 'Any Item'}</div>
                            </div>
                          </div>
                        </div>
                      )
                    } catch {}
                    return null
                  })()}
                  {/* Tiers Display */}
                  {c.tiers && Array.isArray(c.tiers) && c.tiers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Discount Tiers</h4>
                      <div className="space-y-2">
                        {c.tiers.map((tier, ti) => (
                          <div key={ti} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Tier {ti + 1}</span>
                            <span className="text-sm font-medium">{tier.buyQuantity}+{tier.freeQuantity} Free</span>
                            {tier.condition && <span className="text-xs text-muted-foreground">— {tier.condition}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Restrictions Display */}
                  {c.restrictions && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conditions & Restrictions</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {c.restrictions.diningMode && c.restrictions.diningMode !== 'Any' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{c.restrictions.diningMode}</span>
                        )}
                        {c.restrictions.specialValidity && c.restrictions.specialValidity !== 'None' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{c.restrictions.specialValidity}</span>
                        )}
                        {c.restrictions.minCompanions && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Min {c.restrictions.minCompanions} companions</span>
                        )}
                        {c.restrictions.getItemAt && c.restrictions.getItemAt !== 'Free' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Get at {c.restrictions.getItemAt}</span>
                        )}
                        {c.restrictions.oneTimeUseOnly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">One-time use</span>}
                        {c.restrictions.notCombinableWithOtherPromos && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">No stacking</span>}
                        {c.restrictions.requirePresence && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Must be present</span>}
                        {c.restrictions.requireValidId && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Valid ID</span>}
                        {c.restrictions.singleReceiptOnly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Single receipt</span>}
                        {c.restrictions.priceIncludesVat && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Incl. VAT</span>}
                        {c.restrictions.subjectToServiceCharge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+Service charge</span>}
                      </div>
                    </div>
                  )}
                  {/* Terms & Conditions */}
                  {c.termsAndConditions && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Terms & Conditions</h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{c.termsAndConditions}</p>
                    </div>
                  )}
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
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatProducts(c)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold">{discount}</span>
                        {c.discountType === 'bogo' && (() => {
                          try {
                            const p = JSON.parse(c.products)
                            if (p.buy && p.buy !== 'Any Item') return <div className="text-[10px] text-muted-foreground mt-0.5">in {p.buy}</div>
                          } catch {}
                          return null
                        })()}
                        {c.discountType === 'free_item' && c.minSpend && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">min ₱{Number(c.minSpend).toLocaleString()}</div>
                        )}
                        {c.discountType === 'bundle' && (() => {
                          try {
                            const p = JSON.parse(c.products)
                            if (p.combos?.length) return <div className="text-[10px] text-muted-foreground mt-0.5">{p.combos.length} combo{p.combos.length > 1 ? 's' : ''} available</div>
                          } catch {}
                          return null
                        })()}
                      </div>
                    </td>
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
        <AccordionGroup defaultOpen="Coupon Details">
          {/* SECTION 1: Coupon Details */}
          <Accordion title="Coupon Details" icon="confirmation_number">
            <div className="space-y-3">
              <FormField label="Coupon Name" value={formData.name} onChange={(v) => {
                updateFormField('name', v)
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
                  <input type="text" className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring uppercase" placeholder="e.g. SUMMER20"
                    value={formData.code || ''} onChange={(e) => { updateFormField('code', e.target.value.toUpperCase()); updateFormField('_autoCode', false) }} />
                  <button type="button" onClick={() => { updateFormField('code', generateCouponCode()); updateFormField('_autoCode', true) }}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted flex items-center gap-1">
                    <Icon name="autorenew" size={14} /> Generate
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Store" select options={stores.map(s => s.storeName || s.name)} value={formData.storeName} onChange={(v) => {
                  const store = stores.find(s => (s.storeName || s.name) === v)
                  updateFormField('storeName', v)
                  if (store) updateFormField('storeId', store.id)
                }} />
                <FormField label="Status" select options={['Active', 'Scheduled', 'Paused']} value={formData.status} onChange={(v) => updateFormField('status', v)} />
              </div>
              <FormField label="Description" textarea value={formData.description} onChange={(v) => updateFormField('description', v)} />
            </div>
          </Accordion>
          {/* SECTION 2: Discount Configuration */}
          <Accordion title="Discount Configuration" subtitle="Type, value & discount cap" icon="local_offer">
            <div className="space-y-4">
              <FormField label="Discount Type" select options={['Percentage', 'Fixed Amount', 'Buy X Get Y', 'Free Item', 'Bundle Deal', 'Free Shipping']} value={
                discountType === 'percentage' ? 'Percentage' : discountType === 'fixed' ? 'Fixed Amount' : discountType === 'bogo' ? 'Buy X Get Y' : discountType === 'free_item' ? 'Free Item' : discountType === 'bundle' ? 'Bundle Deal' : discountType === 'free_shipping' ? 'Free Shipping' : ''
              } onChange={(v) => {
                const key = v === 'Percentage' ? 'percentage' : v === 'Fixed Amount' ? 'fixed' : v === 'Buy X Get Y' ? 'bogo' : v === 'Free Item' ? 'free_item' : v === 'Bundle Deal' ? 'bundle' : v === 'Free Shipping' ? 'free_shipping' : ''
                setDiscountType(key)
                updateFormField('discountType', key)
              }} />
              {discountType === 'bogo' ? (
                <>
                  <div className="rounded-lg border-l-4 border-primary bg-muted/30 p-4 space-y-3">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wide">Buy</div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Quantity" type="number" placeholder="e.g. 4" value={formData.buyQuantity} onChange={(v) => updateFormField('buyQuantity', v)} />
                      <FormField label="Product" select options={['Any Item', 'Specific Product']} value={formData.buyProduct || 'Any Item'} onChange={(v) => updateFormField('buyProduct', v)} />
                    </div>
                    {formData.buyProduct === 'Specific Product' && (
                      <FormField label="Product Name" placeholder="e.g. Shawarma, Korean Beef Brisket" value={formData.buyProductName} onChange={(v) => updateFormField('buyProductName', v)} />
                    )}
                  </div>
                  <div className="rounded-lg border-l-4 border-orange-400 bg-muted/30 p-4 space-y-3">
                    <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Get</div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Quantity" type="number" placeholder="e.g. 1" value={formData.getQuantity} onChange={(v) => updateFormField('getQuantity', v)} />
                      <FormField label="At" select options={['Free', '50% Off', '25% Off', 'Custom Discount']} value={formData.getItemAt || 'Free'} onChange={(v) => updateFormField('getItemAt', v)} />
                    </div>
                    {formData.getItemAt === 'Custom Discount' && (
                      <FormField label="Discount %" type="number" placeholder="e.g. 30" value={formData.getItemDiscount} onChange={(v) => updateFormField('getItemDiscount', v)} />
                    )}
                    <FormField label="Product" select options={['Same as Buy', 'Any Item', 'Specific Product']} value={formData.getProduct || 'Same as Buy'} onChange={(v) => updateFormField('getProduct', v)} />
                    {formData.getProduct === 'Specific Product' && (
                      <FormField label="Product Name" placeholder="e.g. Kimchi Fried Rice" value={formData.getProductName} onChange={(v) => updateFormField('getProductName', v)} />
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-center">
                    Buy <strong>{formData.buyQuantity || 1}</strong>{' '}
                    {formData.buyProduct === 'Specific Product' && formData.buyProductName
                      ? <strong>{formData.buyProductName}</strong>
                      : 'any item'
                    }, get <strong>{formData.getQuantity || 1}</strong>{' '}
                    {formData.getProduct === 'Specific Product' && formData.getProductName
                      ? <strong>{formData.getProductName}</strong>
                      : formData.getProduct === 'Same as Buy' && formData.buyProduct === 'Specific Product' && formData.buyProductName
                        ? <strong>{formData.buyProductName}</strong>
                        : 'item'
                    }{' '}
                    <strong>{!formData.getItemAt || formData.getItemAt === 'Free' ? 'FREE' : formData.getItemAt === 'Custom Discount' ? `${formData.getItemDiscount || '?'}% OFF` : formData.getItemAt.toUpperCase()}</strong>
                  </div>
                </>
              ) : discountType === 'free_item' ? (
                <>
                  <div className="rounded-lg border-l-4 border-emerald-500 bg-muted/30 p-4 space-y-3">
                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Free Item(s)</div>
                    <FormField label="Item Name(s)" textarea placeholder="e.g. Buffet Set Menu, Cheesecake&#10;(one item per line for multiple)" value={formData.freeItemName} onChange={(v) => updateFormField('freeItemName', v)} />
                    <FormField label="Minimum Purchase Amount" type="number" placeholder="e.g. 2000 (leave blank if none)" value={formData.freeItemMinSpend} onChange={(v) => updateFormField('freeItemMinSpend', v)} />
                  </div>
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-center">
                    Free <strong>{(formData.freeItemName || 'item').split('\n').filter(Boolean).join(' + ') || 'item'}</strong>
                    {formData.freeItemMinSpend ? <> with min. spend of <strong>₱{Number(formData.freeItemMinSpend).toLocaleString()}</strong></> : ''}
                  </div>
                </>
              ) : discountType === 'bundle' ? (
                <>
                  <div className="rounded-lg border-l-4 border-indigo-500 bg-muted/30 p-4 space-y-3">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Bundle Details</div>
                    <FormField label="Bundle Name" placeholder="e.g. Buy 1 Get 1 Brick Oven Pizza" value={formData.bundleName} onChange={(v) => updateFormField('bundleName', v)} />
                    <FormField label="Bundle Price" type="number" placeholder="e.g. 700" value={formData.bundlePrice} onChange={(v) => updateFormField('bundlePrice', v)} />
                    <FormField label="Items Included" type="number" placeholder="e.g. 2" value={formData.bundleItemCount} onChange={(v) => updateFormField('bundleItemCount', v)} />
                  </div>
                  <div className="rounded-lg border-l-4 border-violet-400 bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Available Combinations</div>
                    </div>
                    {(formData.bundleCombos || []).map((combo, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder={`Combo ${i + 1}: e.g. Margherita & Salame`}
                          value={combo}
                          onChange={(e) => {
                            const updated = [...(formData.bundleCombos || [])]
                            updated[i] = e.target.value
                            updateFormField('bundleCombos', updated)
                          }}
                        />
                        <button type="button" onClick={() => {
                          const updated = [...(formData.bundleCombos || [])]
                          updated.splice(i, 1)
                          updateFormField('bundleCombos', updated)
                        }} className="p-1.5 rounded hover:bg-muted"><Icon name="close" size={14} className="text-destructive" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      updateFormField('bundleCombos', [...(formData.bundleCombos || []), ''])
                    }} className="w-full py-2 text-xs font-medium rounded-lg border border-dashed border-border hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-colors">
                      <Icon name="add" size={14} /> Add Combination
                    </button>
                  </div>
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
                    <div className="text-center font-medium mb-2">
                      {formData.bundleName || 'Bundle Deal'} — <strong>₱{Number(formData.bundlePrice || 0).toLocaleString()}</strong>
                    </div>
                    {(formData.bundleCombos || []).filter(Boolean).length > 0 && (
                      <div className="text-xs text-muted-foreground text-center">
                        Available: {(formData.bundleCombos || []).filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                </>
              ) : discountType === 'free_shipping' ? (
                <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-center flex items-center justify-center gap-2">
                  <Icon name="local_shipping" size={18} className="text-primary" />
                  Free shipping will be applied at checkout
                </div>
              ) : (
                <>
                  <FormField label="Discount Value" type="number" placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'} value={formData.discountValue} onChange={(v) => updateFormField('discountValue', v)} />
                  <FormField label="Max Discount Cap" type="number" placeholder="e.g. 100" value={formData.maxDiscountCap} onChange={(v) => updateFormField('maxDiscountCap', v)} />
                </>
              )}
            </div>
          </Accordion>
          {/* SECTION 3: Conditions */}
          <Accordion title="Conditions" subtitle="Validity, limits & restrictions" icon="tune">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Valid From" type="date" value={formData.validFrom} onChange={(v) => updateFormField('validFrom', v)} />
                <FormField label="Valid Until" type="date" value={formData.validUntil} onChange={(v) => updateFormField('validUntil', v)} />
              </div>

              {/* Limited Time Redemption */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={!!formData.limitedTimeRedemption}
                  onChange={(e) => updateFormField('limitedTimeRedemption', e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-xs font-medium">Limited Time Redemption</span>
              </label>
              {formData.limitedTimeRedemption && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Redemption Window" select options={['Hours', 'Days', 'Weeks']} value={formData.redemptionWindowUnit || 'Days'} onChange={(v) => updateFormField('redemptionWindowUnit', v)} />
                    <FormField label="Duration" type="number" placeholder={formData.redemptionWindowUnit === 'Hours' ? 'e.g. 24' : formData.redemptionWindowUnit === 'Weeks' ? 'e.g. 1' : 'e.g. 3'} value={formData.redemptionWindowValue} onChange={(v) => updateFormField('redemptionWindowValue', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Redeemable From (Time)" type="time" value={formData.redemptionStartTime} onChange={(v) => updateFormField('redemptionStartTime', v)} />
                    <FormField label="Redeemable Until (Time)" type="time" value={formData.redemptionEndTime} onChange={(v) => updateFormField('redemptionEndTime', v)} />
                  </div>
                  <div className="bg-amber-100 rounded px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
                    <Icon name="timer" size={14} />
                    Redeemable for <strong>{formData.redemptionWindowValue || '?'} {(formData.redemptionWindowUnit || 'Days').toLowerCase()}</strong>
                    {formData.redemptionStartTime && formData.redemptionEndTime
                      ? <>, between <strong>{formData.redemptionStartTime}</strong> and <strong>{formData.redemptionEndTime}</strong></>
                      : ' only'}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Special Validity" select options={['None', 'Birthday (Exact Date)', 'Birth Month', 'Birthday or Birth Month', 'Anniversary']} value={formData.specialValidity} onChange={(v) => updateFormField('specialValidity', v)} />
                <FormField label="Dining Mode" select options={['Any', 'Dine-in Only', 'Takeout Only', 'Delivery Only']} value={formData.diningMode} onChange={(v) => updateFormField('diningMode', v)} />
              </div>
              {formData.specialValidity && formData.specialValidity !== 'None' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
                  <Icon name="cake" size={16} />
                  Valid on customer&apos;s <strong>{formData.specialValidity === 'Birthday (Exact Date)' ? 'exact birthday' : formData.specialValidity === 'Birth Month' ? 'birth month' : formData.specialValidity === 'Birthday or Birth Month' ? 'birthday or birth month' : 'anniversary'}</strong> — verified via valid ID
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Min. Spend" type="number" placeholder="e.g. 500" value={formData.minSpend} onChange={(v) => updateFormField('minSpend', v)} />
                <FormField label="Min. Companions (Full Paying)" type="number" placeholder="e.g. 4" value={formData.minCompanions} onChange={(v) => updateFormField('minCompanions', v)} />
              </div>
              {formData.minCompanions && Number(formData.minCompanions) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                  <Icon name="group" size={16} />
                  Must bring at least <strong>{formData.minCompanions}</strong> full paying adult{Number(formData.minCompanions) > 1 ? 's' : ''} to redeem
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Usage Limit Per User" select options={['1', '2', '3', '5', 'Unlimited']} value={formData.usageLimitPerUser} onChange={(v) => updateFormField('usageLimitPerUser', v)} />
                <FormField label="Total Redemption Limit" type="number" placeholder="e.g. 1000" value={formData.totalRedemptionLimit} onChange={(v) => updateFormField('totalRedemptionLimit', v)} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Requirements</label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { key: 'oneTimeUseOnly', label: 'One-time use only' },
                    { key: 'notCombinableWithOtherPromos', label: 'Cannot stack with other promos' },
                    { key: 'requirePresence', label: 'Celebrant must be present' },
                    { key: 'requireValidId', label: 'Valid ID required' },
                    { key: 'singleReceiptOnly', label: 'Single receipt only' },
                    { key: 'perTableOnly', label: 'One coupon per table' },
                    { key: 'priceIncludesVat', label: 'Price includes VAT' },
                    { key: 'subjectToServiceCharge', label: 'Subject to service charge' },
                  ].map(req => (
                    <label key={req.key} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={!!(formData.restrictions || {})[req.key]}
                        onChange={(e) => updateFormField('restrictions', { ...(formData.restrictions || {}), [req.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                      <span className="text-xs">{req.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tiers (optional) */}
              {(formData.tiers || []).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-medium text-muted-foreground block">Discount Tiers</label>
                  {(formData.tiers || []).map((tier, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-primary uppercase">Tier {i + 1}</span>
                        <button type="button" onClick={() => { const u = [...(formData.tiers || [])]; u.splice(i, 1); updateFormField('tiers', u) }} className="p-0.5 rounded hover:bg-muted"><Icon name="close" size={12} className="text-destructive" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField label="Buy Qty" type="number" placeholder="4" value={tier.buyQuantity} onChange={(v) => { const u = [...(formData.tiers || [])]; u[i] = { ...u[i], buyQuantity: v }; updateFormField('tiers', u) }} />
                        <FormField label="Free Qty" type="number" placeholder="1" value={tier.freeQuantity} onChange={(v) => { const u = [...(formData.tiers || [])]; u[i] = { ...u[i], freeQuantity: v }; updateFormField('tiers', u) }} />
                        <FormField label="Condition" placeholder="e.g. Birthday" value={tier.condition} onChange={(v) => { const u = [...(formData.tiers || [])]; u[i] = { ...u[i], condition: v }; updateFormField('tiers', u) }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => updateFormField('tiers', [...(formData.tiers || []), { buyQuantity: '', freeQuantity: '1', condition: '' }])}
                className="w-full py-2 text-xs font-medium rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center gap-1.5 transition-colors">
                <Icon name="add" size={14} /> Add Tier
              </button>
            </div>
          </Accordion>

          {/* SECTION 4: Terms & Conditions */}
          <Accordion title="Terms & Conditions" subtitle="Additional terms, notes & fine print" icon="description">
            <div className="space-y-3">
              <FormField label="Terms & Conditions" textarea placeholder={"e.g.\n• Must present valid ID with birthdate, name, and photo\n• Dine-in only, Buffet only\n• Not valid with other promos\n• One use per B-ticket magazine stub\n• Prices include 12% VAT and 10% service charge"} value={formData.termsAndConditions} onChange={(v) => updateFormField('termsAndConditions', v)} />
              <FormField label="Customer Eligibility" select options={['All Customers', 'New Customers', 'Returning Customers', 'Members Only', 'VIP Only']} value={formData.customerEligibility} onChange={(v) => updateFormField('customerEligibility', v)} />
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
