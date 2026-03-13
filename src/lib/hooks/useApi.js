'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

function isPaginated(data) {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.data) &&
    'currentPage' in data &&
    'lastPage' in data
  )
}

export default function useApi(fetchFn, deps = [], options = {}) {
  const { immediate = true } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const fetchRef = useRef(fetchFn)

  // Keep fetchFn ref current without triggering re-renders
  useEffect(() => {
    fetchRef.current = fetchFn
  }, [fetchFn])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchRef.current()
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'Something went wrong')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Build pagination helpers when response is paginated
  const paginated = isPaginated(data)

  return {
    data,
    loading,
    error,
    refetch,
    // Pagination helpers — only meaningful when response is paginated
    items: paginated ? data.data : data,
    page: paginated ? data.currentPage : 1,
    totalPages: paginated ? data.lastPage : 1,
    total: paginated ? data.total : null,
    perPage: paginated ? data.perPage : null,
  }
}
