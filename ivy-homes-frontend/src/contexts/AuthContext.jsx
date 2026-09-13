import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, tokenStorage, api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while checking stored session

  // On mount — restore session from localStorage
  useEffect(() => {
    const storedUser = tokenStorage.getUser()
    const storedToken = tokenStorage.getAccess()
    if (storedUser && storedToken) {
      setUser(storedUser)
      api.defaults.headers['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    // Real API returns: access_token, refresh_token, expires_in (900s = 15min), user
    tokenStorage.set(data.access_token, data.refresh_token, data.user)
    api.defaults.headers['Authorization'] = `Bearer ${data.access_token}`
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    delete api.defaults.headers['Authorization']
  }, [])

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
