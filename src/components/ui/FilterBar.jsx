'use client'
import { useState } from 'react'
import Icon from './Icon'

export default function FilterBar({ filters, activeFilter, onFilterChange, searchPlaceholder = 'Search...', onSearch }) {
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    setSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={handleSearch}
          className="pl-9 pr-4 py-2 text-sm rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring w-56"
        />
      </div>
      <div className="flex items-center gap-1.5">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground border border-border hover:bg-muted'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  )
}
