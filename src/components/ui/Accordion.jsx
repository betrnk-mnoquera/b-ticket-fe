'use client'
import { useState } from 'react'
import Icon from './Icon'

export default function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={20} className="text-muted-foreground" />
      </button>
      {open && <div className="px-4 py-4 border-t border-border">{children}</div>}
    </div>
  )
}
