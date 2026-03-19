'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Icon from '@/components/ui/Icon'
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { useAuth } from '@/lib/auth/AuthContext'
import { storeService } from '@/lib/api/services/storeService'

const statusFilters = ['All', 'Verified', 'Pending', 'For Review', 'Declined']

const filterToStatus = {
  'All': 'all',
  'Verified': 'verified',
  'Pending': 'pending',
  'For Review': 'for_review',
  'Declined': 'declined',
}

export default function MerchantStoresPage() {
  const { organizationId } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const debounceRef = useRef(null)

  const fetchStores = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, perPage: 10 }
      const status = filterToStatus[activeFilter]
      if (status && status !== 'all') params.status = status
      if (searchQuery) params.search = searchQuery
      if (organizationId) params.organizationId = organizationId

      const data = await storeService.getStores(params)
      setStores(data.data || [])
      setPagination({
        currentPage: data.currentPage,
        lastPage: data.lastPage,
        total: data.total,
        perPage: data.perPage,
      })
    } catch (err) {
      console.error('Failed to fetch stores:', err)
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, searchQuery, organizationId])

  useEffect(() => { fetchStores() }, [fetchStores])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Stores"
        subtitle="Manage your store locations and details"
        breadcrumbs={[{ label: 'My Stores' }]}
      />

      <FilterBar
        filters={statusFilters}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchPlaceholder="Search stores..."
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : stores.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Icon name="storefront" size={48} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No stores found</h3>
          <p className="text-sm text-muted-foreground">Your stores will appear here once they are created.</p>
        </div>
      ) : (
        <>
          <div className="glass-table rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Store</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{store.storeName}</div>
                      <div className="text-xs text-muted-foreground">{store.storeId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{store.storeType || '—'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{store.address || '—'}, {store.city || ''}</td>
                    <td className="px-6 py-4"><StatusBadge status={store.status} /></td>
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
    </div>
  )
}
