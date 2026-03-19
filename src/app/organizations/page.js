'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { productService } from '@/lib/api/services/productService'

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
  const [viewMode, setViewMode] = useState('stores') // 'stores' or 'organizations'
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
  const [storeProducts, setStoreProducts] = useState([])
  const [storePhotos, setStorePhotos] = useState([])
  const [activePhotoCategory, setActivePhotoCategory] = useState('Interior')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', status: 'active' })
  const [savingProduct, setSavingProduct] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [editingOrg, setEditingOrg] = useState(null)
  const [orgDrawerOpen, setOrgDrawerOpen] = useState(false)
  const [orgForm, setOrgForm] = useState({ name: '', description: '', contactEmail: '', contactPhone: '', website: '' })
  const [orgDeleteTarget, setOrgDeleteTarget] = useState(null)
  const [orgStores, setOrgStores] = useState([])
  const [expandedOrgId, setExpandedOrgId] = useState(null)
  const [expandedOrgStores, setExpandedOrgStores] = useState([])
  const [loadingOrgStores, setLoadingOrgStores] = useState(false)
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

  // Fetch products & photos when store is selected
  useEffect(() => {
    if (!selectedStore) return
    setStoreProducts([])
    setStorePhotos(selectedStore.photos && Array.isArray(selectedStore.photos) ? selectedStore.photos : [])
    setActivePhotoCategory('Interior')
    setShowProductForm(false)
    productService.getProducts({ store_id: selectedStore.id, per_page: 200 })
      .then(res => {
        const result = res.data || res
        const prods = result.data || result || []
        setStoreProducts(Array.isArray(prods) ? prods : [])
      })
      .catch(() => setStoreProducts([]))
  }, [selectedStore?.id])

  const photoCategories = ['Interior', 'Exterior', 'Menu', 'Products', 'Other']

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: '', category: '', status: 'active' })
    setEditingProduct(null)
    setShowProductForm(false)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) { toast('Name and price required'); return }
    setSavingProduct(true)
    try {
      if (editingProduct) {
        const res = await productService.updateProduct(editingProduct.id, productForm)
        const updated = res.data || res
        setStoreProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p))
        toast('Product updated!')
      } else {
        const res = await productService.createProduct({ ...productForm, storeId: Number(selectedStore.id) })
        const created = res.data || res
        setStoreProducts(prev => [...prev, created])
        toast('Product added!')
      }
      resetProductForm()
    } catch (err) {
      toast(err.message || 'Failed to save product')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    try {
      await productService.deleteProduct(id)
      setStoreProducts(prev => prev.filter(p => p.id !== id))
      toast('Product deleted')
    } catch (err) {
      toast(err.message || 'Failed to delete')
    }
  }

  const handlePhotoUpload = (file, category) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const newPhotos = [...storePhotos, { category, name: file.name, url }]
    setStorePhotos(newPhotos)
    // Save photos to store
    storeService.updateStore(selectedStore.id, { photos: newPhotos.map(p => ({ category: p.category, name: p.name, url: p.url })) }).catch(() => {})
  }

  const removePhoto = (index) => {
    const newPhotos = storePhotos.filter((_, i) => i !== index)
    setStorePhotos(newPhotos)
    storeService.updateStore(selectedStore.id, { photos: newPhotos.map(p => ({ category: p.category, name: p.name, url: p.url })) }).catch(() => {})
  }

  // Toggle expandable org row
  const toggleExpandOrg = async (org) => {
    if (expandedOrgId === org.id) {
      setExpandedOrgId(null)
      setExpandedOrgStores([])
      return
    }
    setExpandedOrgId(org.id)
    setLoadingOrgStores(true)
    try {
      const res = await organizationService.getOrganization(org.id)
      const detail = res.data || res
      setExpandedOrgStores(detail.stores || [])
    } catch {
      setExpandedOrgStores([])
    } finally {
      setLoadingOrgStores(false)
    }
  }

  // Organization handlers
  const handleSelectOrg = async (org) => {
    setSelectedOrg(org)
    setActiveTab('overview')
    try {
      const res = await organizationService.getOrganization(org.id)
      const detail = res.data || res
      setSelectedOrg(detail)
      setOrgStores(detail.stores || [])
    } catch { setOrgStores([]) }
  }

  const handleSaveOrg = async () => {
    if (!orgForm.name) { toast('Organization name is required'); return }
    setSubmitting(true)
    try {
      if (editingOrg) {
        await organizationService.updateOrganization(editingOrg.id, orgForm)
        toast('Organization updated!')
      } else {
        await organizationService.createOrganization(orgForm)
        toast('Organization created!')
      }
      setOrgDrawerOpen(false)
      setEditingOrg(null)
      setOrgForm({ name: '', description: '', contactEmail: '', contactPhone: '', website: '' })
      // Refresh organizations list
      const res = await organizationService.getOrganizations({ perPage: 100 })
      const result = res.data || res
      setOrganizationsList(result.data || result || [])
    } catch (err) {
      toast(err.message || 'Failed to save organization')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!orgDeleteTarget) return
    setDeleting(true)
    try {
      await organizationService.deleteOrganization(orgDeleteTarget.id)
      toast('Organization deleted')
      setOrgDeleteTarget(null)
      if (selectedOrg?.id === orgDeleteTarget.id) setSelectedOrg(null)
      const res = await organizationService.getOrganizations({ perPage: 100 })
      const result = res.data || res
      setOrganizationsList(result.data || result || [])
    } catch (err) {
      toast(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const startEditOrg = (org) => {
    setOrgForm({
      name: org.name || '',
      description: org.description || '',
      contactEmail: org.contactEmail || '',
      contactPhone: org.contactPhone || '',
      website: org.website || '',
    })
    setEditingOrg(org)
    setOrgDrawerOpen(true)
  }

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

  // Organization detail view
  if (selectedOrg) {
    return (
      <div>
        <button onClick={() => setSelectedOrg(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '#' }, { label: selectedOrg.name }]}
          title=""
        />
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="corporate_fare" size={28} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedOrg.name}</h2>
                  <StatusBadge status={selectedOrg.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="tag" size={14} /> {selectedOrg.orgId}</span>
                  {selectedOrg.contactEmail && <span className="flex items-center gap-1"><Icon name="email" size={14} /> {selectedOrg.contactEmail}</span>}
                  {selectedOrg.contactPhone && <span className="flex items-center gap-1"><Icon name="phone" size={14} /> {selectedOrg.contactPhone}</span>}
                  <span className="flex items-center gap-1"><Icon name="store" size={14} /> {selectedOrg.storesCount || orgStores.length} stores</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEditOrg(selectedOrg)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="edit" size={14} /> Edit
              </button>
              <button onClick={() => setOrgDeleteTarget(selectedOrg)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg hover:border-error-fg flex items-center gap-1.5">
                <Icon name="delete" size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard icon="store" label="Total Stores" value={String(orgStores.length)} />
          <StatsCard icon="inventory_2" label="Total Products" value={String(orgStores.reduce((sum, s) => sum + (s.productsCount || 0), 0))} />
          <StatsCard icon="check_circle" label="Status" value={selectedOrg.status === 'active' ? 'Active' : 'Inactive'} />
        </div>

        <div className="flex gap-1 mb-4 border-b border-white/15">
          {['overview', 'stores'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-4">
            <DetailCard title="Organization Details">
              <DetailGrid items={[
                ['Name', selectedOrg.name || '-'],
                ['Org ID', selectedOrg.orgId || '-'],
                ['Status', <StatusBadge key="s" status={selectedOrg.status} />],
                ['Email', selectedOrg.contactEmail || '-'],
                ['Phone', selectedOrg.contactPhone || '-'],
                ['Website', selectedOrg.website || '-'],
              ]} />
            </DetailCard>
            <DetailCard title="Description">
              <p className="text-sm text-muted-foreground">{selectedOrg.description || 'No description provided.'}</p>
            </DetailCard>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {orgStores.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/15 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Store</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">City</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgStores.map(store => (
                    <tr key={store.id} className="border-b border-white/15 last:border-0 hover:bg-muted/30">
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
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          store.storeType === 'franchise' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon name={store.storeType === 'franchise' ? 'storefront' : 'store'} size={12} />
                          {store.storeType === 'franchise' ? 'Franchise' : 'Branch'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{store.lineOfBusiness?.name || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{store.city || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={store.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedOrg(null); setSelectedStore(store) }} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                          <Link href={`/edit-store?id=${store.id}`} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon name="store" size={40} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No stores in this organization</p>
              </div>
            )}
          </div>
        )}

        {/* Org Edit Drawer */}
        <Drawer open={orgDrawerOpen} onClose={() => { setOrgDrawerOpen(false); setEditingOrg(null) }} title={editingOrg ? 'Edit Organization' : 'Add Organization'}
          footer={<>
            <button onClick={() => { setOrgDrawerOpen(false); setEditingOrg(null) }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
            <button onClick={handleSaveOrg} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </>}
        >
          <div className="space-y-4">
            <FormField label="Organization Name" value={orgForm.name} onChange={v => setOrgForm(p => ({ ...p, name: v }))} />
            <FormField label="Email" type="email" value={orgForm.contactEmail} onChange={v => setOrgForm(p => ({ ...p, contactEmail: v }))} />
            <FormField label="Phone" value={orgForm.contactPhone} onChange={v => setOrgForm(p => ({ ...p, contactPhone: v }))} />
            <FormField label="Website" value={orgForm.website} onChange={v => setOrgForm(p => ({ ...p, website: v }))} />
            <FormField label="Description" textarea value={orgForm.description} onChange={v => setOrgForm(p => ({ ...p, description: v }))} />
          </div>
        </Drawer>

        <DeleteModal
          open={!!orgDeleteTarget}
          onClose={() => setOrgDeleteTarget(null)}
          onConfirm={handleDeleteOrg}
          entityName={orgDeleteTarget?.name}
        />
      </div>
    )
  }

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
              <Link href={`/edit-store?id=${selectedStore.id}`} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="edit" size={14} /> Edit Store
              </Link>
              <button onClick={() => setDeleteTarget(selectedStore)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg hover:border-error-fg flex items-center gap-1.5">
                <Icon name="delete" size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard icon="photo_library" label="Photos" value={String(storePhotos.length)} />
          <StatsCard icon="inventory_2" label="Products & Services" value={String(storeProducts.length)} />
          <StatsCard icon="confirmation_number" label="Active Coupons" value="0" />
          <StatsCard icon="visibility" label="App Views" value="-" />
        </div>

        <div className="flex gap-1 mb-4 border-b border-white/15">
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
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex gap-2 mb-4">
              {photoCategories.map(cat => {
                const count = storePhotos.filter(p => p.category === cat).length
                return (
                  <button key={cat} type="button" onClick={() => setActivePhotoCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      activePhotoCategory === cat ? 'bg-primary text-white border-primary' : 'bg-card text-foreground border-border hover:bg-muted'
                    }`}>
                    {cat} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {storePhotos.filter(p => p.category === activePhotoCategory).map((photo, i) => {
                const globalIdx = storePhotos.indexOf(photo)
                return (
                  <div key={i} className="relative group border border-border rounded-lg overflow-hidden aspect-video bg-muted/30">
                    {photo.url ? (
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Icon name="image" size={24} className="text-muted-foreground" /></div>
                    )}
                    <button type="button" onClick={() => removePhoto(globalIdx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="close" size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                      <p className="text-[10px] text-white truncate">{photo.name}</p>
                    </div>
                  </div>
                )
              })}
              <div
                onClick={() => document.getElementById('detail-photo-upload')?.click()}
                className="border-2 border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <Icon name="add_photo_alternate" size={24} className="text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Add Photo</p>
                <input id="detail-photo-upload" type="file" accept="image/*" className="hidden"
                  onClick={e => e.stopPropagation()}
                  onChange={e => { if (e.target.files[0]) handlePhotoUpload(e.target.files[0], activePhotoCategory) }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{storePhotos.length} photo{storePhotos.length !== 1 ? 's' : ''} total</p>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Products & Services ({storeProducts.length})</h3>
              <button type="button" onClick={() => { resetProductForm(); setShowProductForm(true) }}
                className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="add" size={16} /> Add Product
              </button>
            </div>

            {showProductForm && (
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/[0.02] mb-4">
                <h4 className="text-sm font-semibold mb-3">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Name <span className="text-destructive">*</span></label>
                    <input className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Chicken Adobo"
                      value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Price <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                      <input type="number" className="w-full px-3 py-2 pl-7 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0.00"
                        value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                    <input className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Main Course"
                      value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                      list="detail-product-categories" />
                    <datalist id="detail-product-categories">
                      {[...new Set(storeProducts.map(p => p.category).filter(Boolean))].map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Status</label>
                    <select className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
                      value={productForm.status} onChange={e => setProductForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
                  <textarea className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring h-16 resize-none" placeholder="Describe this product..."
                    value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveProduct} disabled={savingProduct}
                    className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">
                    {savingProduct ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}
                  </button>
                  <button type="button" onClick={resetProductForm}
                    className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
                </div>
              </div>
            )}

            {storeProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {storeProducts.map((product, i) => (
                  <div key={product.id || i} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Icon name="inventory_2" size={28} className="text-primary/40" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{product.name}</h4>
                          {product.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{product.category}</span>}
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${product.status === 'active' ? 'bg-success-bg text-success-fg' : 'bg-muted text-muted-foreground'}`}>
                          {product.status}
                        </span>
                      </div>
                      {product.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-primary">₱{Number(product.price || 0).toFixed(2)}</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setProductForm({ name: product.name || '', description: product.description || '', price: product.price || '', category: product.category || '', status: product.status || 'active' }); setEditingProduct(product); setShowProductForm(true) }}
                            className="p-1 rounded hover:bg-muted"><Icon name="edit" size={14} className="text-muted-foreground" /></button>
                          <button onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 rounded hover:bg-muted"><Icon name="delete" size={14} className="text-destructive" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !showProductForm && (
              <div className="text-center py-8">
                <Icon name="inventory_2" size={40} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No products yet. Add your first one!</p>
              </div>
            )}
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
            <button onClick={() => { setOrgForm({ name: '', description: '', contactEmail: '', contactPhone: '', website: '' }); setEditingOrg(null); setOrgDrawerOpen(true) }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted flex items-center gap-1.5">
              <Icon name="add" size={16} /> Add Organization
            </button>
            <Link href="/edit-store" className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
              <Icon name="add" size={16} /> Add Store
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <button key={i} onClick={() => { if (i === 0) { setViewMode('organizations') } else if (i === 1) { setViewMode('stores'); setFilter('All'); setPage(1) } }}
            className="text-left hover:-translate-y-0.5 transition-transform duration-200">
            <StatsCard {...s} />
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 mb-4 border-b border-white/15">
        {['stores', 'organizations'].map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${viewMode === mode ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {mode === 'stores' ? 'Stores' : 'Organizations'}
          </button>
        ))}
      </div>

      {/* Organizations Table */}
      {viewMode === 'organizations' && (
        <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
          {organizationsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Icon name="corporate_fare" size={36} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">No organizations yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">Create an organization to group and manage multiple stores.</p>
              <button onClick={() => { setOrgForm({ name: '', description: '', contactEmail: '', contactPhone: '', website: '' }); setEditingOrg(null); setOrgDrawerOpen(true) }} className="px-6 py-3 text-sm font-semibold rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
                <Icon name="add" size={18} /> Add Organization
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/15 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Organization</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">Stores</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizationsList.map(org => {
                  const isExpanded = expandedOrgId === org.id
                  return (
                    <React.Fragment key={org.id}>
                      <tr className={`border-b border-white/15 hover:bg-muted/30 cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`} onClick={() => toggleExpandOrg(org)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Icon name={isExpanded ? 'expand_more' : 'chevron_right'} size={18} className="text-muted-foreground" />
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon name="corporate_fare" size={16} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-xs text-muted-foreground">{org.orgId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {org.contactEmail && <div className="text-xs flex items-center gap-1"><Icon name="email" size={12} className="text-muted-foreground" /> {org.contactEmail}</div>}
                            {org.contactPhone && <div className="text-xs flex items-center gap-1"><Icon name="phone" size={12} className="text-muted-foreground" /> {org.contactPhone}</div>}
                            {!org.contactEmail && !org.contactPhone && <span className="text-xs text-muted-foreground">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{org.storesCount ?? 0} stores</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={org.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleSelectOrg(org)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                            <button onClick={() => startEditOrg(org)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                            <button onClick={() => setOrgDeleteTarget(org)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <div className="bg-muted/10 border-b border-white/15">
                              {loadingOrgStores ? (
                                <div className="flex items-center justify-center py-6">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2" />
                                  <span className="text-sm text-muted-foreground">Loading stores...</span>
                                </div>
                              ) : expandedOrgStores.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                  <Icon name="store" size={28} className="text-muted-foreground mb-1" />
                                  <p className="text-xs text-muted-foreground">No stores in this organization</p>
                                </div>
                              ) : (
                                <div className="px-6 py-3">
                                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Icon name="store" size={14} /> Stores ({expandedOrgStores.length})
                                  </div>
                                  <div className="space-y-1.5">
                                    {expandedOrgStores.map(store => (
                                      <div key={store.id} className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-2.5 hover:bg-muted/30">
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                                            <Icon name="storefront" size={14} className="text-primary" />
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium">{store.storeName}</div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                              <span>{store.storeId}</span>
                                              {store.lineOfBusiness?.name && <><span>·</span><span>{store.lineOfBusiness.name}</span></>}
                                              {store.city && <><span>·</span><span>{store.city}</span></>}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={store.status} />
                                          <div className="flex items-center gap-0.5">
                                            <button onClick={() => { setExpandedOrgId(null); setSelectedStore(store) }} className="p-1 rounded hover:bg-muted"><Icon name="visibility" size={14} className="text-muted-foreground" /></button>
                                            <Link href={`/edit-store?id=${store.id}`} className="p-1 rounded hover:bg-muted"><Icon name="edit" size={14} className="text-muted-foreground" /></Link>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Stores Table */}
      {viewMode === 'stores' && <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-white/15">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} onSearch={handleSearch} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={ITEMS_PER_PAGE} columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStores} />
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Icon name="store" size={36} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Add your first store!</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">Register a store to start managing your business operations.</p>
            <Link href="/edit-store" className="px-6 py-3 text-sm font-semibold rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
              <Icon name="add" size={18} /> Add Store
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/15 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Store</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
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
                    <tr key={store.id} className="border-b border-white/15 last:border-0 hover:bg-muted/30">
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
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          store.storeType === 'franchise' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon name={store.storeType === 'franchise' ? 'storefront' : 'store'} size={12} />
                          {store.storeType === 'franchise' ? 'Franchise' : 'Branch'}
                        </span>
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
      </div>}

      {/* Org Edit Drawer (from list view) */}
      <Drawer open={orgDrawerOpen} onClose={() => { setOrgDrawerOpen(false); setEditingOrg(null) }} title={editingOrg ? 'Edit Organization' : 'Add Organization'}
        footer={<>
          <button onClick={() => { setOrgDrawerOpen(false); setEditingOrg(null) }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={handleSaveOrg} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <FormField label="Organization Name" value={orgForm.name} onChange={v => setOrgForm(p => ({ ...p, name: v }))} />
          <FormField label="Email" type="email" value={orgForm.contactEmail} onChange={v => setOrgForm(p => ({ ...p, contactEmail: v }))} />
          <FormField label="Phone" value={orgForm.contactPhone} onChange={v => setOrgForm(p => ({ ...p, contactPhone: v }))} />
          <FormField label="Website" value={orgForm.website} onChange={v => setOrgForm(p => ({ ...p, website: v }))} />
          <FormField label="Description" textarea value={orgForm.description} onChange={v => setOrgForm(p => ({ ...p, description: v }))} />
        </div>
      </Drawer>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget?.storeName}
      />

      <DeleteModal
        open={!!orgDeleteTarget}
        onClose={() => setOrgDeleteTarget(null)}
        onConfirm={handleDeleteOrg}
        entityName={orgDeleteTarget?.name}
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
