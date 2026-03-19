'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Drawer from '@/components/ui/Drawer'
import { DeleteModal } from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth/AuthContext'
import { userService } from '@/lib/api/services/userService'
import { roleService } from '@/lib/api/services/roleService'

const statusFilters = ['All', 'Active', 'Inactive']

const filterToStatus = {
  'All': 'all',
  'Active': 'active',
  'Inactive': 'inactive',
}

const emptyForm = { name: '', email: '', password: '', roleId: '', status: 'active' }

export default function MerchantStaffPage() {
  const { organizationId } = useAuth()
  const toast = useToast()
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null })
  const debounceRef = useRef(null)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, perPage: 10, userType: 'merchant' }
      const status = filterToStatus[activeFilter]
      if (status && status !== 'all') params.status = status
      if (searchQuery) params.search = searchQuery

      const data = await userService.getUsers(params)
      // Filter by organization on client side as well
      const allStaff = data.data || []
      const filtered = organizationId
        ? allStaff.filter(u => u.organizationId === organizationId)
        : allStaff
      setStaff(filtered)
      setPagination({
        currentPage: data.currentPage,
        lastPage: data.lastPage,
        total: data.total,
        perPage: data.perPage,
      })
    } catch (err) {
      console.error('Failed to fetch staff:', err)
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, searchQuery, organizationId])

  const fetchRoles = useCallback(async () => {
    try {
      const data = await roleService.getRoles({ perPage: 100 })
      const merchantRoles = (data.data || []).filter(r =>
        r.name === 'Merchant Owner' || r.name === 'Merchant Staff'
      )
      setRoles(merchantRoles)
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])
  useEffect(() => { fetchRoles() }, [fetchRoles])

  const handleSearch = (value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
      setPage(1)
    }, 400)
  }

  const handleFilterChange = (key) => {
    setActiveFilter(key)
    setPage(1)
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormData(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId || user.role?.id || '',
      status: user.status,
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...formData,
        userType: 'merchant',
        organizationId,
      }
      if (!payload.password) delete payload.password

      if (editingUser) {
        await userService.updateUser(editingUser.id, payload)
        toast.success('Staff member updated')
      } else {
        await userService.createUser(payload)
        toast.success('Staff member created')
      }
      setDrawerOpen(false)
      fetchStaff()
    } catch (err) {
      toast.error(err.message || 'Failed to save staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await userService.deleteUser(deleteModal.user.id)
      toast.success('Staff member deleted')
      setDeleteModal({ open: false, user: null })
      fetchStaff()
    } catch (err) {
      toast.error(err.message || 'Failed to delete staff member')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Staff"
        subtitle="Manage your merchant team members"
        breadcrumbs={[{ label: 'My Staff' }]}
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Icon name="person_add" size={18} />
            Add Staff
          </button>
        }
      />

      <FilterBar
        filters={statusFilters}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchPlaceholder="Search staff..."
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : staff.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Icon name="badge" size={48} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No staff members found</h3>
          <p className="text-sm text-muted-foreground">Add staff members to help manage your stores.</p>
        </div>
      ) : (
        <>
          <div className="glass-table rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {member.initials || member.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{member.role?.name || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={member.status} /></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(member)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                          <Icon name="edit" size={16} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteModal({ open: true, user: member })} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <Icon name="delete" size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.lastPage > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.lastPage}
              totalItems={pagination.total}
              itemsPerPage={pagination.perPage}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Create/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
        footer={
          <div className="flex items-center gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password {editingUser && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder={editingUser ? '••••••••' : 'Enter password'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, status: 'active' }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-muted text-muted-foreground'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.status === 'inactive' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-muted text-muted-foreground'}`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation */}
      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDelete}
        entityName={deleteModal.user?.name}
        message="This will permanently remove this staff member's access."
      />
    </div>
  )
}
