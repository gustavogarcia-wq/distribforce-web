'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Search, Send, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const STATUS_LABELS: Record<string, string> = {
  ORCAMENTO: 'Orçamento',
  AGUARDANDO_APROVACAO: 'Ag. aprovação',
  CONFIRMADO: 'Confirmado',
  FATURADO: 'Faturado',
  CANCELADO: 'Cancelado',
}

const STATUS_CLASS: Record<string, string> = {
  ORCAMENTO: 'badge-gray',
  AGUARDANDO_APROVACAO: 'badge-amber',
  CONFIRMADO: 'badge-green',
  FATURADO: 'badge-blue',
  CANCELADO: 'badge-red',
}

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PedidosPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [modoEdicao, setModoEdicao] = useState(false)
  const { usuario } = useAuth()


  const { data, isLoading } = useQuery({
    queryKey: ['pedidos', page, busca, status],
    queryFn: () => api.get('/pedidos', { params: { page, limit: 15, busca: busca || undefined, status: status || undefined } }).then(r => r.data),
  })

  const { data: detalhe } = useQuery({
    queryKey: ['pedido', detalheId],
    queryFn: () => api.get(`/pedidos/${detalheId}`).then(r => r.data),
    enabled: !!detalheId,
  })
  const [dadosEdicao, setDadosEdicao] = useState<any>(null)

  const { data: usuariosLista } = useQuery({
    queryKey: ['usuarios-lista'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
    enabled: modoEdicao,
  })

  const { data: tabelasLista } = useQuery({
    queryKey: ['tabelas-lista'],
    queryFn: () => api.get('/tabelas').then(r => r.data),
    enabled: modoEdicao,
  })

  useEffect(() => {
    if (modoEdicao && detalhe) {
      setDadosEdicao({
        vendedorId: detalhe.vendedorId ?? null,
        tabelaId: detalhe.tabelaId,
        clienteId: detalhe.clienteId,
        descontoPct: Number(detalhe.descontoPct),
        observacao: detalhe.observacao ?? '',
        itens: (detalhe.itens ?? []).map((i: any) => ({ produtoId: i.produtoId, produtoNome: i.produto?.nome, quantidade: Number(i.quantidade), precoUnitario: Number(i.precoUnitario), descontoPct: Number(i.descontoPct) })),
      })
    } else {
      setDadosEdicao(null)
    }
  }, [modoEdicao, detalhe])

  const { data: produtosTabela } = useQuery({
    queryKey: ['produtos-tabela', dadosEdicao?.tabelaId],
    queryFn: () => api.get(`/tabelas/${dadosEdicao.tabelaId}/itens`, { params: { limit: 500 } }).then(r => r.data),
    enabled: modoEdicao && !!dadosEdicao?.tabelaId,
  })



  const aprovar = useMutation({
    mutationFn: (id: string) => api.patch(`/pedidos/${id}/status`, { status: 'CONFIRMADO', observacao: 'Aprovado pelo gestor' }),
    onSuccess: () => { toast.success('Pedido confirmado!'); qc.invalidateQueries({ queryKey: ['pedidos'] }); if (detalheId) qc.invalidateQueries({ queryKey: ['pedido', detalheId] }) },
    onError: () => toast.error('Erro ao confirmar pedido'),
  })

  const enviarOmie = useMutation({
    mutationFn: (id: string) => api.post(`/pedidos/${id}/omie`),
    onSuccess: () => { toast.success('Pedido enviado ao Omie!'); qc.invalidateQueries({ queryKey: ['pedidos'] }); if (detalheId) qc.invalidateQueries({ queryKey: ['pedido', detalheId] }) },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erro ao enviar ao Omie'),
  })

  const gerarPDF = useMutation({
    mutationFn: (id: string) => api.get(`/pedidos/${id}/espelho`, { responseType: 'blob' }).then(r => r.data),
    onSuccess: (data) => window.open(URL.createObjectURL(data), '_blank'),
    onError: () => toast.error('Erro ao gerar PDF'),
  })

  const salvarEdicao = useMutation({
    mutationFn: () => api.patch(`/pedidos/${detalheId}`, {
      vendedorId: dadosEdicao.vendedorId,
      tabelaId: dadosEdicao.tabelaId,
      clienteId: dadosEdicao.clienteId,
      descontoPct: dadosEdicao.descontoPct,
      observacao: dadosEdicao.observacao || null,
      itens: dadosEdicao.itens.map((i: any) => ({
        produtoId: i.produtoId,
        quantidade: Number(i.quantidade),
        precoUnitario: Number(i.precoUnitario),
        descontoPct: Number(i.descontoPct) || 0,
      })),
    }),
    onSuccess: () => {
      toast.success('Pedido atualizado!')
      setModoEdicao(false)
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      if (detalheId) qc.invalidateQueries({ queryKey: ['pedido', detalheId] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erro ao salvar pedido'
      toast.error(msg)
    },
  })


  const pedidos = data?.pedidos ?? []
  const pages = data?.pages ?? 1

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Lista */}
      <div className={clsx('flex-1 flex flex-col overflow-hidden transition-all', detalheId ? 'max-w-[60%]' : '')}>
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-semibold text-gray-900">Pedidos</h1>
        </div>

        {/* Filtros */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-xs" placeholder="Buscar cliente ou nº pedido..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1) }} />
          </div>
          <select className="input text-xs w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(busca || status) && (
            <button className="btn-secondary text-xs" onClick={() => { setBusca(''); setStatus(''); setPage(1) }}>Limpar</button>
          )}
          <div className="ml-auto text-xs text-gray-400">{data?.total ?? 0} pedidos</div>
        </div>

        {/* Abas rápidas */}
        <div className="bg-white border-b border-gray-100 px-6 flex gap-1">
          {[['', 'Todos'], ['AGUARDANDO_APROVACAO', 'Ag. aprovação'], ['CONFIRMADO', 'Prontos p/ Omie'], ['FATURADO', 'Faturados']].map(([k, v]) => (
            <button key={k} onClick={() => { setStatus(k); setPage(1) }}
              className={clsx('px-3 py-2.5 text-xs border-b-2 transition-colors', status === k ? 'border-brand-500 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {v}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <svg className="animate-spin w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/></svg>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ShoppingCartIcon />
              <p className="text-sm mt-2">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Pedido</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Vendedor</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Valor</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.map((p: any) => (
                  <tr key={p.id} className={clsx('hover:bg-gray-50 transition-colors cursor-pointer', detalheId === p.id && 'bg-brand-50', p.status === 'CONFIRMADO' && 'bg-green-50/50')}
                    onClick={() => { setDetalheId(p.id === detalheId ? null : p.id); setModoEdicao(false) }}>
                    <td className="px-4 py-3 font-mono text-gray-500">{p.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[140px] truncate">{p.cliente?.razaoSocial}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{p.vendedor?.usuario?.nome}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(p.total)}</td>
                    <td className="px-4 py-3"><span className={STATUS_CLASS[p.status]}>{STATUS_LABELS[p.status]}</span></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {p.status === 'AGUARDANDO_APROVACAO' && (
                          <button className="badge-amber cursor-pointer hover:bg-amber-100 transition-colors px-2 py-1"
                            onClick={() => aprovar.mutate(p.id)}>Aprovar</button>
                        )}
                        {p.status === 'CONFIRMADO' && (
                          <button className="badge-green cursor-pointer hover:bg-green-100 transition-colors px-2 py-1 flex items-center gap-1"
                            onClick={() => enviarOmie.mutate(p.id)}>
                            <Send size={10} /> Omie
                          </button>
                        )}
                        <button className="badge-gray cursor-pointer hover:bg-gray-200 transition-colors p-1"
                          onClick={() => { setDetalheId(p.id === detalheId ? null : p.id); setModoEdicao(false) }}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {pages > 1 && (
          <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Página {page} de {pages}</span>
            <div className="flex items-center gap-1">
              <button className="btn-secondary p-1.5" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
              <button className="btn-secondary p-1.5" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Painel de detalhe */}
      {detalheId && detalhe && (
        <div className="w-[40%] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{detalhe.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-xs text-gray-400 mt-0.5">{detalhe.cliente?.razaoSocial}</div>
            </div>
            <div className="flex items-center gap-2">{usuario?.perfil === "ADMIN" && (detalhe.status === "ORCAMENTO" || detalhe.status === "AGUARDANDO_APROVACAO") && (<button onClick={() => setModoEdicao(!modoEdicao)} className={clsx("text-xs px-2.5 py-1 rounded border", modoEdicao ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100" : "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100")}>{modoEdicao ? "Cancelar edição" : "Editar"}</button>)}<button onClick={() => { setDetalheId(null); setModoEdicao(false) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button></div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Pipeline */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-3">Etapas do pedido</div>
              <div className="flex items-center gap-0">
                {['ORCAMENTO', 'AGUARDANDO_APROVACAO', 'CONFIRMADO', 'FATURADO'].map((s, i, arr) => {
                  const steps = ['ORCAMENTO', 'AGUARDANDO_APROVACAO', 'CONFIRMADO', 'FATURADO', 'CANCELADO']
                  const currentIdx = steps.indexOf(detalhe.status)
                  const stepIdx = steps.indexOf(s)
                  const done = stepIdx < currentIdx
                  const active = stepIdx === currentIdx
                  return (
                    <div key={s} className="flex items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium', done ? 'bg-brand-600 text-white' : active ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300' : 'bg-gray-100 text-gray-400')}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={clsx('text-xs whitespace-nowrap', active ? 'text-brand-600 font-medium' : 'text-gray-400')}>{STATUS_LABELS[s]}</span>
                      </div>
                      {i < arr.length - 1 && <div className={clsx('h-0.5 w-6 mb-4', done ? 'bg-brand-400' : 'bg-gray-200')} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400">Vendedor</div>
                {modoEdicao && dadosEdicao ? (
                  <select
                    className="w-full text-xs font-medium text-gray-900 mt-0.5 border border-gray-200 rounded px-2 py-1 bg-white"
                    value={dadosEdicao.vendedorId ?? ''}
                    onChange={e => setDadosEdicao({ ...dadosEdicao, vendedorId: e.target.value || null })}
                  >
                    <option value="">— Sem vendedor —</option>
                    {usuariosLista?.filter((u: any) => u.vendedor).map((u: any) => (
                      <option key={u.vendedor.id} value={u.vendedor.id}>{u.nome}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.vendedor?.usuario?.nome ?? '—'}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-400">Região</div>
                <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.vendedor?.regiao?.nome ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Tabela</div>
                {modoEdicao && dadosEdicao ? (
                  <select
                    className="w-full text-xs font-medium text-gray-900 mt-0.5 border border-gray-200 rounded px-2 py-1 bg-white"
                    value={dadosEdicao.tabelaId}
                    onChange={e => setDadosEdicao({ ...dadosEdicao, tabelaId: e.target.value })}
                  >
                    {tabelasLista?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.tabela?.nome}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-400">Data</div>
                <div className="text-xs font-medium text-gray-900 mt-0.5">{new Date(detalhe.criadoEm).toLocaleDateString('pt-BR')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">CNPJ cliente</div>
                <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.cliente?.cnpj ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Omie nº</div>
                <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.omieNumero ?? '—'}</div>
              </div>
            </div>

            {/* Itens */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Itens</div>
              <div className="space-y-1.5">
                {(modoEdicao && dadosEdicao ? dadosEdicao.itens : detalhe.itens)?.map((item: any, idx: number) => {
                  const qtd = Number(item.quantidade) || 0
                  const preco = Number(item.precoUnitario) || 0
                  const desc = Number(item.descontoPct) || 0
                  const totalItem = qtd * preco * (1 - desc / 100)
                  const nome = item.produtoNome ?? item.produto?.nome
                  if (modoEdicao && dadosEdicao) {
                    return (
                      <div key={idx} className="py-2 border-b border-gray-50">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-xs font-medium text-gray-900 truncate flex-1">{nome}</div>
                          <button onClick={() => setDadosEdicao({ ...dadosEdicao, itens: dadosEdicao.itens.filter((_: any, i: number) => i !== idx) })} className="text-red-500 hover:text-red-700 text-sm flex-shrink-0" title="Remover item">🗑️</button>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-0.5 border border-gray-200 rounded">
                            <button onClick={() => { const novos = [...dadosEdicao.itens]; novos[idx] = { ...novos[idx], quantidade: Math.max(1, qtd - 1) }; setDadosEdicao({ ...dadosEdicao, itens: novos }) }} className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100">−</button>
                            <input type="number" min={1} value={qtd} onChange={e => { const novos = [...dadosEdicao.itens]; novos[idx] = { ...novos[idx], quantidade: Math.max(1, Number(e.target.value) || 1) }; setDadosEdicao({ ...dadosEdicao, itens: novos }) }} className="w-10 text-center text-xs border-x border-gray-200 px-1 py-0.5 outline-none" />
                            <button onClick={() => { const novos = [...dadosEdicao.itens]; novos[idx] = { ...novos[idx], quantidade: qtd + 1 }; setDadosEdicao({ ...dadosEdicao, itens: novos }) }} className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100">+</button>
                          </div>
                          <span className="text-gray-400">×</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">R$</span>
                            <input type="number" min={0} step={0.01} value={preco} onChange={e => { const novos = [...dadosEdicao.itens]; novos[idx] = { ...novos[idx], precoUnitario: Number(e.target.value) || 0 }; setDadosEdicao({ ...dadosEdicao, itens: novos }) }} className="w-20 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-right" />
                          </div>
                          <span className="ml-auto text-xs font-semibold text-gray-900">{fmt(totalItem)}</span>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <div>
                        <div className="text-xs font-medium text-gray-900">{nome}</div>
                        <div className="text-xs text-gray-400">{qtd} × {fmt(preco)} {desc > 0 ? `(${desc}% desc.)` : ""}</div>
                      </div>
                      <div className="text-xs font-semibold text-gray-900">{fmt(item.total ?? totalItem)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            {modoEdicao && dadosEdicao && (
              <div className="mt-2">
                <select
                  value=""
                  onChange={e => {
                    if (!e.target.value) return
                    const item = produtosTabela?.find((p: any) => p.produtoId === e.target.value)
                    if (!item) return
                    setDadosEdicao({
                      ...dadosEdicao,
                      itens: [...dadosEdicao.itens, {
                        produtoId: item.produtoId,
                        produtoNome: item.produto?.nome,
                        quantidade: 1,
                        precoUnitario: Number(item.precoUnitario),
                        descontoPct: 0,
                      }],
                    })
                    e.target.value = ''
                  }}
                  className="w-full text-xs border border-dashed border-brand-300 rounded px-2 py-1.5 bg-brand-50 text-brand-700 cursor-pointer"
                >
                  <option value="">+ Adicionar produto…</option>
                  {produtosTabela
                    ?.filter((p: any) => !dadosEdicao.itens.some((i: any) => i.produtoId === p.produtoId))
                    .map((p: any) => (
                      <option key={p.produtoId} value={p.produtoId}>
                        {p.produto?.nome} — R$ {Number(p.precoUnitario).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Totais */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {(() => {
                const subtotal = modoEdicao && dadosEdicao ? dadosEdicao.itens.reduce((acc: number, it: any) => acc + (Number(it.quantidade) || 0) * (Number(it.precoUnitario) || 0) * (1 - (Number(it.descontoPct) || 0) / 100), 0) : Number(detalhe.subtotal)
                const descontoPct = modoEdicao && dadosEdicao ? Number(dadosEdicao.descontoPct) || 0 : Number(detalhe.descontoPct)
                const total = subtotal * (1 - descontoPct / 100)
                const descontoValor = subtotal - total
                return (
                  <>
                    <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                    <div className="flex justify-between items-center text-xs text-green-600">
                      <span className="flex items-center gap-1">
                        Desconto (
                        {modoEdicao && dadosEdicao ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={dadosEdicao.descontoPct}
                            onChange={e => setDadosEdicao({ ...dadosEdicao, descontoPct: Number(e.target.value) || 0 })}
                            className="w-12 text-xs text-green-700 border border-green-300 rounded px-1 py-0 text-right bg-white"
                          />
                        ) : (
                          descontoPct.toFixed(1)
                        )}
                        %)
                      </span>
                      <span>− {fmt(descontoValor)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1.5 border-t border-gray-200"><span>Total</span><span>{fmt(total)}</span></div>
                  </>
                )
              })()}
            </div>

            {detalhe.observacao && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">{detalhe.observacao}</div>
            )}
          </div>

          {/* Ações */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            {detalhe.status === 'AGUARDANDO_APROVACAO' && (
              <button className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => aprovar.mutate(detalhe.id)} disabled={aprovar.isPending}>
                {aprovar.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
                Aprovar pedido
              </button>
            )}
            {detalhe.status === 'CONFIRMADO' && (
              <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                onClick={() => enviarOmie.mutate(detalhe.id)} disabled={enviarOmie.isPending}>
                {enviarOmie.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar ao Omie
              </button>
            )}
            {modoEdicao && dadosEdicao && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn-secondary text-sm py-2"
                  onClick={() => setModoEdicao(false)}
                  disabled={salvarEdicao.isPending}
                >
                  Cancelar
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={() => salvarEdicao.mutate()}
                  disabled={salvarEdicao.isPending || dadosEdicao.itens.length === 0}
                >
                  {salvarEdicao.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Salvar alterações
                </button>
              </div>
            )}
            <button className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              onClick={() => gerarPDF.mutate(detalhe.id)} disabled={gerarPDF.isPending}>
              {gerarPDF.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
              Gerar espelho PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShoppingCartIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
}
