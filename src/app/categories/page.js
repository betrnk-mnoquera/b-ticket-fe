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
import { categoryService } from '@/lib/api/services/categoryService'

const filters = ['All', 'Active', 'Inactive']
const iconOptions = ['restaurant', 'shopping_bag', 'devices', 'health_and_safety', 'yard', 'directions_car', 'sports_esports', 'school', 'pets', 'spa', 'fitness_center', 'local_library', 'hotel', 'flight', 'theater_comedy', 'storefront', 'local_cafe', 'brush', 'build', 'celebration']

export default function Categories() {
  const [filter, setFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState('restaurant')
  const [isActive, setIsActive] = useState(true)
  const [formData, setFormData] = useState({ name: '' })
  const [subcategories, setSubcategories] = useState([])
  const [newSubcategory, setNewSubcategory] = useState('')
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
      const response = await categoryService.getAll()
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

  const filtered = filter === 'All' ? categories : categories.filter(c => c.status === filter.toLowerCase())

  const totalSubcategories = categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0)
  const stats = [
    { icon: 'folder_open', label: 'Total Categories', value: String(categories.length) },
    { icon: 'check_circle', label: 'Active', value: String(categories.filter(c => c.status === 'active').length) },
    { icon: 'label', label: 'Total Subcategories', value: String(totalSubcategories) },
    { icon: 'analytics', label: 'Avg. Subcategories', value: categories.length > 0 ? String(Math.round(totalSubcategories / categories.length)) : '0' },
  ]

  const addSubcategory = () => {
    const value = newSubcategory.trim()
    if (value && !subcategories.includes(value)) {
      setSubcategories(prev => [...prev, value])
      setNewSubcategory('')
    }
  }

  const removeSubcategory = (index) => {
    setSubcategories(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubcategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSubcategory()
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setFormData({ name: '' })
    setSubcategories([])
    setNewSubcategory('')
    setSelectedIcon('restaurant')
    setIsActive(true)
    setDrawerOpen(true)
  }

  const openEdit = (cat) => {
    setEditTarget(cat)
    setFormData({ name: cat.name || '' })
    setSubcategories(cat.subcategories || [])
    setNewSubcategory('')
    setSelectedIcon(cat.icon || 'restaurant')
    setIsActive(cat.status === 'active')
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast('Category name is required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        icon: selectedIcon,
        status: isActive ? 'active' : 'inactive',
        subcategories,
      }

      if (editTarget) {
        await categoryService.update(editTarget.id, payload)
        toast('Category updated successfully')
      } else {
        await categoryService.create(payload)
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
      await categoryService.delete(deleteTarget.id)
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
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]}
        title="Categories"
        subtitle="Manage business categories and their subcategories"
        actions={<button onClick={openCreate} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Category</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading ? <CardSkeleton count={4} /> : stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-white/15">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCategories} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="folder_open" size={40} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No categories found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/15 text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.id} className="border-b border-white/15 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                        <Icon name={cat.icon || 'category'} size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">{cat.category_code}</div>
                        {(cat.subcategories || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {cat.subcategories.map((sub, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{sub}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category Name</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Food & Beverage" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
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
              <label className="text-sm font-semibold">Subcategories</label>
              <span className="text-xs text-muted-foreground">{subcategories.length} item{subcategories.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Type subcategory and press Enter"
                value={newSubcategory}
                onChange={e => setNewSubcategory(e.target.value)}
                onKeyDown={handleSubcategoryKeyDown}
              />
              <button onClick={addSubcategory} className="px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90">
                <Icon name="add" size={16} />
              </button>
            </div>

            {subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-foreground">
                    {sub}
                    <button onClick={() => removeSubcategory(i)} className="hover:text-destructive">
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.name} />
    </div>
  )
}
