'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, ShoppingCart, Receipt, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

// ─── helpers ───────────────────────────────────────────────────────────────
function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
function fmtNum(v: number) {
  return v.toLocaleString('pt-BR')
}

// cores do funil por status
const STATUS_COR: Record<string, string> = {
  ORCAMENTO: '#94a3b8',            // cinza
  AGUARDANDO_APROVACAO: '#f59e0b', // âmbar
  CONFIRMADO: '#378add',           // brand
  FATURADO: '#22c55e',             // verde
}
const STATUS_BG: Record<string, string> = {
  ORCAMENTO: '#f1f5f9',
  AGUARDANDO_APROVACAO: '#fef3c7',
  CONFIRMADO: '#e6f1fb',
  FATURADO: '#dcfce7',
}

// chip de variação vs mês anterior (esconde quando não faz sentido)
function Delta({ valor, base }: { valor: number | null; base: number }) {
  if (valor === null || base === 0) return null
  const sobe = valor >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${sobe ? 'text-green-600' : 'text-red-500'}`}>
      {sobe ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(valor)}%
    </span>
  )
}

// ─── página ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  })

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Carregando métricas…</div>
  }
  if (isError || !data) {
    return <div className="flex-1 flex items-center justify-center text-sm text-red-500">Não foi possível carregar o dashboard.</div>
  }

  const k = data.kpis
  const individual = data.escopo === 'INDIVIDUAL'
  const totalFunil = data.porStatus.reduce((s: number, x: any) => s + x.qtd, 0)
  const maxDia = Math.max(1, ...data.porDia.map((d: any) => d.pedidos))
  const semMovimento = totalFunil === 0

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            {individual ? 'Meu desempenho' : 'Visão geral'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{individual ? 'Meus pedidos no mês' : 'Pedidos no mês'}</span>
              <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                <ShoppingCart size={14} className="text-brand-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-semibold text-gray-900">{fmtNum(k.pedidosMes)}</div>
              <Delta valor={k.pedidosDelta} base={k.pedidosMes} />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{individual ? 'Meu faturamento' : 'Faturamento no mês'}</span>
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-green-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-semibold text-gray-900">{fmtMoeda(k.faturamentoMes)}</div>
              <Delta valor={k.faturamentoDelta} base={k.faturamentoMes} />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Ticket médio</span>
              <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                <Receipt size={14} className="text-purple-600" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-semibold text-gray-900">{fmtMoeda(k.ticketMedio)}</div>
              <Delta valor={k.ticketDelta} base={k.ticketMedio} />
            </div>
          </div>

          <div className="card p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-amber-600">Aguardando aprovação</span>
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={14} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-amber-700">{fmtNum(k.aguardandoAprovacao)}</div>
            <div className="text-xs text-amber-600 mt-1">pedidos parados</div>
          </div>
        </div>

        {/* Funil + tendência */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Funil por status */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Pedidos por status</h2>
              <span className="text-xs text-gray-400">{fmtNum(totalFunil)} no total</span>
            </div>
            <div className="space-y-3">
              {data.porStatus.map((s: any) => {
                const pct = totalFunil ? Math.round((s.qtd / totalFunil) * 100) : 0
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700">{s.label}</span>
                      <span className="text-xs text-gray-500">{fmtNum(s.qtd)} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: STATUS_BG[s.status] }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STATUS_COR[s.status] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pedidos por dia */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Pedidos por dia</h2>
            {semMovimento ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Nenhum pedido neste mês ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.porDia} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#378add" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#378add" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <Tooltip
                    labelFormatter={(d) => `Dia ${d}`}
                    formatter={(v: number) => [`${v} pedidos`, '']}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="pedidos" stroke="#378add" strokeWidth={2} fill="url(#gradDia)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top vendedores — só na visão da empresa (admin) */}
          {data.topVendedores && (
            <div className="card p-5">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Top vendedores</h2>
              {data.topVendedores.length > 0 ? (
                <div className="space-y-3.5">
                  {data.topVendedores.map((v: any, i: number) => {
                    const max = data.topVendedores[0].valor || 1
                    return (
                      <div key={v.vendedorId} className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${i === 0 ? 'bg-brand-400 text-white' : 'bg-brand-50 text-brand-600'}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium text-gray-900 truncate">{v.nome}</span>
                            <span className="text-xs font-semibold text-gray-900 ml-2">{fmtMoeda(v.valor)}</span>
                          </div>
                          <div className="h-1.5 bg-brand-50 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(v.valor / max) * 100}%` }} />
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{v.pedidos} pedidos</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">Sem vendas neste mês</div>
              )}
            </div>
          )}

          {/* Top produtos */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">{individual ? 'Meus top produtos' : 'Top produtos'}</h2>
            {data.topProdutos.length > 0 ? (
              <div className="space-y-3.5">
                {data.topProdutos.map((p: any, i: number) => {
                  const max = data.topProdutos[0].qtd || 1
                  return (
                    <div key={p.produtoId}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 truncate">{p.nome}</span>
                        <span className="text-xs text-gray-500 ml-2">{fmtNum(p.qtd)} un</span>
                      </div>
                      <div className="h-1.5 bg-green-50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(p.qtd / max) * 100}%`, background: i === 0 ? '#22c55e' : '#86efac' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">Sem vendas neste mês</div>
            )}
          </div>

          {/* Top clientes */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">{individual ? 'Meus top clientes' : 'Top clientes'}</h2>
            {data.topClientes.length > 0 ? (
              <div className="space-y-3.5">
                {data.topClientes.map((c: any, i: number) => {
                  const max = data.topClientes[0].valor || 1
                  return (
                    <div key={c.clienteId} className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${i === 0 ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-600'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-medium text-gray-900 truncate">{c.nome}</span>
                          <span className="text-xs font-semibold text-gray-900 ml-2">{fmtMoeda(c.valor)}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{c.pedidos} pedidos</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">Sem vendas neste mês</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
