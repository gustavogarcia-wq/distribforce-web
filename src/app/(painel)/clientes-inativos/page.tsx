'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { UserX, MapPin, Phone, Clock, ArrowLeft, ShoppingBag, X } from 'lucide-react'
import clsx from 'clsx'

function fmtMoeda(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}
function fmtData(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function diasDesde(s?: string | null) {
  if (!s) return null
  const ms = Date.now() - new Date(s).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

const OPCOES_DIAS = [30, 45, 60, 90]

export default function ClientesInativosPage() {
  const [dias, setDias] = useState(30)
  const [clienteSel, setClienteSel] = useState<{ id: string; nome: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes-inativos', dias],
    queryFn: () => api.get('/clientes/inativos', { params: { dias } }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const clientes = data?.clientes ?? []

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-base font-semibold text-gray-900">Clientes inativos</h1>
        <p className="text-xs text-gray-400 mt-0.5">Clientes que já compraram, mas pararam no período</p>
      </div>

      {/* Filtro de dias */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-1"><Clock size={13} /> Sem comprar há</span>
        {OPCOES_DIAS.map(d => (
          <button
            key={d}
            onClick={() => setDias(d)}
            className={clsx('text-sm px-3 py-1.5 rounded-lg border',
              dias === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
          >
            {d} dias
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">
          {isLoading ? 'Carregando…' : `${data?.total ?? 0} cliente(s)`}
        </span>
      </div>

      {/* Lista */}
      <div className="p-6">
        {isLoading && !data ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Carregando…</div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <UserX size={32} strokeWidth={1} />
            <p className="text-sm mt-2">Nenhum cliente inativo nesse período</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Cliente</th>
                  <th className="text-left font-medium px-4 py-2.5">Local</th>
                  <th className="text-left font-medium px-4 py-2.5">Telefone</th>
                  <th className="text-right font-medium px-4 py-2.5">Compras</th>
                  <th className="text-right font-medium px-4 py-2.5">Última compra</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c: any) => {
                  const d = diasDesde(c.ultimaCompra)
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setClienteSel({ id: c.id, nome: c.nome })}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-900">{c.nome}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {c.cidade ? `${c.cidade}${c.estado ? '/' + c.estado : ''}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{c.telefone || '—'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{c.totalCompras}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-gray-900">{fmtData(c.ultimaCompra)}</span>
                        {d != null && <span className="block text-xs text-amber-600">há {d} dias</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel lateral: ultimas vendas do cliente */}
      {clienteSel && (
        <PainelVendas cliente={clienteSel} onFechar={() => setClienteSel(null)} />
      )}
    </div>
  )
}

function PainelVendas({ cliente, onFechar }: { cliente: { id: string; nome: string }; onFechar: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ultimas-vendas', cliente.id],
    queryFn: () => api.get(`/clientes/${cliente.id}/ultimas-vendas`, { params: { n: 3 } }).then(r => r.data),
  })
  const vendas = data?.vendas ?? []

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onFechar}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Últimas compras</p>
            <h2 className="text-sm font-semibold text-gray-900">{cliente.nome}</h2>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="text-sm text-gray-400">Carregando…</div>
          ) : vendas.length === 0 ? (
            <div className="text-sm text-gray-400">Sem compras registradas.</div>
          ) : (
            vendas.map((v: any) => (
              <div key={v.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <ShoppingBag size={13} /> NF {v.numero || '—'} · {fmtData(v.data)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{fmtMoeda(v.valorTotal)}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {v.itens.map((it: any, i: number) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{it.quantidade}x {it.produto}</span>
                      <span className="text-gray-500">{fmtMoeda(it.valorTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
