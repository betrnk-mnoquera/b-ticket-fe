'use client'
import { useEffect } from 'react'
import Icon from './Icon'

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  )
}

export function DeleteModal({ open, onClose, onConfirm, entityName, message }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" size={24} className="text-error-fg" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Delete {entityName}?</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {message || `This action cannot be undone. This will permanently delete "${entityName}".`}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-card hover:bg-muted">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium rounded-full bg-destructive text-white hover:opacity-90">
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
