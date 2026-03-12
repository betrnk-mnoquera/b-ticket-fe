'use client'
import { useRef } from 'react'
import Icon from './Icon'

export default function FileUpload({ label, accept, onFile, compact = false }) {
  const ref = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) onFile?.(e.dataTransfer.files[0])
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors ${
        compact ? 'p-4' : 'p-8'
      }`}
    >
      <Icon name="cloud_upload" size={compact ? 24 : 32} className="text-muted-foreground mb-2" />
      <p className="text-sm font-medium text-foreground">{label || 'Click or drag to upload'}</p>
      <p className="text-xs text-muted-foreground mt-1">{accept || 'PDF, JPG, PNG up to 10MB'}</p>
      <input ref={ref} type="file" className="hidden" onChange={(e) => onFile?.(e.target.files[0])} />
    </div>
  )
}
