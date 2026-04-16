'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, ChevronRight, Save, ArrowLeft, Percent, DollarSign, Search, Package } from 'lucide-react'
import clsx from 'clsx'

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Tela principal: lista de tabelas ────────────────────────────────────────

function ListaTabelas({ onSelecionar }: { onSelecionar: (id: string) => void }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', descontoMaximo: 0, validade: '', ativa: true })

  const { data: tabelas, isLoading } = useQuery({
    queryKey: ['tabelas'],
    queryFn: () => api.get('/tabelas').then(r => r.data),
  })

  const criar = useMutation({
    mutationFn: () => api.post('/tabelas', {
      ...form,
      descontoMaximo: Number(form.descontoMaximo),
      validade: form.validade || undefined,
    }),
    onSuccess: () => {
      toast.success('Tabela criada!')
      qc.invalidateQueries({ queryKey: ['tabelas'] })
      setShowForm(false)
      setForm({ nome: '', descontoMaximo: 0, validade: '', ativa: true })
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erro ao criar tabela'),
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Tabelas de preço</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gerencie os preços por tabela e vincule aos representantes</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Nova tabela
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* Formulário de nova tabela */}
        {showForm && (
          <div className="card p-5 mb-5">
            <div className="text-sm font-medium text-gray-900 mb-4">Nova tabela de preço</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label className="label">Nome da tabela *</label>
                <input className="input" placeholder="Ex: Varejo SP, Atacado Sul..."
                  value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <label className="label">Desconto máximo que o rep. pode conceder (%)</label>
                <input type="number" min="0" max="100" step="0.5" className="input"
                  value={form.descontoMaximo}
                  onChange={e => setForm(p => ({ ...p, descontoMaximo: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Válida até (opcional)</label>
                <input type="date" className="input"
                  value={form.validade}
                  onChange={e => setForm(p => ({ ...p, validade: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativa" checked={form.ativa}
                  onChange={e => setForm(p => ({ ...p, ativa: e.target.checked }))} />
                <label htmlFor="ativa" className="text-sm text-gray-600 cursor-pointer">Tabela ativa</label>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary text-sm flex items-center gap-1.5"
                onClick={() => criar.mutate()}
                disabled={!form.nome || criar.isPending}>
                {criar.isPending ? 'Criando...' : 'Criar tabela'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de tabelas */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/>
            </svg>
          </div>
        ) : !tabelas?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <DollarSign size={32} strokeWidth={1} />
            <p className="text-sm mt-2">Nenhuma tabela criada ainda</p>
            <p className="text-xs mt-1">Clique em "Nova tabela" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tabelas.map((t: any) => (
              <div key={t.id}
                className="card p-4 flex items-center gap-4 cursor-pointer hover:border-brand-300 transition-colors"
                onClick={() => onSelecionar(t.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{t.nome}</span>
                    <span className={t.ativa ? 'badge-green' : 'badge-gray'}>{t.ativa ? 'Ativa' : 'Inativa'}</span>
                    {t.validade && (
                      <span className="badge-amber">Válida até {new Date(t.validade).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Desc. máx. representante: {Number(t.descontoMaximo)}%</span>
                    <span>{t._count?.itens ?? 0} produtos cadastrados</span>
                    <span>{t._count?.clientesTabelas ?? 0} clientes vinculados</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tela de edição de tabela ─────────────────────────────────────────────────

function EditarTabela({ tabelaId, onVoltar }: { tabelaId: string; onVoltar: () => void }) {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Record<string, { precoFixo: string; descontoPct: string; modo: 'fixo' | 'desconto' }>>({})
  const [salvando, setSalvando] = useState<string | null>(null)

  const { data: tabela } = useQuery({
    queryKey: ['tabela', tabelaId],
    queryFn: () => api.get(`/tabelas/${tabelaId}`).then(r => r.data),
  })

  const { data: produtosData } = useQuery({
    queryKey: ['tabela-itens', tabelaId, busca],
    queryFn: () => api.get(`/tabelas/${tabelaId}/itens`, {
      params: { busca: busca || undefined, limit: 100 }
    }).then(r => r.data),
  })

  const { data: todosProdutos } = useQuery({
    queryKey: ['produtos-todos'],
    queryFn: () => api.get('/produtos', { params: { limit: 200, ativo: true } }).then(r => r.data),
  })

  const salvarItem = async (produtoId: string, produtoNome: string, valorBase: number) => {
    const ed = editando[produtoId]
    if (!ed) return

    setSalvando(produtoId)
    try {
      let precoUnitario: number
      if (ed.modo === 'fixo') {
        precoUnitario = Number(ed.precoFixo.replace(',', '.'))
      } else {
        const pct = Number(ed.descontoPct.replace(',', '.'))
        precoUnitario = valorBase * (1 - pct / 100)
      }

      if (isNaN(precoUnitario) || precoUnitario <= 0) {
        toast.error('Preço inválido')
        return
      }

      await api.put(`/tabelas/${tabelaId}/itens`, [{
        produtoId,
        precoUnitario: Math.round(precoUnitario * 100) / 100,
        descontoMaximo: Number(tabela?.descontoMaximo ?? 0),
      }])

      toast.success(`${produtoNome} atualizado!`)
      qc.invalidateQueries({ queryKey: ['tabela-itens', tabelaId] })
      qc.invalidateQueries({ queryKey: ['tabelas'] })
      setEditando(p => { const n = { ...p }; delete n[produtoId]; return n })
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSalvando(null)
    }
  }

  const iniciarEdicao = (produtoId: string, itemExistente?: any, valorBase?: number) => {
    if (itemExistente) {
      setEditando(p => ({
        ...p,
        [produtoId]: {
          precoFixo: Number(itemExistente.precoUnitario).toFixed(2).replace('.', ','),
          descontoPct: '0',
          modo: 'fixo',
        }
      }))
    } else {
      setEditando(p => ({
        ...p,
        [produtoId]: {
          precoFixo: valorBase ? Number(valorBase).toFixed(2).replace('.', ',') : '',
          descontoPct: '0',
          modo: 'fixo',
        }
      }))
    }
  }

  // Mescla produtos da tabela com todos os produtos
  const itensMap = new Map(produtosData?.map((i: any) => [i.produtoId ?? i.produto?.id, i]) ?? [])
  const produtos = todosProdutos?.produtos ?? []
  const produtosFiltrados = produtos.filter((p: any) =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigoInterno?.includes(busca)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onVoltar}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900">{tabela?.nome ?? '...'}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Desc. máx. representante: {Number(tabela?.descontoMaximo ?? 0)}% ·
            {produtosData?.length ?? 0} de {produtos.length} produtos com preço
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-xs" placeholder="Buscar produto ou SKU..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-6 py-2.5 font-medium text-gray-500">Produto</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">SKU</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Preço base (Omie)</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Preço nesta tabela</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtosFiltrados.map((p: any) => {
              const item = itensMap.get(p.id)
              const ed = editando[p.id]
              const temPreco = !!item

              return (
                <tr key={p.id} className={clsx('hover:bg-gray-50', temPreco ? '' : 'opacity-60')}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} alt={p.nome} className="w-8 h-8 object-contain rounded flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <Package size={12} className="text-gray-300" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 max-w-xs truncate">{p.nome}</div>
                        {p.categoria && <div className="text-gray-400">{p.categoria}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">{p.codigoInterno ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(p.valorUnitario ?? 0)}</td>
                  <td className="px-4 py-3">
                    {ed ? (
                      <div className="flex items-center gap-2">
                        {/* Toggle modo */}
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                          <button
                            className={clsx('px-2 py-1 text-xs flex items-center gap-1 transition-colors', ed.modo === 'fixo' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
                            onClick={() => setEditando(prev => ({ ...prev, [p.id]: { ...prev[p.id], modo: 'fixo' } }))}>
                            <DollarSign size={10} /> Fixo
                          </button>
                          <button
                            className={clsx('px-2 py-1 text-xs flex items-center gap-1 transition-colors', ed.modo === 'desconto' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
                            onClick={() => setEditando(prev => ({ ...prev, [p.id]: { ...prev[p.id], modo: 'desconto' } }))}>
                            <Percent size={10} /> Desc.
                          </button>
                        </div>
                        {ed.modo === 'fixo' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">R$</span>
                            <input
                              className="input text-xs w-24 py-1"
                              value={ed.precoFixo}
                              onChange={e => setEditando(prev => ({ ...prev, [p.id]: { ...prev[p.id], precoFixo: e.target.value } }))}
                              placeholder="0,00"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              className="input text-xs w-16 py-1"
                              value={ed.descontoPct}
                              onChange={e => setEditando(prev => ({ ...prev, [p.id]: { ...prev[p.id], descontoPct: e.target.value } }))}
                              placeholder="0"
                            />
                            <span className="text-gray-400">% desc.</span>
                            {ed.descontoPct && !isNaN(Number(ed.descontoPct.replace(',','.'))) && (
                              <span className="text-xs text-brand-600 ml-1">
                                = {fmt((p.valorUnitario ?? 0) * (1 - Number(ed.descontoPct.replace(',','.')) / 100))}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={temPreco ? 'font-medium text-gray-900' : 'text-gray-300'}>
                        {temPreco ? fmt(Number(item.precoUnitario)) : 'Sem preço'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ed ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                          onClick={() => salvarItem(p.id, p.nome, p.valorUnitario ?? 0)}
                          disabled={salvando === p.id}>
                          <Save size={10} /> {salvando === p.id ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button className="btn-secondary text-xs py-1 px-2"
                          onClick={() => setEditando(prev => { const n = { ...prev }; delete n[p.id]; return n })}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="badge-blue cursor-pointer hover:bg-blue-100 transition-colors px-2 py-1"
                        onClick={() => iniciarEdicao(p.id, item, p.valorUnitario)}>
                        {temPreco ? 'Editar' : 'Definir preço'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Componente raiz ──────────────────────────────────────────────────────────

export default function TabelasPage() {
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(null)

  if (tabelaSelecionada) {
    return <EditarTabela tabelaId={tabelaSelecionada} onVoltar={() => setTabelaSelecionada(null)} />
  }

  return <ListaTabelas onSelecionar={setTabelaSelecionada} />
}
