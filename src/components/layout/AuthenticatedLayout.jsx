'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext'
import Sidebar from './Sidebar'
import MerchantSidebar from './MerchantSidebar'
import Icon from '../ui/Icon'

function LayoutContent({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, isMerchant } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, isLoginPage, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return null
  }

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev)

  return (
    <div className="flex min-h-screen">
      {isMerchant
        ? <MerchantSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        : <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      }
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[280px]'} p-8 transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}

export default function AuthenticatedLayout({ children }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  )
}
