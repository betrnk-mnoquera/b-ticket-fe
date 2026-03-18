'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/api/services/authService'
import { getToken, setToken, clearToken } from '@/lib/api/token'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const fetchUser = useCallback(async () => {
    try {
      const data = await authService.me()
      setUser(data.user)
      setPermissions(data.user?.role?.permissions?.map(p => p.key) ?? [])
    } catch {
      setUser(null)
      setPermissions([])
      clearToken()
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (token) {
      fetchUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [fetchUser])

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password })
    setToken(data.token)
    setUser(data.user)
    setPermissions(data.user?.role?.permissions?.map(p => p.key) ?? [])
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // proceed with local cleanup even if the API call fails
    } finally {
      setUser(null)
      setPermissions([])
      clearToken()
      router.push('/login')
    }
  }, [router])

  const isSuperAdmin = user?.role?.name === 'Super Admin'
  const organizationId = user?.organizationId || null

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated, isLoading, isSuperAdmin, organizationId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
