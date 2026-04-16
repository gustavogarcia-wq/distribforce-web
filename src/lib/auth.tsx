'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  vendedorId?: string
}

interface AuthContextType {
  usuario: Usuario | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('access_token')
    const userData = localStorage.getItem('usuario')
    if (token && userData) {
      setUsuario(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha })
    Cookies.set('access_token', data.accessToken, { expires: 1 })
    Cookies.set('refresh_token', data.refreshToken, { expires: 30 })
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
  }

  function logout() {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
