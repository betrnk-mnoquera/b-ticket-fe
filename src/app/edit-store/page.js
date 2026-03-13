'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { storeService } from '@/lib/api/services/storeService'
import { lineOfBusinessService } from '@/lib/api/services/lineOfBusinessService'
import { mediaService } from '@/lib/api/services/mediaService'

const steps = ['Business Details', 'Business Fields', 'Documents', 'Media', 'Review']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function EditStore() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get('id')
  const [currentStep, setCurrentStep] = useState(0)
  const [category, setCategory] = useState('')
  const [hours, setHours] = useState(days.map(d => ({ day: d, open: d !== 'Sunday', openTime: '09:00', closeTime: '21:00' })))
  const [boolFields, setBoolFields] = useState({})
  const [fieldValues, setFieldValues] = useState({})
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const toast = useToast()

  // API state
  const [storeData, setStoreData] = useState(null)
  const [categoriesList, setCategoriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Philippines',
    zipCode: '',
    priceRange: '$',
    paymentMethods: '',
    organizationId: '',
  })

  const fetchStoreData = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [storeRes, catsRes] = await Promise.all([
        storeService.getStore(storeId),
        lineOfBusinessService.getAll({ perPage: 100 }),
      ])
      const store = storeRes.data || storeRes
      const catsResult = catsRes.data || catsRes
      const cats = catsResult.data || catsResult || []

      setStoreData(store)
      setCategoriesList(cats)

      // Populate form from store data
      setFormData({
        storeName: store.storeName || '',
        description: store.description || '',
        email: store.email || '',
        phone: store.phone || '',
        address: store.address || '',
        city: store.city || '',
        country: store.country || 'Philippines',
        zipCode: store.zipCode || '',
        priceRange: store.priceRange || '$',
        paymentMethods: store.paymentMethods || '',
        organizationId: store.organizationId || store.organization?.id || '',
      })

      const catName = store.lineOfBusiness?.name || store.category || (cats.length > 0 ? cats[0].name : '')
      setCategory(catName)

      if (store.businessHours) {
        setHours(store.businessHours)
      }

      if (store.fieldValues) {
        setFieldValues(store.fieldValues)
        // Extract boolean fields
        const bools = {}
        Object.entries(store.fieldValues).forEach(([k, v]) => {
          if (typeof v === 'boolean') bools[k] = v
        })
        setBoolFields(bools)
      }
    } catch (err) {
      setError(err.message || 'Failed to load store data')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStoreData()
  }, [fetchStoreData])

  // Fetch categories if no storeId (just categories list)
  useEffect(() => {
    if (!storeId) {
      const fetchCats = async () => {
        try {
          const catsRes = await lineOfBusinessService.getAll({ perPage: 100 })
          const catsResult = catsRes.data || catsRes
          setCategoriesList(catsResult.data || catsResult || [])
          if (!category && (catsResult.data || catsResult || []).length > 0) {
            setCategory((catsResult.data || catsResult)[0].name)
          }
        } catch {
          // Silently fail
        }
      }
      fetchCats()
    }
  }, [storeId, category])

  const categoryNames = categoriesList.map(c => c.name)
  const selectedCategory = categoriesList.find(c => c.name === category)
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        storeName: formData.storeName,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        zipCode: formData.zipCode,
        priceRange: formData.priceRange,
        paymentMethods: formData.paymentMethods,
        lineOfBusinessId: selectedCategory?.id,
        businessHours: hours,
        fieldValues: { ...fieldValues, ...boolFields },
      }

      if (storeId) {
        await storeService.updateStore(storeId, payload)
      }
      toast('Store saved successfully!')
    } catch (err) {
      toast(err.message || 'Failed to save store')
    } finally {
      setSaving(false)
    }
  }

  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'

  if (loading) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: 'Edit Store' }]}
          title="Edit Store"
        />
        <CardSkeleton count={1} />
        <div className="mt-6">
          <LoadingSkeleton rows={6} columns={2} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: 'Edit Store' }]}
          title="Edit Store"
        />
        <ErrorState message={error} onRetry={fetchStoreData} />
      </div>
    )
  }

  const storeName = formData.storeName || 'New Store'

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organizations & Stores', href: '/organizations' }, { label: `Edit Store - ${storeName}` }]}
        title={`Edit Store - ${storeName}`}
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
        {currentStep === 0 && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Store Name</label><input className={cls} value={formData.storeName} onChange={e => setFormData(p => ({ ...p, storeName: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                <select className={cls} value={category} onChange={e => setCategory(e.target.value)}>
                  {categoryNames.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Organization</label>
              <select className={cls} value={formData.organizationId} onChange={e => setFormData(p => ({ ...p, organizationId: e.target.value }))}>
                {storeData?.organization && <option value={storeData.organization.id}>{storeData.organization.name}</option>}
                <option value="">Independent</option>
              </select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <textarea className={`${cls} h-20 resize-none`} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            </div>

            <h4 className="text-sm font-semibold pt-2">Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label><input type="email" className={cls} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label><input type="tel" className={cls} value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>

            <h4 className="text-sm font-semibold pt-2">Address</h4>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Street Address</label><input className={cls} value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label><input className={cls} value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Country</label>
                <select className={cls} value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}><option>Philippines</option><option>Singapore</option><option>Malaysia</option></select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Zip Code</label><input className={cls} value={formData.zipCode} onChange={e => setFormData(p => ({ ...p, zipCode: e.target.value }))} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price Range</label>
                <select className={cls} value={formData.priceRange} onChange={e => setFormData(p => ({ ...p, priceRange: e.target.value }))}><option>$</option><option>$$</option><option>$$$</option><option>$$$$</option></select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Methods</label><input className={cls} value={formData.paymentMethods} onChange={e => setFormData(p => ({ ...p, paymentMethods: e.target.value }))} /></div>
            </div>

            <h4 className="text-sm font-semibold pt-2">Business Hours</h4>
            <div className="space-y-2">
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">{h.day}</span>
                  <button onClick={() => setHours(prev => prev.map((p, j) => j === i ? { ...p, open: !p.open } : p))}
                    className={`w-10 h-5 rounded-full relative transition-colors ${h.open ? 'bg-primary' : 'bg-border'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.open ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  {h.open && (
                    <>
                      <input type="time" className={`${cls} w-32`} value={h.openTime} onChange={e => setHours(prev => prev.map((p, j) => j === i ? { ...p, openTime: e.target.value } : p))} />
                      <span className="text-muted-foreground">–</span>
                      <input type="time" className={`${cls} w-32`} value={h.closeTime} onChange={e => setHours(prev => prev.map((p, j) => j === i ? { ...p, closeTime: e.target.value } : p))} />
                    </>
                  )}
                  {!h.open && <span className="text-sm text-muted-foreground">Closed</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Business Fields — {category}</h3>
            <p className="text-sm text-muted-foreground">Configure fields specific to the {category} category.</p>
            {categoryFields.map((field, i) => (
              <div key={i}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.name}</label>
                {field.type === 'select' ? (
                  <select className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))}>
                    <option value="">Select...</option>
                    {(Array.isArray(field.options) ? field.options : []).map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : field.type === 'number' ? (
                  <input type="number" className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))} />
                ) : field.type === 'boolean' ? (
                  <button onClick={() => setBoolFields(p => ({ ...p, [field.name]: !p[field.name] }))}
                    className={`w-10 h-5 rounded-full relative transition-colors ${boolFields[field.name] ? 'bg-primary' : 'bg-border'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${boolFields[field.name] ? 'left-5' : 'left-0.5'}`} />
                  </button>
                ) : <input className={cls} value={fieldValues[field.name] || ''} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))} />}
              </div>
            ))}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Documents</h3>
            <p className="text-sm text-muted-foreground">Upload required business documents.</p>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Business Permit</label><FileUpload accept="PDF, JPG, PNG up to 10MB" onFile={f => handleFileUpload(f, result => setUploadedDocs(p => [...p, { ...result, name: f?.name || 'Document' }]))} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Certificates</label><FileUpload accept="PDF, JPG, PNG up to 10MB" onFile={f => handleFileUpload(f, result => setUploadedDocs(p => [...p, { ...result, name: f?.name || 'Certificate' }]))} /></div>
            {uploadedDocs.length > 0 && (
              <div className="space-y-2">
                {uploadedDocs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                    <div className="flex items-center gap-2"><Icon name="description" size={16} className="text-primary" /><span className="text-sm">{doc?.name || `Document ${i + 1}`}</span></div>
                    <button onClick={() => setUploadedDocs(p => p.filter((_, j) => j !== i))} className="p-1 hover:bg-card rounded"><Icon name="close" size={14} className="text-muted-foreground" /></button>
                  </div>
                ))}
              </div>
            )}
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Media</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Logo</label><FileUpload accept="JPG, PNG, SVG" onFile={f => handleFileUpload(f)} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Featured Image</label><FileUpload accept="JPG, PNG" onFile={f => handleFileUpload(f)} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Photos</label>
              <div className="grid grid-cols-4 gap-3">
                <FileUpload compact label="Add Photo" accept="JPG, PNG" onFile={f => handleFileUpload(f, result => setUploadedPhotos(p => [...p, result]))} />
                {uploadedPhotos.map((_, i) => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl relative group">
                    <button onClick={() => setUploadedPhotos(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Review</h3>
            <p className="text-sm text-muted-foreground">Please review all information before saving.</p>
            {[
              ['Business Details', [['Store Name', formData.storeName], ['Category', category], ['Organization', storeData?.organization?.name || 'Independent'], ['City', formData.city], ['Country', formData.country]]],
              ['Contact', [['Email', formData.email], ['Phone', formData.phone]]],
              ['Documents', [['Business Permit', uploadedDocs.length > 0 ? 'Uploaded' : 'Not uploaded'], ['Certificates', 'Not uploaded']]],
              ['Media', [['Logo', 'Not uploaded'], ['Photos', `${uploadedPhotos.length} uploaded`]]],
            ].map(([section, items]) => (
              <div key={section} className="border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-3">{section}</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {items.map(([l, v]) => (
                    <div key={l}><span className="text-xs text-muted-foreground">{l}</span><div className="text-sm font-medium">{v}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Icon name="chevron_left" size={16} /> Previous
        </button>
        {currentStep < steps.length - 1 ? (
          <button onClick={() => setCurrentStep(s => s + 1)}
            className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5">
            Next <Icon name="chevron_right" size={16} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            <Icon name="check" size={16} /> {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        )}
      </div>
    </div>
  )
}
