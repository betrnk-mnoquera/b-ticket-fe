'use client'
import Icon from './Icon'

export default function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)

  const getPages = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 text-xs rounded-xl glass-button text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="chevron_left" size={14} />
        </button>
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`e${i}`} className="px-2 text-xs text-muted-foreground">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-xs rounded-xl font-medium transition-all duration-200 ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'glass-button text-muted-foreground'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 text-xs rounded-xl glass-button text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="chevron_right" size={14} />
        </button>
      </div>
    </div>
  )
}
