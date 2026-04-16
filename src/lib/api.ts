import axios from 'axios'
import Cookies from 'js-cookie'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  timeout: 15000,
})

// Injeta o token em toda requisição
api.interceptors.request.use(config => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redireciona para login se 401
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
