'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Drawer from '@/components/ui/Drawer'
import { DeleteModal } from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { lineOfBusinessService } from '@/lib/api/services/lineOfBusinessService'

const filters = ['All', 'Active', 'Inactive']
const fieldIcons = { text: 'text_fields', select: 'list', number: 'tag', boolean: 'toggle_on' }
const iconOptions = ['restaurant', 'shopping_bag', 'devices', 'health_and_safety', 'yard', 'directions_car', 'sports_esports', 'school', 'pets', 'spa', 'fitness_center', 'local_library', 'hotel', 'flight', 'theater_comedy']

const categoryPresets = {
  'Food & Beverage': {
    icon: 'restaurant',
    subcategories: ['Japanese', 'Korean', 'Chinese', 'Asian', 'Western', 'Filipino', 'Cafés & Dessert', 'Bars & Nightlife', 'Fast Food', 'Catering'],
  },
  'Wellness & Beauty': {
    icon: 'spa',
    subcategories: ['Spas & Massage', 'Hair & Nail Salons', 'Lash & Brow Studios', 'Aesthetics & Skincare', 'Sauna & Wellness Centers'],
  },
  'Services': {
    icon: 'devices',
    subcategories: ['Auto Services', 'Pet Services', 'Laundry & Cleaning', 'Repair & Maintenance', 'Event Services'],
  },
  'Entertainment & Leisure': {
    icon: 'theater_comedy',
    subcategories: ['Karaoke / KTV', 'Sports & Games', 'Attractions & Theme Parks', 'Activity & Event Venues'],
  },
  'Fitness & Sports': {
    icon: 'fitness_center',
    subcategories: ['Gyms & Training Studios', 'Yoga & Pilates', 'Dance & Movement', 'Sports Clubs'],
  },
  'Hotels & Stays': {
    icon: 'hotel',
    subcategories: ['Hotels & Resorts', 'Boutique & Lifestyle Hotels', 'Serviced Apartments', 'Villas', 'Hostels', 'Staycation Packages'],
  },
  'Academy & Learning': {
    icon: 'school',
    subcategories: ['Language & Academic Education', 'Music & Dance', 'Art & Creative Workshops', 'Cooking & Lifestyle Classes', 'Certification & Test Prep', 'Kids Learning Programs'],
  },
  'Travel & Experiences': {
    icon: 'flight',
    subcategories: ['Tours & Travel Packages', 'Transport Services', 'Vehicle Rentals', 'Adventure & Outdoor Activities', 'City & Attraction Passes'],
  },
}

const categoryOptions = Object.keys(categoryPresets)

export default function LineOfBusiness() {
  const [filter, setFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState('restaurant')
  const [fields, setFields] = useState([{ name: '', type: 'text', options: '' }])
  const [isActive, setIsActive] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '' })
  const toast = useToast()

  // API state
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await lineOfBusinessService.getAll()
      const result = response.data || response
      setCategories(result.data || result || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filtered = filter === 'All' ? categories : categories.filter(l => l.status === filter.toLowerCase())

  const stats = [
    { icon: 'category', label: 'Total Line of Business', value: String(categories.length) },
    { icon: 'store', label: 'Total Stores', value: String(categories.reduce((acc, c) => acc + (c.stores || 0), 0)) },
    { icon: 'trending_up', label: 'Most Popular', value: categories.length > 0 ? [...categories].sort((a, b) => (b.stores || 0) - (a.stores || 0))[0]?.name || '-' : '-' },
    { icon: 'analytics', label: 'Avg. Stores/Category', value: categories.length > 0 ? String(Math.round(categories.reduce((acc, c) => acc + (c.stores || 0), 0) / categories.length)) : '0' },
  ]

  const addField = () => setFields(p => [...p, { name: '', type: 'text', options: '' }])
  const removeField = (i) => setFields(p => p.filter((_, j) => j !== i))
  const updateField = (i, key, val) => setFields(p => p.map((f, j) => j === i ? { ...f, [key]: val } : f))

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName)
    if (catName && categoryPresets[catName]) {
      const preset = categoryPresets[catName]
      setFormData(p => ({ ...p, name: catName }))
      setSelectedIcon(preset.icon)
      setFields([
        { name: 'Subcategory', type: 'select', options: preset.subcategories.join(', ') },
      ])
    } else {
      setFields([{ name: '', type: 'text', options: '' }])
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setSelectedCategory('')
    setFormData({ name: '', description: '' })
    setFields([{ name: '', type: 'text', options: '' }])
    setSelectedIcon('restaurant')
    setIsActive(true)
    setDrawerOpen(true)
  }

  const openEdit = (cat) => {
    setEditTarget(cat)
    setFormData({ name: cat.name || '', description: cat.description || '' })
    setSelectedCategory(categoryPresets[cat.name] ? cat.name : '')
    setFields(cat.fields?.length > 0 ? cat.fields.map(f => ({
      name: f.name || '',
      type: f.type || 'text',
      options: f.type === 'select' ? (Array.isArray(f.options) ? f.options.join(', ') : f.options || '') : '',
    })) : [{ name: '', type: 'text', options: '' }])
    setSelectedIcon(cat.icon || 'restaurant')
    setIsActive(cat.status === 'active')
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: selectedIcon,
        status: isActive ? 'active' : 'inactive',
        fields: fields.filter(f => f.name.trim()).map(f => ({
          name: f.name,
          type: f.type,
          ...(f.type === 'select' ? { options: f.options.split(',').map(o => o.trim()).filter(Boolean) } : {}),
        })),
      }

      if (editTarget) {
        await lineOfBusinessService.update(editTarget.id, payload)
        toast('Category updated successfully')
      } else {
        await lineOfBusinessService.create(payload)
        toast('Category created successfully')
      }
      setDrawerOpen(false)
      fetchCategories()
    } catch (err) {
      toast(err.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await lineOfBusinessService.delete(deleteTarget.id)
      toast('Category deleted successfully')
      setDeleteTarget(null)
      fetchCategories()
    } catch (err) {
      toast(err.message || 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Line of Business' }]}
        title="Line of Business"
        subtitle="Manage store categories and business fields"
        actions={<button onClick={openCreate} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Category</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading ? <CardSkeleton count={4} /> : stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCategories} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="category" size={40} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No categories found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Stores</th>
              <th className="text-left px-4 py-3 font-medium">Fields</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (cat.color || '#205C50') + '20' }}>
                        <Icon name={cat.icon} size={16} style={{ color: cat.color || '#205C50' }} />
                      </div>
                      <div><div className="font-medium">{cat.name}</div><div className="text-xs text-muted-foreground">{cat.categoryId}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{cat.stores || 0}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      {(cat.fields || []).map((f, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-1.5">
                            <Icon name={fieldIcons[f.type]} size={12} className="text-muted-foreground" />
                            <span className="text-xs font-medium">{f.name}</span>
                            <span className="text-[10px] text-muted-foreground">({f.type})</span>
                          </div>
                          {f.type === 'select' && f.options && (
                            <div className="flex flex-wrap gap-1 mt-0.5 ml-4">
                              {(Array.isArray(f.options) ? f.options : []).map((opt, j) => (
                                <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{opt}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editTarget ? 'Edit Category' : 'Add Category'} width="w-[560px]"
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button></>}
      >
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <select className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={selectedCategory} onChange={e => handleCategorySelect(e.target.value)}>
              <option value="">Select a category</option>
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Selecting a category auto-fills subcategories and icon</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category Name</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Status</label>
            <button onClick={() => setIsActive(!isActive)} className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map(ic => (
                <button key={ic} onClick={() => setSelectedIcon(ic)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedIcon === ic ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                  <Icon name={ic} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Business Fields</label>
              <span className="text-xs text-muted-foreground">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={f.name} onChange={e => updateField(i, 'name', e.target.value)} placeholder="Field name"
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                    <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="text">Text</option><option value="select">Select</option><option value="number">Number</option><option value="boolean">Boolean</option>
                    </select>
                    <button onClick={() => removeField(i)} className="p-1 rounded hover:bg-error-bg"><Icon name="close" size={16} className="text-destructive" /></button>
                  </div>
                  {f.type === 'select' && (
                    <input value={f.options} onChange={e => updateField(i, 'options', e.target.value)} placeholder="Options (comma-separated)"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                  )}
                </div>
              ))}
            </div>
            <button onClick={addField} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Icon name="add_circle" size={16} /> Add Field
            </button>
          </div>
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.name} />
    </div>
  )
}
