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
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { brochureService } from '@/lib/api/services/brochureService'
import { mediaService } from '@/lib/api/services/mediaService'

const filters = ['All', 'Published', 'Draft', 'For Review', 'Archived']

function mapFilterToStatus(filter) {
  if (filter === 'All') return undefined
  if (filter === 'For Review') return 'for_review'
  return filter.toLowerCase()
}

export default function Brochures() {
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('grid')
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const toast = useToast()

  // API state
  const [brochures, setBrochures] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Form state
  const [formData, setFormData] = useState({})
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const fetchBrochures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        perPage: 10,
        ...(mapFilterToStatus(filter) && { status: mapFilterToStatus(filter) }),
        ...(searchQuery && { search: searchQuery }),
      }
      const res = await brochureService.getBrochures(params)
      setBrochures(res.data || res.items || res)
      setTotalPages(res.meta?.totalPages || res.totalPages || 1)
      setTotalItems(res.meta?.total || res.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load brochures')
    } finally {
      setLoading(false)
    }
  }, [page, filter, searchQuery])

  const fetchStats = useCallback(async () => {
    try {
      const res = await brochureService.getStats()
      setStats([
        { icon: 'menu_book', label: 'Total Brochures', value: (res.totalBrochures ?? 0).toLocaleString() },
        { icon: 'check_circle', label: 'Published', value: (res.published ?? 0).toLocaleString() },
        { icon: 'visibility', label: 'Total Views', value: (res.totalViews ?? 0).toLocaleString() },
        { icon: 'description', label: 'Avg. Pages', value: (res.avgPages ?? 0).toLocaleString() },
      ])
    } catch {
      setStats([
        { icon: 'menu_book', label: 'Total Brochures', value: '—' },
        { icon: 'check_circle', label: 'Published', value: '—' },
        { icon: 'visibility', label: 'Total Views', value: '—' },
        { icon: 'description', label: 'Avg. Pages', value: '—' },
      ])
    }
  }, [])

  useEffect(() => {
    fetchBrochures()
  }, [fetchBrochures])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setPage(1)
  }, [filter, searchQuery])

  const handleFilterChange = (f) => {
    setFilter(f)
  }

  const handleSearch = (q) => {
    setSearchQuery(q)
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      let fileIds = []
      for (const file of uploadedFiles) {
        const uploadRes = await mediaService.upload(file)
        if (uploadRes?.id) fileIds.push(uploadRes.id)
      }
      await brochureService.createBrochure({ ...formData, fileIds })
      setDrawerOpen(false)
      setFormData({})
      setUploadedFiles([])
      toast('Brochure created')
      fetchBrochures()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to create brochure')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await brochureService.deleteBrochure(deleteTarget.id)
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) setSelected(null)
      toast('Brochure deleted')
      fetchBrochures()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to delete brochure')
    } finally {
      setDeleting(false)
    }
  }

  const handlePublish = async (brochure) => {
    try {
      setPublishing(true)
      await brochureService.publish(brochure.id)
      toast('Brochure published')
      fetchBrochures()
      fetchStats()
    } catch (err) {
      toast(err.message || 'Failed to publish brochure')
    } finally {
      setPublishing(false)
    }
  }

  const filtered = brochures

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <Icon name="arrow_back" size={16} /> Back to list
        </button>
        <PageHeader breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Brochures', href: '#' }, { label: selected.title }]} title="" />

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Icon name="menu_book" size={24} className="text-primary" /></div>
              <div>
                <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{selected.title}</h2><StatusBadge status={selected.status} /></div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="store" size={14} /> {selected.organization}</span>
                  <span className="flex items-center gap-1"><Icon name="description" size={14} /> {selected.pages} pages</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.status !== 'published' && (
                <button onClick={() => handlePublish(selected)} disabled={publishing} className="px-4 py-2 text-sm font-medium rounded-full bg-green-600 text-white hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50">
                  <Icon name="publish" size={14} /> {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
              <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="edit" size={14} /> Edit</button>
              <button onClick={() => setDeleteTarget(selected)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-error-bg hover:text-error-fg flex items-center gap-1.5"><Icon name="delete" size={14} /> Delete</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard icon="visibility" label="Total Views" value={(selected.views ?? 0).toLocaleString()} />
          <StatsCard icon="download" label="Downloads" value={(selected.downloads ?? 0).toLocaleString()} />
          <StatsCard icon="schedule" label="Avg. Time" value="3:24" />
          <StatsCard icon="description" label="Pages" value={String(selected.pages)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Brochure Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[['Brochure ID', selected.brochureId], ['Organization', selected.organization], ['Pages', selected.pages], ['File Size', '2.4 MB'], ['Dimensions', 'A4 (210x297mm)'], ['Created', selected.createdAt], ['Updated', selected.updatedAt || '—']].map(([l, v], i) => (
                  <div key={i}><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium mt-0.5">{v}</div></div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Documents</h3>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">PDF</div><div><div className="text-sm font-medium">{selected.title}.pdf</div><div className="text-xs text-muted-foreground">2.4 MB</div></div></div>
                  <div className="flex gap-1"><button className="p-1.5 rounded-lg hover:bg-card"><Icon name="download" size={16} className="text-primary" /></button><button className="p-1.5 rounded-lg hover:bg-card"><Icon name="close" size={16} className="text-muted-foreground" /></button></div>
                </div>
              </div>
              <FileUpload compact label="Upload more files" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Organization</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="store" size={18} className="text-primary" /></div>
                <div><div className="text-sm font-medium">{selected.organization}</div><div className="text-xs text-muted-foreground">Manila, PH</div></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Activity</h3>
              <div className="space-y-3">
                {['Brochure published', 'Content updated', 'New pages added', 'Created'].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div><div className="text-sm">{item}</div><div className="text-xs text-muted-foreground">{i + 1}d ago</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.title} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Brochures' }]}
        title="Brochures"
        subtitle="Manage digital brochures and catalogs"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}><Icon name="grid_view" size={16} /></button>
              <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}><Icon name="view_list" size={16} /></button>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Brochure</button>
          </div>
        }
      />

      {loading && !brochures.length ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => <StatsCard key={i} {...s} />)}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} onSearch={handleSearch} />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchBrochures} />
        ) : loading ? (
          <LoadingSkeleton rows={10} columns={6} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Icon name="menu_book" size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No brochures found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-4 p-4">
            {filtered.map(b => (
              <div key={b.id} className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-36 bg-gradient-to-br from-primary/80 to-secondary/60 relative flex items-center justify-center">
                  <Icon name="menu_book" size={40} className="text-white/50" />
                  <div className="absolute top-2 right-2"><StatusBadge status={b.status} /></div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-sm">{b.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Icon name="description" size={12} /> {b.pages}</span>
                    <span className="flex items-center gap-1"><Icon name="visibility" size={12} /> {(b.views ?? 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Icon name="calendar_today" size={12} /> {b.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted flex items-center gap-1"><Icon name="store" size={10} /> {b.organization}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setSelected(b)} className="p-1 rounded hover:bg-muted"><Icon name="visibility" size={14} className="text-muted-foreground" /></button>
                      {b.status !== 'published' && (
                        <button onClick={() => handlePublish(b)} disabled={publishing} className="p-1 rounded hover:bg-muted"><Icon name="publish" size={14} className="text-green-600" /></button>
                      )}
                      <button onClick={() => setDrawerOpen(true)} className="p-1 rounded hover:bg-muted"><Icon name="edit" size={14} className="text-muted-foreground" /></button>
                      <button onClick={() => setDeleteTarget(b)} className="p-1 rounded hover:bg-muted"><Icon name="delete" size={14} className="text-destructive" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Brochure</th>
              <th className="text-left px-4 py-3 font-medium">Pages</th>
              <th className="text-left px-4 py-3 font-medium">Views</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name="menu_book" size={16} className="text-primary" /></div><div><div className="font-medium">{b.title}</div><div className="text-xs text-muted-foreground">{b.brochureId}</div></div></div></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Icon name="description" size={14} className="text-muted-foreground" /> {b.pages}</span></td>
                  <td className="px-4 py-3">{(b.views ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.createdAt}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <button onClick={() => setSelected(b)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                    {b.status !== 'published' && (
                      <button onClick={() => handlePublish(b)} disabled={publishing} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="publish" size={16} className="text-green-600" /></button>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-border">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={10} onPageChange={setPage} />
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setFormData({}); setUploadedFiles([]) }} title="Add Brochure"
        footer={<>
          <button onClick={() => { setDrawerOpen(false); setFormData({}); setUploadedFiles([]) }} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button>
          <button onClick={handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {creating ? 'Saving...' : 'Save'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <FormField label="Title" value={formData.title || ''} onChange={v => setFormData(p => ({ ...p, title: v }))} />
          <FormField label="Organization" value={formData.organization || ''} onChange={v => setFormData(p => ({ ...p, organization: v }))} />
          <FormField label="Description" textarea value={formData.description || ''} onChange={v => setFormData(p => ({ ...p, description: v }))} />
          <FormField label="Status" select options={['Published', 'Draft', 'Archived']} value={formData.status || ''} onChange={v => setFormData(p => ({ ...p, status: v.toLowerCase() }))} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Published From" type="date" value={formData.publishedFrom || ''} onChange={v => setFormData(p => ({ ...p, publishedFrom: v }))} />
            <FormField label="Published Until" type="date" value={formData.publishedUntil || ''} onChange={v => setFormData(p => ({ ...p, publishedUntil: v }))} />
          </div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Upload Files</label><FileUpload onFile={f => setUploadedFiles(p => [...p, f])} /></div>
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600">PDF</div>
                    <div><div className="text-sm font-medium">{f?.name || `File ${i + 1}`}</div><div className="text-xs text-muted-foreground">{f?.size ? `${(f.size/1024).toFixed(1)} KB` : '—'}</div></div>
                  </div>
                  <button onClick={() => setUploadedFiles(p => p.filter((_, j) => j !== i))} className="p-1 hover:bg-card rounded"><Icon name="close" size={14} className="text-muted-foreground" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.title} />
    </div>
  )
}

function FormField({ label, type = 'text', textarea, select, options = [], value, onChange }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring'
  const handleChange = (e) => onChange?.(e.target.value)
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {textarea ? <textarea className={`${cls} h-20 resize-none`} value={value} onChange={handleChange} /> :
       select ? <select className={cls} value={value} onChange={handleChange}><option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select> :
       <input type={type} className={cls} value={value} onChange={handleChange} />}
    </div>
  )
}
