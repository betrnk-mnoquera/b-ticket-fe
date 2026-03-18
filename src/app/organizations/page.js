'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { storeService } from '@/lib/api/services/storeService'
import { organizationService } from '@/lib/api/services/organizationService'
import { lineOfBusinessService } from '@/lib/api/services/lineOfBusinessService'

const ITEMS_PER_PAGE = 10

const filters = ['All', 'Pending', 'For Review', 'Verified', 'Declined']

const filterToStatus = {
  'All': undefined,
  'Pending': 'pending',
  'For Review': 'for_review',
  'Verified': 'verified',
  'Declined': 'declined',
}

const hours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Organizations() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [drawerType, setDrawerType] = useState('store')
  const [activeTab, setActiveTab] = useState('overview')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  // Store list state
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Dropdown data for create forms
  const [organizationsList, setOrganizationsList] = useState([])
  const [categoriesList, setCategoriesList] = useState([])

  // Form state
  const [formData, setFormData] = useState({})

  // Debounce ref
  const debounceRef = useRef(null)

  const fetchStores = useCallback(async () => {
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

      const response = await storeService.getStores(params)

      setStores(response.data || [])
      setTotalPages(response.lastPage || response.meta?.lastPage || 1)
      setTotalItems(response.total || response.meta?.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load stores')
      setStores([])
    } finally {
      setLoading(false)
    }
  }, [page, filter, searchQuery])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  // Fetch organizations and categories for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [orgsRes, catsRes] = await Promise.all([
          organizationService.getOrganizations({ perPage: 100 }),
          lineOfBusinessService.getAll({ perPage: 100 }),
        ])
        const orgsResult = orgsRes.data || orgsRes
        const catsResult = catsRes.data || catsRes
        setOrganizationsList(orgsResult.data || orgsResult || [])
        setCategoriesList(catsResult.data || catsResult || [])
      } catch {
        // Silently fail - dropdowns will be empty
      }
    }
    fetchDropdownData()
  }, [])

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

  const handleSave = async () => {
    setSubmitting(true)
    try {
      if (drawerType === 'organization') {
        await organizationService.createOrganization({
          name: formData.organizationName,
          email: formData.email,
          description: formData.description,
        })
        toast('Organization created successfully')
      } else {
        const customFields = formData.customFields ? Object.entries(formData.customFields).reduce((acc, [k, v]) => {
          if (v) acc[k.replace('cf_', '')] = v
          return acc
        }, {}) : null
        await storeService.createStore({
          storeName: formData.storeName,
          organizationId: formData.organizationId,
          lineOfBusinessId: formData.lineOfBusinessId,
          storeType: formData.storeType || null,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          description: formData.description,
          customFields: Object.keys(customFields || {}).length > 0 ? customFields : null,
        })
        toast('Store created successfully')
      }
      setDrawerOpen(false)
      setFormData({})
      fetchStores()
    } catch (err) {
      toast(err.message || 'Failed to create. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await storeService.deleteStore(deleteTarget.id)
      toast('Store deleted successfully')
      setDeleteTarget(null)
      if (selectedStore?.id === deleteTarget.id) {
        setSelectedStore(null)
      }
      fetchStores()
    } catch (err) {
      toast(err.message || 'Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const independentCount = stores.filter(s => !s.organizationId && !s.organization).length
  const stats = [
    { icon: 'corporate_fare', label: 'Total Organizations', value: String(organizationsList.length || 0) },
    { icon: 'store', label: 'Total Stores', value: String(totalItems) },
    { icon: 'storefront', label: 'Independent Stores', value: String(independentCount) },
    { icon: 'payments', label: 'Avg. Revenue/Store', value: '-' },
  ]

  if (selectedStore) {
    const orgName = selectedStore.organization?.name || 'Independent'
    const categoryName = selectedStore.lineOfBusiness?.name || '-'

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
                  <span className="flex items-center gap-1"><Icon name="corporate_fare" size={14} /> {orgName}</span>
                  <span className="flex items-center gap-1"><Icon name="tag" size={14} /> {selectedStore.storeId}</span>
                  <span className="flex items-center gap-1"><Icon name="location_on" size={14} /> {selectedStore.city || 'N/A'}, {selectedStore.country || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Icon name="category" size={14} /> {categoryName}</span>
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
                  ['Category', categoryName],
                  ['Status', <StatusBadge key="s" status={selectedStore.status} />],
                  ['Organization', orgName],
                  ['Price Range', '$$'],
                  ['Payment', 'Cash, Card, GCash'],
                ]} />
              </DetailCard>
              <DetailCard title="Location & Contact">
                <DetailGrid items={[
                  ['Email', selectedStore.email || '-'],
                  ['Phone', selectedStore.phone || '-'],
                  ['Address', selectedStore.address || '-'],
                  ['Country', selectedStore.country || '-'],
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
          onConfirm={handleDelete}
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
          <div className="flex items-center gap-2">
            <button onClick={() => { setDrawerOpen(true); setDrawerType('organization'); setFormData({}) }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted flex items-center gap-1.5">
              <Icon name="add" size={16} /> Add Organization
            </button>
            <Link href="/edit-store" className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
              <Icon name="add" size={16} /> Add Store
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} onSearch={handleSearch} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={ITEMS_PER_PAGE} columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStores} />
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="store" size={40} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No stores found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Store</th>
                  <th className="text-left px-4 py-3 font-medium">Organization</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Details</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => {
                  const orgName = store.organization?.name || 'Independent'
                  const categoryName = store.lineOfBusiness?.name || '-'
                  const customFields = store.customFields || {}
                  return (
                    <tr key={store.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon name="store" size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{store.storeName}</div>
                            <div className="text-xs text-muted-foreground">{store.storeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {orgName === 'Independent' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Independent</span>
                        ) : orgName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{categoryName}</td>
                      <td className="px-4 py-3">
                        {Object.keys(customFields).length > 0 ? (
                          <div className="space-y-0.5">
                            {Object.entries(customFields).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">{key}:</span>
                                <span className="text-xs font-medium">{val === 'true' ? 'Yes' : val === 'false' ? 'No' : val}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={store.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedStore(store)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                          <Link href={`/edit-store?id=${store.id}`} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></Link>
                          <button onClick={() => setDeleteTarget(store)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                        </div>
                      </td>
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Organization"
        footer={<>
          <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <FormField label="Organization Name" value={formData.organizationName || ''} onChange={v => handleFormChange('organizationName', v)} />
          <FormField label="Email" type="email" value={formData.email || ''} onChange={v => handleFormChange('email', v)} />
          <FormField label="Description" textarea value={formData.description || ''} onChange={v => handleFormChange('description', v)} />
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Logo</label><FileUpload compact /></div>
        </div>
      </Drawer>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget?.storeName}
      />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], value = '', onChange, placeholder, helperText }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  const handleChange = (e) => onChange?.(e.target.value)
  const hasCustomPlaceholder = options.length > 0 && options[0].value === ''
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} value={value} onChange={handleChange} /> :
       select ? (
         <select className={cls} value={value} onChange={handleChange}>
           {!hasCustomPlaceholder && <option value="">{placeholder || `Select ${label}`}</option>}
           {options.map(o => {
             const optValue = typeof o === 'object' ? o.value : o
             const optLabel = typeof o === 'object' ? o.label : o
             return <option key={optValue} value={optValue}>{optLabel}</option>
           })}
         </select>
       ) :
       <input type={type} className={cls} value={value} onChange={handleChange} />}
      {helperText && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
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
