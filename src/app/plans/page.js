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
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { planService } from '@/lib/api/services/planService'

const ITEMS_PER_PAGE = 10
const filters = ['All', 'Active', 'Inactive']

const planTypeColors = {
  free: 'bg-gray-100 text-gray-600',
  standard: 'bg-blue-50 text-blue-700',
  family: 'bg-purple-50 text-purple-700',
}

const typeDropdownOptions = [
  { value: '', label: 'All Types' },
  { value: 'free', label: 'Free' },
  { value: 'standard', label: 'Standard' },
  { value: 'family', label: 'Family' },
]

export default function Plans() {
  const [filter, setFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [stats, setStats] = useState([
    { icon: 'loyalty', label: 'Total Plans', value: '-' },
    { icon: 'check_circle', label: 'Active Plans', value: '-' },
    { icon: 'group', label: 'Total Subscribers', value: '-' },
    { icon: 'payments', label: 'Monthly Revenue', value: '-' },
  ])
  const [statsLoading, setStatsLoading] = useState(true)
  const [distribution, setDistribution] = useState({})

  const [formData, setFormData] = useState({})

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, perPage: ITEMS_PER_PAGE }
      if (filter === 'Active') params.is_active = true
      if (filter === 'Inactive') params.is_active = false
      if (typeFilter) params.plan = typeFilter
      if (searchQuery) params.search = searchQuery

      const response = await planService.getPlans(params)
      const result = response.lastPage !== undefined ? response : (response.data || response)
      setPlans(result.data || [])
      setTotalPages(result.lastPage || 1)
      setTotalItems(result.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [page, filter, typeFilter, searchQuery])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await planService.getStats()
      const result = response.data || response
      setStats([
        { icon: 'loyalty', label: 'Total Plans', value: String(result.totalPlans ?? '-') },
        { icon: 'check_circle', label: 'Active Plans', value: String(result.activePlans ?? '-') },
        { icon: 'group', label: 'Total Subscribers', value: String(result.totalSubscribers ?? '-') },
        { icon: 'payments', label: 'Monthly Revenue', value: result.mrr != null ? `₱${Number(result.mrr).toLocaleString()}` : '-' },
      ])
      if (result.distribution) {
        const map = {}
        result.distribution.forEach(d => { map[d.id] = d.subscribers })
        setDistribution(map)
      }
    } catch {
      // Keep defaults
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleFilterChange = (f) => { setFilter(f); setPage(1) }
  const handleSearch = (q) => { setSearchQuery(q); setPage(1) }
  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const openCreateDrawer = () => {
    setEditingPlan(null)
    setFormData({ plan: '', billingCycle: '', price: '', maxUsers: '1', isActive: true, exclusiveCoupons: true })
    setDrawerOpen(true)
  }

  const openEditDrawer = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name || '',
      slug: plan.slug || '',
      plan: plan.plan || '',
      billingCycle: plan.billingCycle || '',
      price: plan.price ?? '',
      maxUsers: plan.maxUsers ?? 1,
      features: plan.features || {},
      isActive: plan.isActive ?? true,
      exclusiveCoupons: plan.features?.exclusiveCoupons ?? true,
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) { toast('Plan name is required'); return }
    if (!formData.plan) { toast('Plan type is required'); return }
    if (formData.plan !== 'free' && !formData.billingCycle) { toast('Billing cycle is required for paid plans'); return }
    if (formData.price === '' || formData.price === undefined) { toast('Price is required'); return }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        plan: formData.plan,
        billingCycle: formData.plan === 'free' ? null : formData.billingCycle,
        price: Number(formData.price),
        maxUsers: Number(formData.maxUsers) || 1,
        features: { exclusiveCoupons: formData.exclusiveCoupons ?? formData.plan !== 'free' },
        isActive: formData.isActive ?? true,
      }

      if (editingPlan) {
        await planService.updatePlan(editingPlan.id, payload)
        toast('Plan updated successfully')
      } else {
        await planService.createPlan(payload)
        toast('Plan created successfully')
      }
      setDrawerOpen(false)
      setFormData({})
      setEditingPlan(null)
      fetchPlans()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to save plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await planService.deletePlan(deleteTarget.id)
      toast('Plan deleted')
      setDeleteTarget(null)
      fetchPlans()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to delete plan')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (plan) => {
    try {
      await planService.toggleActive(plan.id)
      toast(plan.isActive ? 'Plan deactivated' : 'Plan activated')
      fetchPlans()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to toggle plan')
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Plans' }]}
        title="Subscription Plans"
        subtitle="Manage pricing tiers and subscription offerings"
        actions={
          <button onClick={openCreateDrawer} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            <Icon name="add" size={16} /> Add Plan
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsLoading ? <CardSkeleton count={4} /> : stats.map((s, i) => (
          <div key={i} className="hover:-translate-y-0.5 transition-transform duration-200">
            <StatsCard {...s} />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar
            filters={filters}
            activeFilter={filter}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            searchPlaceholder="Search by plan name or slug..."
            dropdowns={[{
              value: typeFilter,
              onChange: (v) => { setTypeFilter(v); setPage(1) },
              options: typeDropdownOptions,
            }]}
          />
        </div>

        {loading ? (
          <LoadingSkeleton rows={ITEMS_PER_PAGE} columns={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPlans} />
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Icon name="loyalty" size={36} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">No plans yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">Create subscription plans to offer your users.</p>
            <button onClick={openCreateDrawer} className="px-6 py-3 text-sm font-semibold rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
              <Icon name="add" size={18} /> Create Your First Plan
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Billing</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium">Max Users</th>
                <th className="text-left px-4 py-3 font-medium">Subscribers</th>
                <th className="text-left px-4 py-3 font-medium">Exclusive</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planTypeColors[p.plan] || ''}`}>{p.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{p.billingCycle || '—'}</td>
                  <td className="px-4 py-3 font-semibold">₱{Number(p.price).toLocaleString()}</td>
                  <td className="px-4 py-3">{p.maxUsers}</td>
                  <td className="px-4 py-3 font-medium">{distribution[p.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    {p.features?.exclusiveCoupons ? (
                      <Icon name="check_circle" size={16} className="text-primary" />
                    ) : (
                      <Icon name="cancel" size={16} className="text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(p)} className="cursor-pointer">
                      <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditDrawer(p)} className="p-1.5 rounded-lg hover:bg-muted">
                        <Icon name="edit" size={16} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-muted">
                        <Icon name="delete" size={16} className="text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditingPlan(null) }} title={editingPlan ? 'Edit Plan' : 'Add Plan'}
        footer={<>
          <button onClick={() => { setDrawerOpen(false); setEditingPlan(null) }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
        </>}
      >
        <div className="space-y-4">
          <FormField label="Plan Name" placeholder="e.g. Standard Monthly" value={formData.name || ''} onChange={v => {
            handleFormChange('name', v)
            if (!editingPlan) {
              handleFormChange('slug', v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
            }
          }} />
          <FormField label="Slug" placeholder="auto-generated" value={formData.slug || ''} onChange={v => handleFormChange('slug', v)} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Plan Type" select options={['Free', 'Standard', 'Family']} value={formData.plan ? formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1) : ''} onChange={v => {
              const val = v.toLowerCase()
              handleFormChange('plan', val)
              if (val === 'free') {
                handleFormChange('billingCycle', '')
                handleFormChange('price', '0')
                handleFormChange('exclusiveCoupons', false)
              } else {
                handleFormChange('exclusiveCoupons', true)
              }
              handleFormChange('maxUsers', val === 'family' ? '3' : '1')
            }} />
            {formData.plan && formData.plan !== 'free' && (
              <FormField label="Billing Cycle" select options={['Monthly', 'Yearly']} value={formData.billingCycle ? formData.billingCycle.charAt(0).toUpperCase() + formData.billingCycle.slice(1) : ''} onChange={v => handleFormChange('billingCycle', v.toLowerCase())} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price (₱)" type="number" placeholder="e.g. 99" value={formData.price ?? ''} onChange={v => handleFormChange('price', v)} />
            <FormField label="Max Users" type="number" placeholder="e.g. 1" value={formData.maxUsers ?? ''} onChange={v => handleFormChange('maxUsers', v)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">Features</label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={!!formData.exclusiveCoupons} onChange={(e) => handleFormChange('exclusiveCoupons', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm">Access to exclusive B-ticket coupons</span>
            </label>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={formData.isActive !== false} onChange={(e) => handleFormChange('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', select, options = [], placeholder, value, onChange }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  const handleChange = (e) => onChange?.(e.target.value)
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {select ? (
        <select className={cls} value={value || ''} onChange={handleChange}>
          <option value="">Select...</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} className={cls} placeholder={placeholder} value={value ?? ''} onChange={handleChange} />
      )}
    </div>
  )
}
