'use client'

import { useAuth } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, ShoppingCart, Users, Building2,
  Target, BarChart2, Settings, LogOut, Package, Tag, Gift
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/pedidos',        label: 'Pedidos',          icon: ShoppingCart },
  { href: '/vendedores',     label: 'Vendedores',       icon: Users },
  { href: '/clientes',       label: 'Clientes',         icon: Building2 },
  { href: '/produtos',       label: 'Produtos',         icon: Package },
  { href: '/tabelas',        label: 'Tabelas de preço', icon: Tag },
  { href: '/combos',         label: 'Combos',           icon: Gift },
  { href: '/metas',          label: 'Metas',            icon: Target },
  { href: '/relatorios',     label: 'Relatórios',       icon: BarChart2 },
  { href: '/configuracoes',  label: 'Configurações',    icon: Settings },
]

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !usuario) router.push('/login')
  }, [usuario, loading, router])

  if (loading || !usuario) return (
    <div className="min-h-screen flex items-center justify-center">
      <svg className="animate-spin w-6 h-6 text-brand-600" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/>
      </svg>
    </div>
  )

  const initials = usuario.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="white"/>
                <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.7"/>
                <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.7"/>
                <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.4"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">DistribForce</div>
              <div className="text-xs text-gray-400">Painel do gestor</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{usuario.nome}</div>
              <div className="text-xs text-gray-400 truncate">{usuario.perfil.toLowerCase()}</div>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
