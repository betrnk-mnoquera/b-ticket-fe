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
import { roles, allPermissions } from '@/data/mockData'

const stats = [
  { icon: 'admin_panel_settings', label: 'Total Roles', value: '4' },
  { icon: 'check_circle', label: 'Active Roles', value: '4' },
  { icon: 'shield', label: 'Total Permissions', value: '9' },
  { icon: 'group', label: 'Total Users', value: '8' },
]

const filters = ['All', 'Active', 'Inactive']

export default function Roles() {
  const [filter, setFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedPerms, setSelectedPerms] = useState([])
  const [isActive, setIsActive] = useState(true)
  const toast = useToast()

  const filtered = filter === 'All' ? roles : roles.filter(r => r.status === filter.toLowerCase())
  const allSelected = selectedPerms.length === allPermissions.length

  const togglePerm = (key) => setSelectedPerms(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])
  const toggleAll = () => setSelectedPerms(allSelected ? [] : allPermissions.map(p => p.key))

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Roles' }]}
        title="Roles"
        subtitle="Configure roles and permissions"
        actions={<button onClick={() => { setDrawerOpen(true); setSelectedPerms([]) }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"><Icon name="add" size={16} /> Add Role</button>}
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: role.color + '20' }}>
                      <Icon name={role.icon} size={16} style={{ color: role.color }} />
                    </div>
                    <div><div className="font-medium">{role.name}</div><div className="text-xs text-muted-foreground">{role.roleId}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-48 truncate">{role.description}</td>
                <td className="px-4 py-3 font-medium">{role.users}</td>
                <td className="px-4 py-3">
                  {role.permissions.length === 9 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success-fg font-medium">Full Access</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(p => {
                        const perm = allPermissions.find(ap => ap.key === p)
                        return <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                          <Icon name={perm?.icon || 'circle'} size={10} /> {p}
                        </span>
                      })}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3"><StatusBadge status={role.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => { setDrawerOpen(true); setSelectedPerms(role.permissions) }} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="edit" size={16} className="text-muted-foreground" /></button>
                  <button onClick={() => setDeleteTarget(role)} className="p-1.5 rounded-lg hover:bg-muted"><Icon name="delete" size={16} className="text-destructive" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Role"
        footer={<><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted">Cancel</button><button onClick={() => { setDrawerOpen(false); toast('Role saved') }} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90">Save</button></>}
      >
        <div className="space-y-5">
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role Name</label><input className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label><textarea className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none" /></div>
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
        onConfirm={() => { setDeleteTarget(null); toast('Role deleted') }}
        entityName={deleteTarget?.name}
        message={deleteTarget ? `This will remove the "${deleteTarget.name}" role and affect ${deleteTarget.users} assigned user(s).` : ''}
      />
    </div>
  )
}
