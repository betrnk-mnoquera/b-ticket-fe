'use client'

import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Drawer from '@/components/ui/Drawer'
import { DeleteModal } from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { users } from '@/data/mockData'

const stats = [
  { icon: 'group', label: 'Total Users', value: '8' },
  { icon: 'check_circle', label: 'Active Users', value: '7' },
  { icon: 'admin_panel_settings', label: 'Roles in Use', value: '4' },
  { icon: 'calendar_month', label: 'Last Created', value: 'Feb 20' },
]

const filters = ['All', 'Active', 'Inactive']
const roleColors = {
  super_admin: 'bg-success-bg text-success-fg',
  admin: 'bg-blue-50 text-blue-700',
  editor: 'bg-warning-bg text-warning-fg',
  viewer: 'bg-inactive-bg text-inactive-fg',
}
const avatarColors = ['bg-primary/20 text-primary', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-teal-100 text-teal-700']

export default function Users() {
  const [filter, setFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isActive, setIsActive] = useState(true)
  const toast = useToast()

  const filtered = filter === 'All' ? users : users.filter(u => u.status === filter.toLowerCase())

  const openEdit = (user) => { setEditUser(user); setIsActive(user.status === 'active'); setDrawerOpen(true) }
  const openCreate = () => { setEditUser(null); setIsActive(true); setDrawerOpen(true) }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Users' }]}
        title="Users"
        subtitle="Manage admin users and access"
        actions={<button onClick={openCreate} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add User</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <FilterBar filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>
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
            {filtered.map((u, idx) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>{u.initials}</div>
                    <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role]}`}>
                    {u.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{u.lastLogin}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.createdAt}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                  <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editUser ? 'Edit User' : 'Add User'}
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={() => { setDrawerOpen(false); toast(editUser ? 'User updated' : 'User created') }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90">Save</button></>}
      >
        <div className="space-y-4">
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label><input className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={editUser?.name} /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label><input type="email" className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={editUser?.email} /></div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{editUser ? 'New Password' : 'Password'}</label>
            <input type="password" className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
            {editUser && <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current password</p>}
          </div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
            <select className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={editUser?.role}>
              <option value="">Select role...</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
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

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setDeleteTarget(null); toast('User deleted') }} entityName={deleteTarget?.name} />
    </div>
  )
}
