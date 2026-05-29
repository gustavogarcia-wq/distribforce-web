'use client'
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, RefreshCw, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const fmt = (v: any) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function NovoPedidoPanel({ onClose, onSuccess }: Props) {
  const qc = useQueryClient()

  // ─── Estados ─────────────────────────────────────────────
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaClienteDebounce, setBuscaClienteDebounce] = useState('')
  const [clienteSel, setClienteSel] = useState<any>(null)
  const [vendedorId, setVendedorId] = useState<string | null>(null)
  const [tabelaId, setTabelaId] = useState<string>('')
  const [prazoPagamento, setPrazoPagamento] = useState<string>('a_vista')
  const [observacao, setObservacao] = useState('')
  const [descontoPct, setDescontoPct] = useState<number>(0)
  const [descontoModo, setDescontoModo] = useState<'pct' | 'rs'>('pct')
  const [itens, setItens] = useState<any[]>([])

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setBuscaClienteDebounce(buscaCliente), 300)
    return () => clearTimeout(t)
  }, [buscaCliente])

  // ─── Queries ─────────────────────────────────────────────
  const { data: clientesData } = useQuery({
    queryKey: ['clientes-novo-pedido', buscaClienteDebounce],
    queryFn: () => api.get('/clientes', { params: { busca: buscaClienteDebounce || undefined, limit: 20 } }).then(r => r.data),
    enabled: buscaClienteDebounce.length > 1 && !clienteSel,
  })

  const { data: tabelas = [] } = useQuery<any[]>({
    queryKey: ['tabelas-novo-pedido'],
    queryFn: () => api.get('/tabelas').then(r => r.data),
  })

  const { data: vendedores = [] } = useQuery<any[]>({
    queryKey: ['usuarios-novo-pedido'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
  })

  const { data: prazos = [] } = useQuery<any[]>({
    queryKey: ['prazos-pagamento'],
    queryFn: () => api.get('/prazos-pagamento').then(r => r.data),
  })

  const { data: produtosTabela = [] } = useQuery<any[]>({
    queryKey: ['produtos-tabela-novo', tabelaId],
    queryFn: () => api.get(`/tabelas/${tabelaId}/itens`, { params: { limit: 500 } }).then(r => r.data),
    enabled: !!tabelaId,
  })

  // ─── Quando seleciona cliente, pré-preenche vendedor ─────
  useEffect(() => {
    if (clienteSel?.vendedorId) setVendedorId(clienteSel.vendedorId)
  }, [clienteSel])

  // ─── Cálculos ────────────────────────────────────────────
  const subtotal = useMemo(() =>
    itens.reduce((acc, it) => acc + (Number(it.quantidade) || 0) * (Number(it.precoUnitario) || 0) * (1 - (Number(it.descontoPct) || 0) / 100), 0),
    [itens]
  )
  const total = subtotal * (1 - descontoPct / 100)
  const descontoValor = subtotal - total

  // ─── Mutation ────────────────────────────────────────────
  const criarPedido = useMutation({
    mutationFn: () => api.post('/pedidos', {
      clienteId: clienteSel.id,
      tabelaId,
      observacao: observacao || undefined,
      prazoPagamento,
      itens: itens.map(i => ({
        produtoId: i.produtoId,
        quantidade: Number(i.quantidade),
        descontoPct: Number(i.descontoPct) || 0,
      })),
    }),
    onSuccess: () => {
      toast.success('Pedido criado!')
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erro ao criar pedido'),
  })

  // ─── Validação ───────────────────────────────────────────
  const podeSalvar = clienteSel && tabelaId && itens.length > 0 && !criarPedido.isPending

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Novo pedido</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {/* Corpo */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Cliente */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Cliente</div>
          {clienteSel ? (
            <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded px-3 py-2">
              <div>
                <div className="text-sm font-medium text-gray-900">{clienteSel.razaoSocial}</div>
                <div className="text-xs text-gray-500">{clienteSel.cnpj ?? '—'}</div>
              </div>
              <button onClick={() => { setClienteSel(null); setVendedorId(null); setBuscaCliente('') }} className="text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou CNPJ..."
                className="input pl-8 text-sm w-full"
                value={buscaCliente}
                onChange={e => setBuscaCliente(e.target.value)}
              />
              {clientesData?.clientes?.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                  {clientesData.clientes.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setClienteSel(c); setBuscaCliente('') }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{c.razaoSocial}</div>
                      <div className="text-xs text-gray-500">{c.cnpj ?? 'sem CNPJ'} — {c.enderecoCidade ?? '—'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vendedor e Tabela */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Vendedor</div>
            <select
              className="input text-sm w-full"
              value={vendedorId ?? ''}
              onChange={e => setVendedorId(e.target.value || null)}
            >
              <option value="">— Sem vendedor —</option>
              {vendedores.filter((u: any) => u.vendedor).map((u: any) => (
                <option key={u.vendedor.id} value={u.vendedor.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Tabela <span className="text-red-500">*</span></div>
            <select
              className="input text-sm w-full"
              value={tabelaId}
              onChange={e => { setTabelaId(e.target.value); setItens([]) }}
            >
              <option value="">— Selecione —</option>
              {tabelas.map((t: any) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prazo */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Prazo de pagamento</div>
          <select
            className="input text-sm w-full"
            value={prazoPagamento}
            onChange={e => setPrazoPagamento(e.target.value)}
          >
            {prazos.map((p: any) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Itens */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">Itens</div>
          {!tabelaId && (
            <div className="text-xs text-gray-400 italic">Selecione uma tabela para adicionar produtos</div>
          )}
          {tabelaId && itens.length === 0 && (
            <div className="text-xs text-gray-400 italic mb-2">Nenhum produto adicionado</div>
          )}
          <div className="space-y-1.5">
            {itens.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs border border-gray-100 rounded p-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{item.produtoNome}</div>
                  <div className="text-gray-500">{fmt(Number(item.quantidade) * Number(item.precoUnitario))}</div>
                </div>
                <div className="flex items-center border border-gray-200 rounded">
                  <button onClick={() => { const n = [...itens]; n[idx].quantidade = Math.max(1, n[idx].quantidade - 1); setItens(n) }} className="px-1.5 py-0.5 hover:bg-gray-100">−</button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={e => { const n = [...itens]; n[idx].quantidade = Math.max(1, Number(e.target.value) || 1); setItens(n) }}
                    className="w-10 text-center border-x border-gray-200 px-1 py-0.5 outline-none"
                  />
                  <button onClick={() => { const n = [...itens]; n[idx].quantidade += 1; setItens(n) }} className="px-1.5 py-0.5 hover:bg-gray-100">+</button>
                </div>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.precoUnitario}
                  onChange={e => { const n = [...itens]; n[idx].precoUnitario = Number(e.target.value) || 0; setItens(n) }}
                  className="w-20 text-right border border-gray-200 rounded px-1.5 py-0.5"
                />
                <button onClick={() => setItens(itens.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700" title="Remover">🗑️</button>
              </div>
            ))}
          </div>
          {tabelaId && (
            <select
              onChange={e => {
                const p = produtosTabela.find((pt: any) => pt.produtoId === e.target.value)
                if (p) setItens([...itens, { produtoId: p.produtoId, produtoNome: p.produto?.nome, quantidade: 1, precoUnitario: Number(p.precoUnitario), descontoPct: 0 }])
                e.target.value = ''
              }}
              value=""
              className="mt-2 w-full text-xs border border-dashed border-brand-300 rounded px-2 py-1.5 bg-brand-50 text-brand-700 cursor-pointer"
            >
              <option value="">+ Adicionar produto…</option>
              {produtosTabela.filter((p: any) => !itens.some(i => i.produtoId === p.produtoId)).map((p: any) => (
                <option key={p.produtoId} value={p.produtoId}>{p.produto?.nome} — {fmt(p.precoUnitario)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Totais */}
        {itens.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center text-xs text-green-600">
              <span className="flex items-center gap-1.5">
                <span>Desconto</span>
                <span className="inline-flex border border-green-300 rounded overflow-hidden">
                  <button onClick={() => setDescontoModo('pct')} className={`px-1.5 py-0 text-xs ${descontoModo === 'pct' ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}>%</button>
                  <button onClick={() => setDescontoModo('rs')} className={`px-1.5 py-0 text-xs border-l border-green-300 ${descontoModo === 'rs' ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}>R$</button>
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={descontoModo === 'pct' ? Number(descontoPct).toFixed(2).replace(/\.?0+$/, '') : descontoValor.toFixed(2)}
                  onChange={e => {
                    const v = Number(e.target.value) || 0
                    if (descontoModo === 'pct') {
                      setDescontoPct(Math.min(100, Math.max(0, v)))
                    } else {
                      setDescontoPct(subtotal > 0 ? Math.min(100, Math.max(0, (v / subtotal) * 100)) : 0)
                    }
                  }}
                  className="w-16 text-xs text-green-700 border border-green-300 rounded px-1 py-0 text-right bg-white"
                />
              </span>
              <span>− {fmt(descontoValor)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1.5 border-t border-gray-200"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
        )}

        {/* Observação */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Observação</div>
          <textarea
            className="input text-sm w-full"
            rows={2}
            placeholder="Opcional"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 grid grid-cols-2 gap-2">
        <button onClick={onClose} className="btn-secondary text-sm py-2" disabled={criarPedido.isPending}>
          Cancelar
        </button>
        <button
          onClick={() => criarPedido.mutate()}
          disabled={!podeSalvar}
          className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm py-2 rounded font-medium flex items-center justify-center gap-2"
        >
          {criarPedido.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
          Criar pedido
        </button>
      </div>
    </div>
  )
}
