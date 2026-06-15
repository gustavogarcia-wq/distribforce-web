'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ShoppingCart, Users, AlertTriangle } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default function DashboardPage() {
  const { data: pedidos } = useQuery({
    queryKey: ['pedidos-dashboard'],
    queryFn: () => api.get('/pedidos?limit=100').then(r => r.data),
  })

  const { data: vendedores } = useQuery({
    queryKey: ['vendedores-dashboard'],
    queryFn: () => api.get('/relatorios/vendedores').then(r => r.data),
  })

  const { data: fat } = useQuery({
    queryKey: ['faturamento-dashboard'],
    queryFn: () => api.get('/relatorios/faturamento').then(r => r.data),
  })

  const totalFat = fat?.total ?? 0
  const totalPedidos = pedidos?.total ?? 0
  const pendentesOmie = pedidos?.pedidos?.filter((p: any) => p.status === 'CONFIRMADO').length ?? 0
  const agAprovacao = pedidos?.pedidos?.filter((p: any) => p.status === 'AGUARDANDO_APROVACAO').length ?? 0

  // Agrupar faturamento por dia para o gráfico
  const chartData = fat?.pedidos?.reduce((acc: any[], p: any) => {
    const dia = new Date(p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const existing = acc.find(a => a.dia === dia)
    if (existing) existing.valor += Number(p.total)
    else acc.push({ dia, valor: Number(p.total) })
    return acc
  }, []) ?? []

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Visão geral</h1>
          <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Faturamento do mês</span>
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{fmt(totalFat)}</div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Total de pedidos</span>
              <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                <ShoppingCart size={14} className="text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{totalPedidos}</div>
          </div>

          <div className="card p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-amber-600">Ag. aprovação</span>
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={14} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-amber-700">{agAprovacao}</div>
            <div className="text-xs text-amber-600 mt-1">pedidos aguardando</div>
          </div>

          <div className="card p-4 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-green-600">Prontos p/ Omie</span>
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart size={14} className="text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-green-700">{pendentesOmie}</div>
            <div className="text-xs text-green-600 mt-1">confirmados</div>
          </div>
        </div>

        {/* Gráfico + ranking */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5 col-span-2">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Faturamento do mês</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#378add" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#378add" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="valor" stroke="#378add" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Nenhum dado de faturamento ainda
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Top vendedores</h2>
            {vendedores && vendedores.length > 0 ? (
              <div className="space-y-3">
                {vendedores.slice(0, 5).map((v: any, i: number) => {
                  const fat = v.pedidos?.reduce((s: number, p: any) => s + Number(p.total), 0) ?? 0
                  const meta = v.metas?.[0]?.valorMeta ?? 0
                  const pct = meta > 0 ? Math.min((fat / Number(meta)) * 100, 100) : 0
                  return (
                    <div key={v.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700 flex-shrink-0">
                        {v.usuario.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{v.usuario.nome}</div>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(pct)}%</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">Nenhum vendedor cadastrado</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
