'use client'
import { api } from './api'
import Cookies from 'js-cookie'
import { createContext, useContext, useState, useEffect, createElement } from 'react'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const str = Cookies.get('usuario')
    if (str) setUsuario(JSON.parse(str))
  }, [])

  async function login(email, senha) {
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

  return createElement(AuthContext.Provider, { value: { usuario, login, logout } }, children)
}

export function useAuth() {
  return useContext(AuthContext)
}
