'use client'
import { useState } from 'react'
import Icon from './Icon'

export default function FilterBar({ filters, activeFilter, onFilterChange, searchPlaceholder = 'Search...', onSearch, dropdowns }) {
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

      {dropdowns && dropdowns.map((dd, i) => (
        <select
          key={i}
          value={dd.value}
          onChange={(e) => dd.onChange(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
        >
          {dd.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

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
