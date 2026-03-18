'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { subscriberService } from '@/lib/api/services/subscriberService'

const ITEMS_PER_PAGE = 10

const filters = ['All', 'Active', 'Expiring', 'Free Trial', 'Churned', 'Cancelled']

const filterToStatus = {
  'All': undefined,
  'Active': 'active',
  'Expiring': 'expiring',
  'Free Trial': 'free_trial',
  'Churned': 'churned',
  'Cancelled': 'cancelled',
}

const planColors = { monthly: 'bg-blue-50 text-blue-700', yearly: 'bg-purple-50 text-purple-700', trial: 'bg-gray-100 text-gray-600' }

export default function Subscribers() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  // Subscriber list state
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Stats state
  const [stats, setStats] = useState([
    { icon: 'group', label: 'Total Subscribers', value: '-' },
    { icon: 'check_circle', label: 'Active', value: '-' },
    { icon: 'calendar_month', label: 'Monthly Plan', value: '-' },
    { icon: 'star', label: 'Yearly Plan', value: '-' },
  ])
  const [statsLoading, setStatsLoading] = useState(true)

  // Detail view state
  const [detailLoading, setDetailLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({})

  // Debounce ref
  const debounceRef = useRef(null)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        perPage: ITEMS_PER_PAGE,
      }
      const status = filterToStatus[filter]
      if (status) params.status = status
      if (searchQuery) params.search = searchQuery

      const response = await subscriberService.getSubscribers(params)
      const result = response.data || response

      setSubscribers(result.data || [])
      setTotalPages(result.lastPage || 1)
      setTotalItems(result.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load subscribers')
      setSubscribers([])
    } finally {
      setLoading(false)
    }
  }, [page, filter, searchQuery])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await subscriberService.getStats()
      const result = response.data || response
      setStats([
        { icon: 'group', label: 'Total Subscribers', value: String(result.totalSubscribers ?? result.total ?? '-') },
        { icon: 'check_circle', label: 'Active', value: String(result.active ?? '-') },
        { icon: 'calendar_month', label: 'Monthly Plan', value: String(result.monthlyPlan ?? result.monthly ?? '-') },
        { icon: 'star', label: 'Yearly Plan', value: String(result.yearlyPlan ?? result.yearly ?? '-') },
      ])
    } catch {
      // Keep default dash values on error
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(1)
  }

  const handleSearch = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(query)
      setPage(1)
    }, 400)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleViewDetail = async (subscriber) => {
    setDetailLoading(true)
    setSelected(subscriber)
    try {
      const response = await subscriberService.getSubscriber(subscriber.id)
      const result = response.data || response
      setSelected(result)
    } catch {
      // Fall back to the list data already set
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      await subscriberService.createSubscriber({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        plan: formData.plan?.toLowerCase(),
        status: formData.status?.toLowerCase().replace(/\s+/g, '_'),
        notes: formData.notes,
      })
      toast('Subscriber added successfully')
      setDrawerOpen(false)
      setFormData({})
      fetchSubscribers()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to create subscriber. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await subscriberService.deleteSubscriber(deleteTarget.id)
      toast('Subscriber removed')
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) {
        setSelected(null)
      }
      fetchSubscribers()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to delete subscriber. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (selected) {
    const avatar = selected.avatar || (selected.name ? selected.name.split(' ').map(n => n[0]).join('') : '?')
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Subscribers', href: '#' }, { label: selected.name }]} title="" />

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{avatar}</div>
              <div>
                <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{selected.name}</h2><StatusBadge status={selected.status} /></div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="email" size={14} /> {selected.email}</span>
                  <span className="flex items-center gap-1"><Icon name="phone" size={14} /> {selected.phone || '+63 912 345 6789'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDrawerOpen(true); setFormData(selected) }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="edit" size={14} /> Edit</button>
              <button onClick={() => setDeleteTarget(selected)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg flex items-center gap-1.5"><Icon name="delete" size={14} /> Delete</button>
            </div>
          </div>
        </div>

        {detailLoading ? (
          <CardSkeleton count={4} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatsCard icon="credit_card" label="Current Plan" value={selected.plan ? selected.plan.charAt(0).toUpperCase() + selected.plan.slice(1) : '-'} />
              <StatsCard icon="confirmation_number" label="Coupons Redeemed" value={String(selected.couponsUsed ?? 0)} />
              <StatsCard icon="savings" label="Total Savings" value={selected.totalSavings != null ? `$${selected.totalSavings}` : `$${(selected.couponsUsed ?? 0) * 6.5}`} />
              <StatsCard icon="trending_up" label="Engagement" value={`${selected.engagement ?? 0}%`} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Subscription Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[['Subscriber ID', `SUB-${String(selected.id).padStart(3, '0')}`], ['Plan', <span key="p" className={`text-xs px-2 py-0.5 rounded-full ${planColors[selected.plan] || ''}`}>{selected.plan}</span>], ['Subscribed Since', selected.subscribedDate || '-'], ['Next Renewal', selected.nextRenewal || '-'], ['Payment Method', selected.paymentMethod || '-'], ['Location', selected.location || '-']].map(([l, v], i) => (
                      <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Recent Coupons Used</h3>
                  <div className="space-y-3">
                    {(selected.recentCoupons || ['Summer Sale 20%', 'Welcome Discount', 'VIP Exclusive']).map((item, i) => {
                      const name = typeof item === 'string' ? item : item.name
                      const store = typeof item === 'string' ? 'Acme Downtown' : item.store
                      const savings = typeof item === 'string' ? `$${(8 + i * 4).toFixed(2)}` : `$${item.savings}`
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">{store} &bull; {typeof item === 'string' ? `${i + 2}d ago` : item.usedAt}</div></div>
                          <span className="text-sm font-semibold text-primary">-{savings}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 h-fit">
                <h3 className="text-sm font-semibold mb-3">Activity</h3>
                <div className="space-y-3">
                  {(selected.activities || ['Subscription renewed', 'Used coupon SUM20', 'Profile updated', 'Joined B-Ticket']).map((item, i) => {
                    const label = typeof item === 'string' ? item : item.description
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
          </>
        )}

        <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.name} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Subscribers' }]}
        title="Subscribers"
        subtitle="View and manage app subscribers"
        actions={<button onClick={() => { setDrawerOpen(true); setFormData({}) }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Subscriber</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsLoading ? <CardSkeleton count={4} /> : stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} onSearch={handleSearch} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={ITEMS_PER_PAGE} columns={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchSubscribers} />
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="group" size={40} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No subscribers found</p>
          </div>
        ) : (
          <>
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
                {subscribers.map(s => {
                  const avatar = s.avatar || (s.name ? s.name.split(' ').map(n => n[0]).join('') : '?')
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{avatar}</div><div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.email}</div></div></div></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColors[s.plan] || ''}`}>{s.plan}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${s.engagement ?? 0}%` }} /></div>
                          <span className="text-xs text-muted-foreground">{s.engagement ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{s.couponsUsed ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.subscribedDate || '-'}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1">
                        <button onClick={() => handleViewDetail(s)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                        <button onClick={() => { setDrawerOpen(true); setFormData(s) }} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border">
              <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Subscriber"
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button></>}
      >
        <div className="space-y-4">
          <FormField label="Full Name" value={formData.name || ''} onChange={v => handleFormChange('name', v)} />
          <FormField label="Email" type="email" value={formData.email || ''} onChange={v => handleFormChange('email', v)} />
          <FormField label="Phone" type="tel" value={formData.phone || ''} onChange={v => handleFormChange('phone', v)} />
          <FormField label="Plan" select options={['Monthly', 'Yearly', 'Trial']} value={formData.plan || ''} onChange={v => handleFormChange('plan', v)} />
          <FormField label="Status" select options={['Active', 'Expiring', 'Churned', 'Cancelled']} value={formData.status || ''} onChange={v => handleFormChange('status', v)} />
          <FormField label="Notes" textarea value={formData.notes || ''} onChange={v => handleFormChange('notes', v)} />
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.name} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], value = '', onChange }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  const handleChange = (e) => onChange?.(e.target.value)
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} value={value} onChange={handleChange} /> :
       select ? (
         <select className={cls} value={value} onChange={handleChange}>
           <option value="">Select...</option>
           {options.map(o => <option key={o}>{o}</option>)}
         </select>
       ) :
       <input type={type} className={cls} value={value} onChange={handleChange} />}
    </div>
  )
}
