'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Icon from '@/components/ui/Icon'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { useAuth } from '@/lib/auth/AuthContext'
import { couponService } from '@/lib/api/services/couponService'

const statusFilters = ['All', 'Active', 'Inactive', 'Expired']

const filterToStatus = {
  'All': 'all',
  'Active': 'active',
  'Inactive': 'inactive',
  'Expired': 'expired',
}

export default function MerchantCouponsPage() {
  const { organizationId } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const debounceRef = useRef(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, perPage: 10 }
      const status = filterToStatus[activeFilter]
      if (status && status !== 'all') params.status = status
      if (searchQuery) params.search = searchQuery
      if (organizationId) params.organizationId = organizationId

      const data = await couponService.getCoupons(params)
      setCoupons(data.data || [])
      setPagination({
        currentPage: data.currentPage,
        lastPage: data.lastPage,
        total: data.total,
        perPage: data.perPage,
      })
    } catch (err) {
      console.error('Failed to fetch coupons:', err)
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, searchQuery, organizationId])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

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
        title="My Coupons"
        subtitle="Manage your coupon campaigns"
        breadcrumbs={[{ label: 'My Coupons' }]}
      />

      <FilterBar
        filters={statusFilters}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchPlaceholder="Search coupons..."
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : coupons.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Icon name="local_offer" size={48} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No coupons found</h3>
          <p className="text-sm text-muted-foreground">Your coupons will appear here once created.</p>
        </div>
      ) : (
        <>
          <div className="glass-table rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coupon</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validity</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{coupon.name}</div>
                      <div className="text-xs text-muted-foreground">{coupon.code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₱${coupon.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : '—'} — {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={coupon.status} /></td>
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
