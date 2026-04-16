'use client'
import { api } from './api'
import Cookies from 'js-cookie'
import { createContext, useContext, useState, useEffect, createElement } from 'react'

interface AuthContextType {
  usuario: any
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({ usuario: null, loading: true, login: async () => {}, logout: () => {} })

export function AuthProvider({ children }: { children: any }) {
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const str = Cookies.get('usuario')
    if (str) setUsuario(JSON.parse(str))
    setLoading(false)
  }, [])

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha })
    Cookies.set('access_token', data.accessToken, { expires: 7 })
    Cookies.set('refresh_token', data.refreshToken, { expires: 30 })
    Cookies.set('usuario', JSON.stringify(data.usuario), { expires: 7 })
    setUsuario(data.usuario)
  }

  function logout() {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('usuario')
    setUsuario(null)
  }

  return createElement(AuthContext.Provider, { value: { usuario, loading, login, logout } }, children)
}

export function useAuth() {
  return useContext(AuthContext)
}
