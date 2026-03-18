'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { storeService } from '@/lib/api/services/storeService'
import { organizationService } from '@/lib/api/services/organizationService'
import { lineOfBusinessService } from '@/lib/api/services/lineOfBusinessService'
import { mediaService } from '@/lib/api/services/mediaService'

const steps = ['Business Details', 'Store Images', 'Business Hours', 'Review']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const paymentMethodsList = [
  { key: 'cash', label: 'Cash', icon: 'payments' },
  { key: 'credit_card', label: 'Credit Card', icon: 'credit_card' },
  { key: 'e_wallet', label: 'E-Wallet', icon: 'account_balance_wallet' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'account_balance' },
  { key: 'qr_pay', label: 'QR Pay', icon: 'qr_code_2' },
]

const businessTypes = ['Restaurant', 'Retail', 'Service', 'Entertainment', 'Health & Wellness', 'Education']
const storeStatuses = ['Active', 'Inactive']

export default function EditStore() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeId = searchParams.get('id')
  const isCreateMode = !storeId
  const [currentStep, setCurrentStep] = useState(0)
  const [boolFields, setBoolFields] = useState({})
  const [fieldValues, setFieldValues] = useState({})
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const toast = useToast()

  // API state
  const [storeData, setStoreData] = useState(null)
  const [categoriesList, setCategoriesList] = useState([])
  const [organizationsList, setOrganizationsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    storeName: '',
    businessType: '',
    lineOfBusinessId: '',
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
    open: i < 6, // Mon-Sat open, Sunday closed
    slots: [{ openTime: i === 5 ? '10:00' : '09:00', closeTime: i === 5 ? '16:00' : '18:00' }],
    is24h: false,
  })))

  // Bulk apply state
  const [bulkDays, setBulkDays] = useState([0, 1, 2, 3, 4]) // Mon-Fri selected by default
  const [bulkOpenTime, setBulkOpenTime] = useState('09:00')
  const [bulkCloseTime, setBulkCloseTime] = useState('18:00')

  // Image state
  const [logoFile, setLogoFile] = useState(null)
  const [featuredFile, setFeaturedFile] = useState(null)

  const fetchStoreData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const promises = [
        lineOfBusinessService.getAll({ perPage: 100 }),
        organizationService.getOrganizations({ perPage: 100 }),
      ]
      if (storeId) {
        promises.push(storeService.getStore(storeId))
      }

      const results = await Promise.all(promises)
      const catsRes = results[0]
      const orgsRes = results[1]
      const catsResult = catsRes.data || catsRes
      const orgsResult = orgsRes.data || orgsRes
      const cats = catsResult.data || catsResult || []
      const orgs = orgsResult.data || orgsResult || []

      setCategoriesList(cats)
      setOrganizationsList(orgs)

      if (storeId && results[2]) {
        const store = results[2].data || results[2]
        setStoreData(store)

        setFormData({
          storeName: store.storeName || '',
          businessType: store.businessType || '',
          lineOfBusinessId: store.lineOfBusinessId || store.lineOfBusiness?.id || '',
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
        })

        if (store.businessHours) {
          setHours(store.businessHours)
        }

        if (store.fieldValues) {
          setFieldValues(store.fieldValues)
          const bools = {}
          Object.entries(store.fieldValues).forEach(([k, v]) => {
            if (typeof v === 'boolean') bools[k] = v
          })
          setBoolFields(bools)
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

  const selectedCategory = categoriesList.find(c => String(c.id) === String(formData.lineOfBusinessId))
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
        lineOfBusinessId: formData.lineOfBusinessId || undefined,
        status: formData.storeStatus.toLowerCase(),
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
        businessHours: hours,
        fieldValues: { ...fieldValues, ...boolFields },
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

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: pageTitle }]}
        title={pageTitle}
      />

      {/* Stepper */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
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
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">

        {/* Step 1: Business Details */}
        {currentStep === 0 && (
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
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Organization Name</label>
                    <select className={cls} value={formData.organizationId} onChange={e => setFormData(p => ({ ...p, organizationId: e.target.value }))}>
                      <option value="">Independent (No Organization)</option>
                      {organizationsList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Business Category</label>
                    <select className={cls} value={formData.lineOfBusinessId} onChange={e => setFormData(p => ({ ...p, lineOfBusinessId: e.target.value }))}>
                      <option value="">Select category</option>
                      {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Store Status</label>
                    <select className={cls} value={formData.storeStatus} onChange={e => setFormData(p => ({ ...p, storeStatus: e.target.value }))}>
                      {storeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Business Description</label>
                  <textarea className={`${cls} h-24 resize-none`} placeholder="Describe your business..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
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

                {/* Business Fields - shown when category is selected */}
                {categoryFields.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border">
                    <h4 className="text-sm font-semibold mb-4">{selectedCategory?.name} Fields</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {categoryFields.map((field, i) => (
                        <div key={i}>
                          <label className="text-xs font-medium text-foreground mb-1.5 block">{field.name}</label>
                          {field.type === 'select' ? (
                            <select className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))}>
                              <option value="">Select...</option>
                              {(Array.isArray(field.options) ? field.options : []).map(o => <option key={o}>{o}</option>)}
                            </select>
                          ) : field.type === 'number' ? (
                            <input type="number" className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))} />
                          ) : field.type === 'boolean' ? (
                            <div className="flex items-center gap-3 mt-1">
                              <button type="button" onClick={() => setBoolFields(p => ({ ...p, [field.name]: !p[field.name] }))}
                                className={`w-10 h-5 rounded-full relative transition-colors ${boolFields[field.name] ? 'bg-primary' : 'bg-border'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${boolFields[field.name] ? 'left-5' : 'left-0.5'}`} />
                              </button>
                              <span className="text-sm text-muted-foreground">{boolFields[field.name] ? 'Yes' : 'No'}</span>
                            </div>
                          ) : <input className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Store Images */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold">Store Images</h3>
              <p className="text-sm text-muted-foreground mt-1">Required for app display – upload your store logo and featured image</p>
            </div>
            <div className="border-t border-border pt-5">
              <div className="grid grid-cols-2 gap-6">
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
            </div>
          </div>
        )}

        {/* Step 3: Business Hours */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold">Business Hours</h3>
              <p className="text-sm text-muted-foreground mt-1">Set your store&apos;s operating hours for each day</p>
            </div>
            <div className="border-t border-border pt-5">
              {/* Bulk Apply Row */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
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
                  <div key={h.day} className={`flex items-start gap-3 py-3 ${i < hours.length - 1 ? 'border-b border-border' : ''}`}>
                    {/* Toggle */}
                    <button type="button" onClick={() => setHours(prev => prev.map((p, j) => j === i ? { ...p, open: !p.open, is24h: false } : p))}
                      className={`mt-0.5 w-10 h-5 rounded-full relative transition-colors shrink-0 ${h.open ? 'bg-primary' : 'bg-border'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.open ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    {/* Day name */}
                    <span className="w-24 text-sm font-medium mt-0.5 shrink-0">{h.day}</span>

                    {h.open ? (
                      <div className="flex-1">
                        {h.is24h ? (
                          <span className="text-sm text-muted-foreground">Open 24 Hours</span>
                        ) : (
                          <div className="space-y-2">
                            {h.slots.map((slot, si) => (
                              <div key={si} className="flex items-center gap-2">
                                <div className="relative">
                                  <input type="time" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring w-36"
                                    value={slot.openTime} onChange={e => updateTimeSlot(i, si, 'openTime', e.target.value)} />
                                </div>
                                <span className="text-sm text-muted-foreground">to</span>
                                <div className="relative">
                                  <input type="time" className="px-2.5 py-1.5 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring w-36"
                                    value={slot.closeTime} onChange={e => updateTimeSlot(i, si, 'closeTime', e.target.value)} />
                                </div>
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

                    {/* 24 Hours checkbox */}
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

        {/* Step 4: Review */}
        {currentStep === 3 && (
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
              ]],
              ['Business Hours', hours.filter(h => h.open).map(h => [
                h.day, h.is24h ? '24 Hours' : h.slots.map(s => `${formatTime12h(s.openTime)} – ${formatTime12h(s.closeTime)}`).join(', ')
              ])],
              ['Business Fields', Object.entries({ ...fieldValues, ...Object.fromEntries(Object.entries(boolFields).map(([k, v]) => [k, v ? 'Yes' : 'No'])) }).map(([k, v]) => [k, String(v)])],
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => currentStep === 0 && isCreateMode ? router.push('/organizations') : setCurrentStep(s => Math.max(0, s - 1))}
          className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted flex items-center gap-1.5"
        >
          <Icon name="chevron_left" size={16} /> {currentStep === 0 && isCreateMode ? 'Cancel' : 'Previous'}
        </button>
        {currentStep < steps.length - 1 ? (
          <button onClick={() => setCurrentStep(s => s + 1)}
            className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            Next <Icon name="chevron_right" size={16} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            <Icon name="check" size={16} /> {saving ? 'Saving...' : isCreateMode ? 'Create Store' : 'Save & Publish'}
          </button>
        )}
      </div>
    </div>
  )
}
