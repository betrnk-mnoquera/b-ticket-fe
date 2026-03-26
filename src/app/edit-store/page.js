'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { storeService } from '@/lib/api/services/storeService'
import { organizationService } from '@/lib/api/services/organizationService'
import { businessTypeService } from '@/lib/api/services/businessTypeService'
import { productService } from '@/lib/api/services/productService'
import { categoryService } from '@/lib/api/services/categoryService'
import { mediaService } from '@/lib/api/services/mediaService'

const createSteps = ['Business Details', 'Business Hours', 'Review']
const editSteps = ['Business Details', 'Store Images', 'Products & Services', 'Business Hours']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const paymentMethodsList = [
  { key: 'cash', label: 'Cash', icon: 'payments' },
  { key: 'credit_card', label: 'Credit Card', icon: 'credit_card' },
  { key: 'e_wallet', label: 'E-Wallet', icon: 'account_balance_wallet' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'account_balance' },
  { key: 'qr_pay', label: 'QR Pay', icon: 'qr_code_2' },
]

const photoCategories = ['Interior', 'Exterior', 'Menu', 'Products', 'Other']
const storeStatuses = ['Active', 'Inactive']

export default function EditStore() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeId = searchParams.get('id')
  const isCreateMode = !storeId
  const [currentStep, setCurrentStep] = useState(0)
  const [boolFields, setBoolFields] = useState({})
  const [fieldValues, setFieldValues] = useState({})
  const [selectedFields, setSelectedFields] = useState([])
  const toast = useToast()

  // API state
  const [storeData, setStoreData] = useState(null)
  const [categoriesList, setCategoriesList] = useState([])
  const [categoryOptionsList, setCategoryOptionsList] = useState([])
  const [organizationsList, setOrganizationsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    storeName: '',
    businessType: '',
    businessTypeId: '',
    storeStatus: 'Active',
    description: '',
    priceRangeMin: 0,
    priceRangeMax: 0,
    paymentMethods: ['cash', 'credit_card'],
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Philippines',
    zipCode: '',
    organizationId: '',
  })

  // Business hours state
  const [hours, setHours] = useState(days.map((d, i) => ({
    day: d,
    open: i < 6,
    slots: [{ openTime: i === 5 ? '10:00' : '09:00', closeTime: i === 5 ? '16:00' : '18:00' }],
    is24h: false,
  })))

  // Bulk apply state
  const [bulkDays, setBulkDays] = useState([0, 1, 2, 3, 4])
  const [bulkOpenTime, setBulkOpenTime] = useState('09:00')
  const [bulkCloseTime, setBulkCloseTime] = useState('18:00')

  // Image state
  const [logoFile, setLogoFile] = useState(null)
  const [featuredFile, setFeaturedFile] = useState(null)

  // Categorized photos state
  const [storePhotos, setStorePhotos] = useState([]) // { category, name, url, file? }
  const [activePhotoCategory, setActivePhotoCategory] = useState('Interior')

  // Products state
  const [products, setProducts] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '', status: 'active' })
  const [savingProduct, setSavingProduct] = useState(false)

  const fetchStoreData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const promises = [
        businessTypeService.getAll({ perPage: 100 }),
        organizationService.getOrganizations({ perPage: 100 }),
        categoryService.getAll({ status: 'active' }),
      ]
      if (storeId) {
        promises.push(storeService.getStore(storeId))
        promises.push(productService.getProducts({ store_id: storeId, per_page: 200 }).catch(() => ({ data: [] })))
      }

      const results = await Promise.all(promises)
      const lobsRes = results[0]
      const orgsRes = results[1]
      const catOptsRes = results[2]
      const lobsResult = lobsRes.data || lobsRes
      const orgsResult = orgsRes.data || orgsRes
      const catOptsResult = catOptsRes.data || catOptsRes
      const lobs = lobsResult.data || lobsResult || []
      const orgs = orgsResult.data || orgsResult || []
      const catOpts = catOptsResult.data || catOptsResult || []

      setCategoriesList(lobs)
      setOrganizationsList(orgs)
      setCategoryOptionsList(catOpts)

      if (storeId && results[3]) {
        const store = results[3].data || results[3]
        setStoreData(store)

        setFormData({
          storeName: store.storeName || '',
          businessType: store.businessType || '',
          businessTypeId: store.businessTypeId || store.businessType?.id || '',
          storeStatus: store.status === 'active' ? 'Active' : store.status === 'inactive' ? 'Inactive' : 'Active',
          description: store.description || '',
          priceRangeMin: store.priceRangeMin || 0,
          priceRangeMax: store.priceRangeMax || 0,
          paymentMethods: store.paymentMethods || ['cash', 'credit_card'],
          email: store.email || '',
          phone: store.phone || '',
          address: store.address || '',
          city: store.city || '',
          country: store.country || 'Philippines',
          zipCode: store.zipCode || '',
          organizationId: store.organizationId || store.organization?.id || '',
          storeType: store.storeType || 'branch',
        })

        if (store.businessHours) setHours(store.businessHours)
        if (store.photos && Array.isArray(store.photos)) setStorePhotos(store.photos)

        const storedFields = store.customFields || store.fieldValues
        if (storedFields) {
          setFieldValues(storedFields)
          const bools = {}
          Object.entries(storedFields).forEach(([k, v]) => {
            if (typeof v === 'boolean') bools[k] = v
          })
          setBoolFields(bools)
        }

        if (store.selectedFields && Array.isArray(store.selectedFields)) {
          setSelectedFields(store.selectedFields)
        } else if (storedFields) {
          setSelectedFields(Object.keys(storedFields))
        }

        // Load products
        if (results[4]) {
          const prodResult = results[4].data || results[4]
          const prods = prodResult.data || prodResult || []
          setProducts(Array.isArray(prods) ? prods : [])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStoreData()
  }, [fetchStoreData])

  const selectedCategory = categoriesList.find(c => String(c.id) === String(formData.businessTypeId))
  const categoryFields = selectedCategory?.fields || []

  const handleFileUpload = async (file, onSuccess) => {
    setUploading(true)
    try {
      const response = await mediaService.upload(file)
      const result = response.data || response
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      toast(err.message || 'Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const togglePaymentMethod = (key) => {
    setFormData(p => ({
      ...p,
      paymentMethods: p.paymentMethods.includes(key)
        ? p.paymentMethods.filter(m => m !== key)
        : [...p.paymentMethods, key],
    }))
  }

  // Photo handlers
  const handlePhotoUpload = (file, category) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setStorePhotos(prev => [...prev, { category, name: file.name, url, file }])
  }

  const removePhoto = (index) => {
    setStorePhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Product handlers
  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: '', category: '', imageUrl: '', status: 'active' })
    setEditingProduct(null)
    setShowProductForm(false)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast('Product name and price are required')
      return
    }
    setSavingProduct(true)
    try {
      if (editingProduct) {
        const res = await productService.updateProduct(editingProduct.id, productForm)
        const updated = res.data || res
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p))
        toast('Product updated!')
      } else {
        const res = await productService.createProduct({ ...productForm, storeId: Number(storeId) })
        const created = res.data || res
        setProducts(prev => [...prev, created])
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
      setProducts(prev => prev.filter(p => p.id !== id))
      toast('Product deleted')
    } catch (err) {
      toast(err.message || 'Failed to delete product')
    }
  }

  const startEditProduct = (product) => {
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      status: product.status || 'active',
    })
    setEditingProduct(product)
    setShowProductForm(true)
  }

  // Business hours handlers
  const handleBulkApply = () => {
    setHours(prev => prev.map((h, i) => {
      if (bulkDays.includes(i)) {
        return { ...h, open: true, slots: [{ openTime: bulkOpenTime, closeTime: bulkCloseTime }], is24h: false }
      }
      return h
    }))
  }

  const handleBulk24h = () => {
    setHours(prev => prev.map((h, i) => {
      if (bulkDays.includes(i)) {
        return { ...h, open: true, is24h: true, slots: [{ openTime: '00:00', closeTime: '23:59' }] }
      }
      return h
    }))
  }

  const handleBulkOff = () => {
    setHours(prev => prev.map((h, i) => {
      if (bulkDays.includes(i)) {
        return { ...h, open: false, is24h: false }
      }
      return h
    }))
  }

  const addTimeSlot = (dayIndex) => {
    setHours(prev => prev.map((h, i) => {
      if (i === dayIndex) {
        return { ...h, slots: [...h.slots, { openTime: '09:00', closeTime: '18:00' }] }
      }
      return h
    }))
  }

  const removeTimeSlot = (dayIndex, slotIndex) => {
    setHours(prev => prev.map((h, i) => {
      if (i === dayIndex && h.slots.length > 1) {
        return { ...h, slots: h.slots.filter((_, si) => si !== slotIndex) }
      }
      return h
    }))
  }

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    setHours(prev => prev.map((h, i) => {
      if (i === dayIndex) {
        const newSlots = h.slots.map((s, si) => si === slotIndex ? { ...s, [field]: value } : s)
        return { ...h, slots: newSlots }
      }
      return h
    }))
  }

  const formatTime12h = (time24) => {
    if (!time24) return ''
    const [h, m] = time24.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        storeName: formData.storeName,
        businessType: formData.businessType,
        businessTypeId: formData.businessTypeId || undefined,
        description: formData.description,
        priceRangeMin: formData.priceRangeMin,
        priceRangeMax: formData.priceRangeMax,
        paymentMethods: formData.paymentMethods,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        zipCode: formData.zipCode,
        organizationId: formData.organizationId || undefined,
        storeType: formData.storeType || 'branch',
        businessHours: hours,
        selectedFields,
        customFields: Object.fromEntries(
          selectedFields.map(name => [name, { ...fieldValues, ...boolFields }[name]]).filter(([, v]) => v !== undefined)
        ),
        photos: storePhotos.map(p => ({ category: p.category, name: p.name, url: p.url })),
      }

      if (isCreateMode) {
        await storeService.createStore(payload)
        toast('Store created successfully!')
        router.push('/organizations')
      } else {
        await storeService.updateStore(storeId, payload)
        toast('Store saved successfully!')
      }
    } catch (err) {
      toast(err.message || 'Failed to save store')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save for edit mode (debounced)
  const saveTimerRef = useRef(null)
  const hasLoadedRef = useRef(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'

  const triggerAutoSave = useCallback(() => {
    if (isCreateMode || !storeId || !hasLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setAutoSaveStatus(null)
    saveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving')
      try {
        const payload = {
          storeName: formData.storeName,
          businessType: formData.businessType,
          businessTypeId: formData.businessTypeId || undefined,
          description: formData.description,
          priceRangeMin: formData.priceRangeMin,
          priceRangeMax: formData.priceRangeMax,
          paymentMethods: formData.paymentMethods,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          zipCode: formData.zipCode,
          organizationId: formData.organizationId || undefined,
          storeType: formData.storeType || 'branch',
          businessHours: hours,
          selectedFields,
          customFields: Object.fromEntries(
            selectedFields.map(name => [name, { ...fieldValues, ...boolFields }[name]]).filter(([, v]) => v !== undefined)
          ),
          photos: storePhotos.map(p => ({ category: p.category, name: p.name, url: p.url })),
        }
        await storeService.updateStore(storeId, payload)
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus(null), 2000)
      } catch {
        setAutoSaveStatus('error')
      }
    }, 1500)
  }, [isCreateMode, storeId, formData, hours, selectedFields, fieldValues, boolFields, storePhotos])

  // Track when initial data has loaded to avoid auto-saving on mount
  useEffect(() => {
    if (!loading && storeData) {
      setTimeout(() => { hasLoadedRef.current = true }, 500)
    }
  }, [loading, storeData])

  // Auto-save when form data changes (edit mode only)
  useEffect(() => {
    if (!isCreateMode && hasLoadedRef.current) triggerAutoSave()
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [formData, hours, selectedFields, fieldValues, boolFields, triggerAutoSave, isCreateMode])

  const steps = isCreateMode ? createSteps : editSteps
  const currentStepName = steps[currentStep]

  const cls = 'w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring'

  const pageTitle = isCreateMode ? 'Create Store' : `Edit Store - ${formData.storeName || 'Store'}`

  if (loading) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: pageTitle }]}
          title={pageTitle}
        />
        <CardSkeleton count={1} />
        <div className="mt-6"><LoadingSkeleton rows={6} columns={2} /></div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: pageTitle }]}
          title={pageTitle}
        />
        <ErrorState message={error} onRetry={fetchStoreData} />
      </div>
    )
  }

  const photosForCategory = storePhotos.filter(p => p.category === activePhotoCategory)
  const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: pageTitle }]}
        title={pageTitle}
      />

      {/* Tabs / Stepper */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        {isCreateMode ? (
          /* Stepper for create mode */
          <div className="flex items-center justify-between px-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < currentStep ? 'bg-success-bg text-success-fg' :
                    i === currentStep ? 'bg-primary text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i < currentStep ? <Icon name="check" size={16} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${i === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${i < currentStep ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        ) : (
          /* Clickable tabs for edit mode */
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((step, i) => (
                <button key={step} onClick={() => setCurrentStep(i)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    i === currentStep
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}>
                  {step}
                </button>
              ))}
            </div>
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
                  Saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-xs text-success-fg">
                  <Icon name="check_circle" size={14} /> Saved
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <Icon name="error" size={14} /> Save failed
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">

        {/* Business Details */}
        {currentStepName === 'Business Details' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold">Business Details</h3>
              <div className="border-t border-border mt-3 pt-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Store Name</label>
                    <input className={cls} placeholder="Enter store name" value={formData.storeName} onChange={e => setFormData(p => ({ ...p, storeName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Organization</label>
                    <select className={cls} value={formData.organizationId} onChange={e => setFormData(p => ({ ...p, organizationId: e.target.value, ...(!e.target.value && { storeType: '' }) }))}>
                      <option value="">Independent (No Organization)</option>
                      {organizationsList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Business Type</label>
                    <select className={cls} value={formData.businessTypeId} onChange={e => {
                      setFormData(p => ({ ...p, businessTypeId: e.target.value }))
                      setSelectedFields([])
                      setFieldValues({})
                      setBoolFields({})
                    }}>
                      <option value="">Select category</option>
                      {(() => {
                        const grouped = {}
                        categoriesList.forEach(lob => {
                          const catName = lob.category?.name || lob.name
                          if (!grouped[catName]) grouped[catName] = []
                          // Only add if it has a subcategory (avoid duplicates)
                          if (lob.subcategory) {
                            grouped[catName].push(lob)
                          } else if (!lob.cat_id) {
                            // Old LOBs without category — show under their own name
                            grouped[catName].push(lob)
                          }
                        })
                        return Object.entries(grouped).map(([catName, lobs]) => (
                          lobs.length > 0 ? (
                            <optgroup key={catName} label={catName}>
                              {lobs.map(lob => (
                                <option key={lob.id} value={lob.id}>{lob.subcategory || lob.name}</option>
                              ))}
                            </optgroup>
                          ) : null
                        ))
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Store Status</label>
                    <select className={cls} value={formData.storeStatus} onChange={e => setFormData(p => ({ ...p, storeStatus: e.target.value }))}>
                      {storeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {formData.organizationId && (
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Store Type</label>
                      <div className="flex items-center gap-4 mt-1">
                        {[{ value: 'branch', label: 'Branch', icon: 'store' }, { value: 'franchise', label: 'Franchise', icon: 'storefront' }].map(opt => (
                          <label key={opt.value}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                              (formData.storeType || 'branch') === opt.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                            }`}>
                            <input
                              type="radio"
                              name="storeType"
                              value={opt.value}
                              checked={(formData.storeType || 'branch') === opt.value}
                              onChange={e => setFormData(p => ({ ...p, storeType: e.target.value }))}
                              className="sr-only"
                            />
                            <Icon name={opt.icon} size={16} />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Business Description</label>
                    <textarea className={`${cls} h-24 resize-none`} placeholder="Describe your business..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
                    <input type="email" className={cls} placeholder="store@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Phone</label>
                    <input className={cls} placeholder="+63 900 000 0000" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Address</label>
                    <input className={cls} placeholder="Street address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">City</label>
                    <input className={cls} placeholder="City" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Price Range</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                        <input type="number" className={`${cls} pl-7`} value={formData.priceRangeMin} onChange={e => setFormData(p => ({ ...p, priceRangeMin: Number(e.target.value) }))} />
                      </div>
                      <span className="text-sm text-muted-foreground">to</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                        <input type="number" className={`${cls} pl-7`} value={formData.priceRangeMax} onChange={e => setFormData(p => ({ ...p, priceRangeMax: Number(e.target.value) }))} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Payment Methods</label>
                    <div className="flex flex-wrap gap-2">
                      {paymentMethodsList.map(pm => {
                        const isActive = formData.paymentMethods.includes(pm.key)
                        return (
                          <button key={pm.key} type="button" onClick={() => togglePaymentMethod(pm.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                              isActive
                                ? 'bg-primary text-white border-primary'
                                : 'bg-card text-foreground border-border hover:bg-muted'
                            }`}>
                            <Icon name={pm.icon} size={14} />
                            {pm.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Business Details - shown when category is selected */}
                {categoryFields.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold">{selectedCategory?.name} Fields</h4>
                      <span className="text-xs text-muted-foreground">{selectedFields.length} of {categoryFields.length} selected</span>
                    </div>
                    <div className="space-y-3">
                      {categoryFields.map((field, i) => {
                        const isSelected = selectedFields.includes(field.name)
                        return (
                          <div key={i} className={`border rounded-lg transition-colors ${isSelected ? 'border-primary/40 bg-primary/[0.02]' : 'border-border'}`}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedFields(prev =>
                                    prev.includes(field.name)
                                      ? prev.filter(f => f !== field.name)
                                      : [...prev, field.name]
                                  )
                                }}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary shrink-0"
                              />
                              <div className="flex items-center gap-2">
                                <Icon name={field.type === 'select' ? 'list' : field.type === 'number' ? 'tag' : field.type === 'boolean' ? 'toggle_on' : 'text_fields'} size={14} className="text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{field.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{field.type}</span>
                              </div>
                            </label>
                            {isSelected && (
                              <div className="px-3 pb-3 pt-0 ml-10">
                                {field.type === 'select' ? (
                                  <select className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))}>
                                    <option value="">Select...</option>
                                    {(Array.isArray(field.options) ? field.options : []).map(o => <option key={o}>{o}</option>)}
                                  </select>
                                ) : field.type === 'number' ? (
                                  <input type="number" className={cls} placeholder={`Enter ${field.name}`} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))} />
                                ) : field.type === 'boolean' ? (
                                  <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setBoolFields(p => ({ ...p, [field.name]: !p[field.name] }))}
                                      className={`w-10 h-5 rounded-full relative transition-colors ${boolFields[field.name] ? 'bg-primary' : 'bg-border'}`}>
                                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${boolFields[field.name] ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                    <span className="text-sm text-muted-foreground">{boolFields[field.name] ? 'Yes' : 'No'}</span>
                                  </div>
                                ) : (
                                  <input className={cls} placeholder={`Enter ${field.name}`} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))} />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Store Images (Categorized) - Edit mode only */}
        {currentStepName === 'Store Images' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold">Store Images</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload your store logo, featured image, and categorized photos</p>
            </div>
            <div className="border-t border-border pt-5">
              {/* Logo & Featured */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Store Logo <span className="text-destructive">*</span></label>
                  <div
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    {logoFile ? (
                      <div className="text-center">
                        <Icon name="check_circle" size={32} className="text-primary mb-2" />
                        <p className="text-sm font-medium">{logoFile.name}</p>
                      </div>
                    ) : (
                      <>
                        <Icon name="add_photo_alternate" size={32} className="text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Upload Logo</p>
                        <p className="text-xs text-muted-foreground mt-1">1:1 ratio recommended</p>
                      </>
                    )}
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) setLogoFile(e.target.files[0]) }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG or SVG (max 5MB)</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Featured Image <span className="text-destructive">*</span></label>
                  <div
                    onClick={() => document.getElementById('featured-upload')?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    {featuredFile ? (
                      <div className="text-center">
                        <Icon name="check_circle" size={32} className="text-primary mb-2" />
                        <p className="text-sm font-medium">{featuredFile.name}</p>
                      </div>
                    ) : (
                      <>
                        <Icon name="add_photo_alternate" size={32} className="text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Upload Featured Image</p>
                        <p className="text-xs text-muted-foreground mt-1">16:9 ratio recommended</p>
                      </>
                    )}
                    <input id="featured-upload" type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) setFeaturedFile(e.target.files[0]) }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">JPG or PNG (max 10MB)</p>
                </div>
              </div>

              {/* Categorized Photos */}
              <div className="border-t border-border pt-5">
                <h4 className="text-sm font-semibold mb-4">Store Photos</h4>
                <div className="flex gap-2 mb-4">
                  {photoCategories.map(cat => {
                    const count = storePhotos.filter(p => p.category === cat).length
                    return (
                      <button key={cat} type="button" onClick={() => setActivePhotoCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          activePhotoCategory === cat
                            ? 'bg-primary text-white border-primary'
                            : 'bg-card text-foreground border-border hover:bg-muted'
                        }`}>
                        {cat} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                      </button>
                    )
                  })}
                </div>

                {/* Photos grid for active category */}
                <div className="grid grid-cols-4 gap-3">
                  {photosForCategory.map((photo, i) => {
                    const globalIdx = storePhotos.indexOf(photo)
                    return (
                      <div key={i} className="relative group border border-border rounded-lg overflow-hidden aspect-video bg-muted/30">
                        {photo.url ? (
                          <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="image" size={24} className="text-muted-foreground" />
                          </div>
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

                  {/* Upload button */}
                  <div
                    onClick={() => document.getElementById(`photo-upload-${activePhotoCategory}`)?.click()}
                    className="border-2 border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    <Icon name="add_photo_alternate" size={24} className="text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Add Photo</p>
                    <input id={`photo-upload-${activePhotoCategory}`} type="file" accept="image/*" className="hidden"
                      onClick={e => e.stopPropagation()}
                      onChange={e => { if (e.target.files[0]) handlePhotoUpload(e.target.files[0], activePhotoCategory) }} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  {storePhotos.length} photo{storePhotos.length !== 1 ? 's' : ''} total across all categories
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products & Services - Edit mode only */}
        {currentStepName === 'Products & Services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Products & Services</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage your store&apos;s product catalog</p>
              </div>
              <button type="button" onClick={() => { resetProductForm(); setShowProductForm(true) }}
                className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
                <Icon name="add" size={16} /> Add Product
              </button>
            </div>

            <>
              {/* Product Form (inline) */}
                {showProductForm && (
                  <div className="border border-primary/30 rounded-xl p-5 bg-primary/[0.02]">
                    <h4 className="text-sm font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Product Name <span className="text-destructive">*</span></label>
                        <input className={cls} placeholder="e.g. Chicken Adobo" value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Price <span className="text-destructive">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                          <input type="number" className={`${cls} pl-7`} placeholder="0.00" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Category</label>
                        <input className={cls} placeholder="e.g. Main Course, Beverages" value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                          list="product-categories" />
                        <datalist id="product-categories">
                          {productCategories.map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Status</label>
                        <select className={cls} value={productForm.status} onChange={e => setProductForm(p => ({ ...p, status: e.target.value }))}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Description</label>
                      <textarea className={`${cls} h-20 resize-none`} placeholder="Describe this product or service..." value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveProduct} disabled={savingProduct}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                        <Icon name="check" size={16} /> {savingProduct ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}
                      </button>
                      <button type="button" onClick={resetProductForm}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                {products.length > 0 ? (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Product</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Price</th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, i) => (
                          <tr key={product.id || i} className={i < products.length - 1 ? 'border-b border-white/15' : ''}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{product.name}</p>
                                {product.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {product.category ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{product.category}</span>
                              ) : <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">₱{Number(product.price || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                product.status === 'active' ? 'bg-success-bg text-success-fg' : 'bg-muted text-muted-foreground'
                              }`}>{product.status === 'active' ? 'Active' : 'Inactive'}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => startEditProduct(product)}
                                  className="p-1.5 rounded hover:bg-muted" title="Edit">
                                  <Icon name="edit" size={16} className="text-muted-foreground" />
                                </button>
                                <button type="button" onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 rounded hover:bg-destructive/10" title="Delete">
                                  <Icon name="delete" size={16} className="text-destructive" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !showProductForm && (
                  <div className="border border-border rounded-xl p-8 text-center">
                    <Icon name="inventory_2" size={48} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">No products yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Add your first product or service to this store.</p>
                    <button type="button" onClick={() => { resetProductForm(); setShowProductForm(true) }}
                      className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 inline-flex items-center gap-1.5">
                      <Icon name="add" size={16} /> Add Product
                    </button>
                  </div>
                )}
              </>
          </div>
        )}

        {/* Business Hours */}
        {currentStepName === 'Business Hours' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold">Business Hours</h3>
              <p className="text-sm text-muted-foreground mt-1">Set your store&apos;s operating hours for each day</p>
            </div>
            <div className="border-t border-border pt-5">
              {/* Bulk Apply Row */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/15">
                <div className="flex gap-1.5">
                  {dayLetters.map((letter, i) => (
                    <button key={i} type="button" onClick={() => setBulkDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                        bulkDays.includes(i) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}>
                      {letter}
                    </button>
                  ))}
                </div>
                <input type="time" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring" value={bulkOpenTime} onChange={e => setBulkOpenTime(e.target.value)} />
                <span className="text-muted-foreground">-</span>
                <input type="time" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring" value={bulkCloseTime} onChange={e => setBulkCloseTime(e.target.value)} />
                <button type="button" onClick={handleBulkApply} className="px-4 py-1.5 text-xs font-medium rounded-full bg-primary text-white hover:opacity-90">Apply</button>
                <button type="button" onClick={handleBulk24h} className="px-4 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted">24h</button>
                <button type="button" onClick={handleBulkOff} className="px-4 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted">Off</button>
              </div>

              {/* Per-day rows */}
              <div className="space-y-1">
                {hours.map((h, i) => (
                  <div key={h.day} className={`flex items-start gap-3 py-3 ${i < hours.length - 1 ? 'border-b border-white/15' : ''}`}>
                    <button type="button" onClick={() => setHours(prev => prev.map((p, j) => j === i ? { ...p, open: !p.open, is24h: false } : p))}
                      className={`mt-0.5 w-10 h-5 rounded-full relative transition-colors shrink-0 ${h.open ? 'bg-primary' : 'bg-border'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.open ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="w-24 text-sm font-medium mt-0.5 shrink-0">{h.day}</span>

                    {h.open ? (
                      <div className="flex-1">
                        {h.is24h ? (
                          <span className="text-sm text-muted-foreground">Open 24 Hours</span>
                        ) : (
                          <div className="space-y-2">
                            {h.slots.map((slot, si) => (
                              <div key={si} className="flex items-center gap-2">
                                <input type="time" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring w-36"
                                  value={slot.openTime} onChange={e => updateTimeSlot(i, si, 'openTime', e.target.value)} />
                                <span className="text-sm text-muted-foreground">to</span>
                                <input type="time" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring w-36"
                                  value={slot.closeTime} onChange={e => updateTimeSlot(i, si, 'closeTime', e.target.value)} />
                                {h.slots.length > 1 && (
                                  <button type="button" onClick={() => removeTimeSlot(i, si)} className="p-1 rounded hover:bg-muted">
                                    <Icon name="close" size={14} className="text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => addTimeSlot(i)} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                              <Icon name="add" size={14} /> Add time slot
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground mt-0.5">Closed</span>
                    )}

                    {h.open && (
                      <label className="flex items-center gap-1.5 shrink-0 ml-auto cursor-pointer">
                        <input type="checkbox" checked={h.is24h} onChange={() => setHours(prev => prev.map((p, j) => j === i ? { ...p, is24h: !p.is24h, slots: !p.is24h ? [{ openTime: '00:00', closeTime: '23:59' }] : p.slots } : p))}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        <span className="text-xs text-muted-foreground">24 Hours</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review */}
        {currentStepName === 'Review' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Review</h3>
            <p className="text-sm text-muted-foreground">Please review all information before saving.</p>
            {[
              ['Business Details', [
                ['Store Name', formData.storeName || '-'],
                ['Business Type', formData.businessType || '-'],
                ['Category', selectedCategory?.name || '-'],
                ['Status', formData.storeStatus],
                ['Price Range', formData.priceRangeMin || formData.priceRangeMax ? `₱${formData.priceRangeMin} – ₱${formData.priceRangeMax}` : '-'],
                ['Payment Methods', formData.paymentMethods.map(k => paymentMethodsList.find(p => p.key === k)?.label || k).join(', ') || '-'],
              ]],
              ['Store Images', [
                ['Store Logo', logoFile ? logoFile.name : 'Not uploaded'],
                ['Featured Image', featuredFile ? featuredFile.name : 'Not uploaded'],
                ['Store Photos', storePhotos.length > 0
                  ? photoCategories.map(cat => {
                      const count = storePhotos.filter(p => p.category === cat).length
                      return count > 0 ? `${cat} (${count})` : null
                    }).filter(Boolean).join(', ')
                  : 'No photos'],
              ]],
              ['Products & Services', [
                ['Total Products', `${products.length}`],
                ['Categories', productCategories.length > 0 ? productCategories.join(', ') : '-'],
                ['Active Products', `${products.filter(p => p.status === 'active').length}`],
              ]],
              ['Business Hours', hours.filter(h => h.open).map(h => [
                h.day, h.is24h ? '24 Hours' : h.slots.map(s => `${formatTime12h(s.openTime)} – ${formatTime12h(s.closeTime)}`).join(', ')
              ])],
              ['Business Details', selectedFields.map(name => {
                const merged = { ...fieldValues, ...Object.fromEntries(Object.entries(boolFields).map(([k, v]) => [k, v ? 'Yes' : 'No'])) }
                return [name, String(merged[name] ?? '-')]
              })],
            ].map(([section, items]) => (
              <div key={section} className="border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-3">{section}</h4>
                {items.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {items.map(([l, v]) => (
                      <div key={l}><span className="text-xs text-muted-foreground">{l}</span><div className="text-sm font-medium">{v || '-'}</div></div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {isCreateMode ? (
        <div className="flex items-center justify-between">
          <button
            onClick={() => currentStep === 0 ? router.push('/organizations') : setCurrentStep(s => Math.max(0, s - 1))}
            className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted flex items-center gap-1.5"
          >
            <Icon name="chevron_left" size={16} /> {currentStep === 0 ? 'Cancel' : 'Previous'}
          </button>
          {currentStep < steps.length - 1 ? (
            <button onClick={() => setCurrentStep(s => s + 1)}
              className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
              Next <Icon name="chevron_right" size={16} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
              <Icon name="check" size={16} /> {saving ? 'Saving...' : 'Create Store'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/organizations')}
            className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted flex items-center gap-1.5">
            <Icon name="arrow_back" size={16} /> Back to Stores
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            <Icon name="check" size={16} /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
