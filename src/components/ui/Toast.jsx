'use client'
import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import Icon from './Icon'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-toast ${
              toast.type === 'success' ? 'bg-primary text-white' : 'bg-destructive text-white'
            }`}
          >
            <Icon name={toast.type === 'success' ? 'check_circle' : 'error'} size={18} />
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-toast { animation: toastIn 0.3s ease-out; }
      `}</style>
    </ToastContext.Provider>
  )
}
