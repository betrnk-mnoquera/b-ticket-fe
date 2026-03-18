'use client'
import { useState, createContext, useContext } from 'react'
import Icon from './Icon'

const AccordionGroupContext = createContext(null)

export function AccordionGroup({ children, defaultOpen = null }) {
  const [openId, setOpenId] = useState(defaultOpen)

  const toggle = (id) => {
    setOpenId(prev => prev === id ? null : id)
  }

  return (
    <AccordionGroupContext.Provider value={{ openId, toggle }}>
      <div className="space-y-3">{children}</div>
    </AccordionGroupContext.Provider>
  )
}

export default function Accordion({ title, id, defaultOpen = false, icon, subtitle, children }) {
  const group = useContext(AccordionGroupContext)
  const [localOpen, setLocalOpen] = useState(defaultOpen)

  const isOpen = group ? group.openId === (id || title) : localOpen

  const handleToggle = () => {
    if (group) {
      group.toggle(id || title)
    } else {
      setLocalOpen(!localOpen)
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 text-left"
      >
        <div className="flex items-center gap-2.5">
          {icon && <Icon name={icon} size={18} className="text-primary" />}
          <div>
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={20} className="text-muted-foreground" />
      </button>
      {isOpen && <div className="px-4 py-4 border-t border-border">{children}</div>}
    </div>
  )
}
