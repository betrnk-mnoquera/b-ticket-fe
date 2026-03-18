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
import { useToast } from '@/components/ui/Toast'
import LoadingSkeleton, { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import { userService } from '@/lib/api/services/userService'
import { roleService } from '@/lib/api/services/roleService'

const ITEMS_PER_PAGE = 10

const filters = ['All', 'Active', 'Inactive']
const filterToStatus = {
  'All': undefined,
  'Active': 'active',
  'Inactive': 'inactive',
}

const roleColors = {
  super_admin: 'bg-success-bg text-success-fg',
  admin: 'bg-blue-50 text-blue-700',
  editor: 'bg-warning-bg text-warning-fg',
  viewer: 'bg-inactive-bg text-inactive-fg',
}
const avatarColors = ['bg-primary/20 text-primary', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-teal-100 text-teal-700']

export default function Users() {
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isActive, setIsActive] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', roleId: '' })
  const toast = useToast()

  // API state
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [statsData, setStatsData] = useState(null)
  const [rolesList, setRolesList] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const debounceRef = useRef(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, perPage: ITEMS_PER_PAGE }
      const status = filterToStatus[filter]
      if (status) params.status = status
      if (searchQuery) params.search = searchQuery

      const response = await userService.getUsers(params)
      const result = response.data || response

      setUsers(result.data || [])
      setTotalPages(result.lastPage || 1)
      setTotalItems(result.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [page, filter, searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Fetch stats and roles for dropdown
  useEffect(() => {
    const fetchSupportData = async () => {
      try {
        const [statsRes, rolesRes] = await Promise.all([
          userService.getStats(),
          roleService.getRoles(),
        ])
        const statsResult = statsRes.data || statsRes
        setStatsData(statsResult)
        const rolesResult = rolesRes.data || rolesRes
        setRolesList(rolesResult.data || rolesResult || [])
      } catch {
        // Silently fail
      }
    }
    fetchSupportData()
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

  const openEdit = (user) => {
    setEditUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      roleId: user.role?.id || user.roleId || '',
    })
    setIsActive(user.status === 'active')
    setDrawerOpen(true)
  }

  const openCreate = () => {
    setEditUser(null)
    setFormData({ name: '', email: '', password: '', roleId: '' })
    setIsActive(true)
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        status: isActive ? 'active' : 'inactive',
      }
      if (formData.password) payload.password = formData.password

      if (editUser) {
        await userService.updateUser(editUser.id, payload)
        toast('User updated successfully')
      } else {
        await userService.createUser(payload)
        toast('User created successfully')
      }
      setDrawerOpen(false)
      fetchUsers()
    } catch (err) {
      toast(err.message || 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await userService.deleteUser(deleteTarget.id)
      toast('User deleted successfully')
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      toast(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleSlug = (user) => {
    const roleName = user.role?.name || ''
    return roleName.toLowerCase().replace(/\s+/g, '_')
  }

  const getRoleDisplayName = (user) => {
    return user.role?.name || '-'
  }

  const stats = [
    { icon: 'group', label: 'Total Users', value: String(statsData?.totalUsers ?? totalItems) },
    { icon: 'check_circle', label: 'Active Users', value: String(statsData?.activeUsers ?? '-') },
    { icon: 'admin_panel_settings', label: 'Roles in Use', value: String(statsData?.rolesInUse ?? rolesList.length) },
    { icon: 'calendar_month', label: 'Last Created', value: statsData?.lastCreated || '-' },
  ]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Users' }]}
        title="Users"
        subtitle="Manage admin users and access"
        actions={<button onClick={openCreate} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add User</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading && !users.length ? <CardSkeleton count={4} /> : stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={handleFilterChange} onSearch={handleSearch} />
        </div>

        {loading ? (
          <LoadingSkeleton rows={ITEMS_PER_PAGE} columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="group" size={40} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Last Login</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u, idx) => {
                  const roleSlug = getRoleSlug(u)
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>{u.initials || getInitials(u.name)}</div>
                          <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[roleSlug] || 'bg-muted text-muted-foreground'}`}>
                          {getRoleDisplayName(u)}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{u.lastLoginAt || u.lastLogin || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.createdAt || '-'}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-muted"><Icon name="visibility" size={16} className="text-muted-foreground" /></button>
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                        <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border">
              <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editUser ? 'Edit User' : 'Add User'}
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button></>}
      >
        <div className="space-y-4">
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label><input className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label><input type="email" className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{editUser ? 'New Password' : 'Password'}</label>
            <input type="password" className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
            {editUser && <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current password</p>}
          </div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
            <select className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" value={formData.roleId} onChange={e => setFormData(p => ({ ...p, roleId: e.target.value }))}>
              <option value="">Select role...</option>
              {rolesList.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Status</label>
            <button onClick={() => setIsActive(!isActive)} className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </Drawer>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} entityName={deleteTarget?.name} />
    </div>
  )
}
