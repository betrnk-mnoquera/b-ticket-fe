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
import { roleService } from '@/lib/api/services/roleService'

const filters = ['All', 'Active', 'Inactive']

export default function Roles() {
  const [filter, setFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedPerms, setSelectedPerms] = useState([])
  const [isActive, setIsActive] = useState(true)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const toast = useToast()

  // API state
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await roleService.getRoles()
      const result = response.data || response
      setRoles(result.data || result || [])
    } catch (err) {
      setError(err.message || 'Failed to load roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await roleService.getPermissions()
        const result = response.data || response
        setAllPermissions(result.data || result || [])
      } catch {
        // Silently fail
      }
    }
    fetchPermissions()
  }, [])

  const filtered = filter === 'All' ? roles : roles.filter(r => r.status === filter.toLowerCase())
  const allSelected = allPermissions.length > 0 && selectedPerms.length === allPermissions.length

  const togglePerm = (key) => setSelectedPerms(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])
  const toggleAll = () => setSelectedPerms(allSelected ? [] : allPermissions.map(p => p.key))

  const totalUsers = roles.reduce((acc, r) => acc + (r.users || 0), 0)

  const stats = [
    { icon: 'admin_panel_settings', label: 'Total Roles', value: String(roles.length) },
    { icon: 'check_circle', label: 'Active Roles', value: String(roles.filter(r => r.status === 'active').length) },
    { icon: 'shield', label: 'Total Permissions', value: String(allPermissions.length) },
    { icon: 'group', label: 'Total Users', value: String(totalUsers) },
  ]

  const openCreate = () => {
    setEditTarget(null)
    setFormData({ name: '', description: '' })
    setSelectedPerms([])
    setIsActive(true)
    setDrawerOpen(true)
  }

  const openEdit = (role) => {
    setEditTarget(role)
    setFormData({ name: role.name || '', description: role.description || '' })
    setSelectedPerms((role.permissions || []).map(p => typeof p === 'string' ? p : p.key))
    setIsActive(role.status === 'active')
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        status: isActive ? 'active' : 'inactive',
        permissions: selectedPerms,
      }

      if (editTarget) {
        await roleService.updateRole(editTarget.id, payload)
        toast('Role updated successfully')
      } else {
        await roleService.createRole(payload)
        toast('Role created successfully')
      }
      setDrawerOpen(false)
      fetchRoles()
    } catch (err) {
      toast(err.message || 'Failed to save role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await roleService.deleteRole(deleteTarget.id)
      toast('Role deleted successfully')
      setDeleteTarget(null)
      fetchRoles()
    } catch (err) {
      toast(err.message || 'Failed to delete role')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Roles' }]}
        title="Roles"
        subtitle="Configure roles and permissions"
        actions={<button onClick={openCreate} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Role</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading ? <CardSkeleton count={4} /> : stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRoles} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="admin_panel_settings" size={40} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No roles found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-left px-4 py-3 font-medium">Users</th>
              <th className="text-left px-4 py-3 font-medium">Permissions</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(role => (
                <tr key={role.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (role.color || '#205C50') + '20' }}>
                        <Icon name={role.icon || 'shield'} size={16} style={{ color: role.color || '#205C50' }} />
                      </div>
                      <div><div className="font-medium">{role.name}</div><div className="text-xs text-muted-foreground">{role.roleId}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-48 truncate">{role.description}</td>
                  <td className="px-4 py-3 font-medium">{role.users || 0}</td>
                  <td className="px-4 py-3">
                    {(role.permissions || []).length === allPermissions.length && allPermissions.length > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success-fg font-medium">Full Access</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).map(p => {
                          const permKey = typeof p === 'string' ? p : p.key
                          const perm = allPermissions.find(ap => ap.key === permKey)
                          return <span key={permKey} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                            <Icon name={perm?.icon || p?.icon || 'circle'} size={10} /> {permKey}
                          </span>
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={role.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                    <button onClick={() => setDeleteTarget(role)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editTarget ? 'Edit Role' : 'Add Role'}
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button></>}
      >
        <div className="space-y-5">
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role Name</label><input className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label><textarea className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Status</label>
            <button onClick={() => setIsActive(!isActive)} className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Permissions</label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-border text-primary focus:ring-ring" />
                Select All
              </label>
            </div>
            <div className="space-y-2">
              {allPermissions.map(perm => (
                <label key={perm.key} onClick={() => togglePerm(perm.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedPerms.includes(perm.key) ? 'bg-success-bg' : 'bg-muted/50 hover:bg-muted'}`}>
                  <input type="checkbox" checked={selectedPerms.includes(perm.key)} onChange={() => togglePerm(perm.key)} className="rounded border-border text-primary focus:ring-ring" />
                  <Icon name={perm.icon} size={18} className={selectedPerms.includes(perm.key) ? 'text-primary' : 'text-muted-foreground'} />
                  <div><div className="text-sm font-medium">{perm.key}</div><div className="text-xs text-muted-foreground">{perm.description}</div></div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget?.name}
        message={deleteTarget ? `This will remove the "${deleteTarget.name}" role and affect ${deleteTarget.users || 0} assigned user(s).` : ''}
      />
    </div>
  )
}
