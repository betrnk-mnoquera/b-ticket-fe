'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Icon from '@/components/ui/Icon'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { useAuth } from '@/lib/auth/AuthContext'
import { productService } from '@/lib/api/services/productService'

const statusFilters = ['All', 'Active', 'Inactive']

const filterToStatus = {
  'All': 'all',
  'Active': 'active',
  'Inactive': 'inactive',
}

export default function MerchantProductsPage() {
  const { organizationId } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const debounceRef = useRef(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, perPage: 10 }
      const status = filterToStatus[activeFilter]
      if (status && status !== 'all') params.status = status
      if (searchQuery) params.search = searchQuery
      if (organizationId) params.organizationId = organizationId

      const data = await productService.getProducts(params)
      setProducts(data.data || [])
      setPagination({
        currentPage: data.currentPage,
        lastPage: data.lastPage,
        total: data.total,
        perPage: data.perPage,
      })
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, searchQuery, organizationId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

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
        title="Products"
        subtitle="Manage your store products"
        breadcrumbs={[{ label: 'Products' }]}
      />

      <FilterBar
        filters={statusFilters}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchPlaceholder="Search products..."
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Icon name="inventory_2" size={48} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground">Your products will appear here once created.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.productId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{product.category || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">₱{Number(product.price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
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
