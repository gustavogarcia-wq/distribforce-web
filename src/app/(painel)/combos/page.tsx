'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Package, Trash2, Gift, ChevronRight, ArrowLeft, Copy } from 'lucide-react'
import clsx from 'clsx'

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function num(v: string | number) {
  if (typeof v === 'number') return v
  return Number(String(v).replace(',', '.')) || 0
}

type ItemForm = {
  produtoId: string
  nome: string
  foto: string
  valorBase: number
  tipo: 'FIXO' | 'VARIAVEL'
  proporcao: string
  grupo: string
  precoEspecial: string
}

// Preco "a partir de": fixos pela proporcao + 1 unidade da escolha variavel
function precoBase(itens: ItemForm[]) {
  const fixos = itens.filter(i => i.tipo === 'FIXO')
  const variaveis = itens.filter(i => i.tipo === 'VARIAVEL')
  const totalFixos = fixos.reduce((s, i) => s + num(i.precoEspecial) * (num(i.proporcao) || 0), 0)
  const totalVar = variaveis.length > 0 ? num(variaveis[0].precoEspecial) : 0
  return totalFixos + totalVar
}

// ─── Lista de combos ──────────────────────────────────────────────────────────

function ListaCombos({ onSelecionar, onNovo, onDuplicar }: { onSelecionar: (id: string) => void; onNovo: () => void; onDuplicar: (id: string) => void }) {
  const { data: combos, isLoading } = useQuery({
    queryKey: ['combos'],
    queryFn: () => api.get('/combos').then(r => r.data),
  })

  const qc = useQueryClient()
  const desativar = useMutation({
    mutationFn: (id: string) => api.delete(`/combos/${id}`),
    onSuccess: () => { toast.success('Combo desativado'); qc.invalidateQueries({ queryKey: ['combos'] }) },
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Combos promocionais</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kits com itens fixos e sabores à escolha, com preço especial</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={onNovo}>
          <Plus size={14} /> Novo combo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/>
            </svg>
          </div>
        ) : !combos?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Gift size={32} strokeWidth={1} />
            <p className="text-sm mt-2">Nenhum combo criado ainda</p>
            <p className="text-xs mt-1">Clique em "Novo combo" para criar um kit promocional</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {combos.map((c: any) => {
              const itens: any[] = c.itens ?? []
              const nFixos = itens.filter(i => i.tipo === 'FIXO').length
              const variaveis = itens.filter(i => i.tipo === 'VARIAVEL')
              const base = itens.reduce((s, i) => {
                if (i.tipo === 'FIXO') return s + Number(i.precoEspecial ?? 0) * Number(i.proporcao ?? 0)
                return s
              }, 0) + (variaveis.length ? Number(variaveis[0].precoEspecial ?? 0) : 0)
              return (
                <div key={c.id} className={clsx('card p-4 flex items-center gap-4', !c.ativo && 'opacity-50')}>
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gift size={20} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelecionar(c.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{c.nome}</span>
                      <span className={c.ativo ? 'badge-green' : 'badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                      {c.tabela ? (
                        <span className="badge-blue">{c.tabela.nome}</span>
                      ) : (
                        <span className="badge-gray">Todas as tabelas</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{nFixos} fixo{nFixos !== 1 ? 's' : ''}</span>
                      <span>{variaveis.length} variáve{variaveis.length !== 1 ? 'is' : 'l'}</span>
                      {base > 0 && <span className="font-medium text-gray-900">a partir de {fmt(base)}</span>}
                      {c.validadeFim && <span className="text-amber-600">Válido até {new Date(c.validadeFim).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {itens.slice(0, 4).map((item: any) => (
                        <span key={item.id} className="text-xs bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                          {item.tipo === 'FIXO' ? `${Number(item.proporcao ?? 0)}× ` : '◆ '}
                          {item.produto?.nome?.split(' ').slice(0, 3).join(' ')}
                        </span>
                      ))}
                      {itens.length > 4 && <span className="text-xs text-gray-400">+{itens.length - 4} mais</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="text-gray-300 hover:text-brand-500 transition-colors" title="Duplicar combo" onClick={() => onDuplicar(c.id)}>
                      <Copy size={14} />
                    </button>
                    <button className="text-gray-300 hover:text-gray-500 transition-colors" onClick={() => onSelecionar(c.id)}>
                      <ChevronRight size={16} />
                    </button>
                    {c.ativo && (
                      <button className="text-gray-300 hover:text-red-400 transition-colors"
                        onClick={() => { if(confirm('Desativar este combo?')) desativar.mutate(c.id) }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Formulário de novo/editar combo ─────────────────────────────────────────

function FormCombo({ comboId, duplicarDe, onVoltar }: { comboId?: string; duplicarDe?: string; onVoltar: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!comboId
  const fonteId = comboId ?? duplicarDe

  const [form, setForm] = useState({
    nome: '', descricao: '',
    tabelaId: '', validadeInicio: '', validadeFim: '', ativo: true,
  })
  const [itens, setItens] = useState<ItemForm[]>([])
  const [buscaProd, setBuscaProd] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const { data: combo } = useQuery({
    queryKey: ['combo', fonteId],
    queryFn: () => api.get(`/combos/${fonteId}`).then(r => r.data),
    enabled: !!fonteId,
  })

  useEffect(() => {
    if (!combo) return
    setForm({
      nome: duplicarDe ? `${combo.nome} (cópia)` : combo.nome, descricao: combo.descricao ?? '',
      tabelaId: combo.tabelaId ?? '', validadeInicio: '', validadeFim: '', ativo: combo.ativo,
    })
    setItens((combo.itens ?? []).map((i: any) => ({
      produtoId: i.produtoId, nome: i.produto.nome,
      foto: i.produto.fotoUrl ?? '',
      valorBase: Number(i.produto.valorUnitario ?? 0),
      tipo: (i.tipo ?? 'FIXO') as 'FIXO' | 'VARIAVEL',
      proporcao: i.proporcao != null ? String(i.proporcao) : '1',
      grupo: i.grupo ?? '',
      precoEspecial: i.precoEspecial != null ? String(i.precoEspecial) : '0',
    })))
  }, [combo])

  const { data: tabelas } = useQuery({
    queryKey: ['tabelas'],
    queryFn: () => api.get('/tabelas').then(r => r.data),
  })

  const { data: produtosData } = useQuery({
    queryKey: ['produtos-picker', buscaProd],
    queryFn: () => api.get('/produtos', { params: { busca: buscaProd || undefined, limit: 50, ativo: true } }).then(r => r.data),
  })

  const salvar = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        tabelaId: form.tabelaId || null,
        validadeInicio: form.validadeInicio || null,
        validadeFim: form.validadeFim || null,
        itens: itens.map(i => ({
          produtoId: i.produtoId,
          quantidade: 1,
          tipo: i.tipo,
          proporcao: i.tipo === 'FIXO' ? (parseInt(i.proporcao, 10) || 1) : null,
          grupo: null,
          precoEspecial: num(i.precoEspecial),
        })),
      }
      return isEdit ? api.put(`/combos/${comboId}`, payload) : api.post('/combos', payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Combo atualizado!' : 'Combo criado!')
      qc.invalidateQueries({ queryKey: ['combos'] })
      onVoltar()
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erro ao salvar combo'),
  })

  const adicionarProduto = (p: any) => {
    if (itens.find(i => i.produtoId === p.id)) { toast.error('Produto já adicionado'); return }
    setItens(prev => [...prev, {
      produtoId: p.id, nome: p.nome, foto: p.fotoUrl ?? '',
      valorBase: Number(p.valorUnitario ?? 0),
      tipo: 'FIXO', proporcao: '1', grupo: '', precoEspecial: '',
    }])
    setShowPicker(false)
    setBuscaProd('')
  }

  const atualizarItem = (idx: number, patch: Partial<ItemForm>) => {
    setItens(prev => prev.map((i, ii) => ii === idx ? { ...i, ...patch } : i))
  }

  const validar = (): string | null => {
    if (!form.nome.trim()) return 'Dê um nome ao combo'
    if (itens.length === 0) return 'Adicione pelo menos 1 produto'
    for (const i of itens) {
      if (i.tipo === 'FIXO' && (parseInt(i.proporcao, 10) || 0) < 1) return `Defina a proporção de "${i.nome}"`
      if (num(i.precoEspecial) <= 0) return `Defina o preço de "${i.nome}"`
    }
    return null
  }

  const handleSalvar = () => {
    const erro = validar()
    if (erro) { toast.error(erro); return }
    salvar.mutate()
  }

  const base = precoBase(itens)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600" onClick={onVoltar}><ArrowLeft size={18} /></button>
        <h1 className="text-base font-semibold text-gray-900">{isEdit ? 'Editar combo' : 'Novo combo'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-5">

          {/* Dados básicos */}
          <div className="card p-5 space-y-4">
            <div className="text-sm font-medium text-gray-900">Informações do combo</div>
            <div>
              <label className="label">Nome do combo *</label>
              <input className="input" placeholder="Ex: 02 Creatina + Go Fresh"
                value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <label className="label">Descrição (aparece no app para o representante)</label>
              <textarea className="input resize-none" rows={2} placeholder="Descreva o combo para o representante..."
                value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tabela de preço (deixe vazio para todas)</label>
                <select className="input" value={form.tabelaId} onChange={e => setForm(p => ({ ...p, tabelaId: e.target.value }))}>
                  <option value="">Todas as tabelas</option>
                  {tabelas?.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Válido até (opcional)</label>
                <input type="date" className="input" value={form.validadeFim}
                  onChange={e => setForm(p => ({ ...p, validadeFim: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo-combo" checked={form.ativo}
                onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))} />
              <label htmlFor="ativo-combo" className="text-sm text-gray-600 cursor-pointer">Combo ativo</label>
            </div>
          </div>

          {/* Produtos do combo */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-gray-900">Produtos do combo</div>
              <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={() => setShowPicker(!showPicker)}>
                <Plus size={12} /> Adicionar produto
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              <strong>Fixo</strong>: quantidade calculada pela proporção. <strong>Variável</strong>: sabores que o representante escolhe e mescla.
            </p>

            {/* Picker de produto */}
            {showPicker && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <input className="input text-xs mb-2" placeholder="Buscar produto..."
                  value={buscaProd} onChange={e => setBuscaProd(e.target.value)} autoFocus />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {produtosData?.produtos?.filter((p: any) => !itens.find(i => i.produtoId === p.id)).map((p: any) => (
                    <div key={p.id}
                      className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                      onClick={() => adicionarProduto(p)}>
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} alt={p.nome} className="w-7 h-7 object-contain rounded flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <Package size={10} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{p.nome}</div>
                        <div className="text-xs text-gray-400">{p.codigoInterno} · {fmt(p.valorUnitario ?? 0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itens.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                Adicione os produtos do combo
              </div>
            ) : (
              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div key={item.produtoId} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-3">
                      {item.foto ? (
                        <img src={item.foto} alt={item.nome} className="w-9 h-9 object-contain rounded flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <Package size={12} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{item.nome}</div>
                        <div className="text-xs text-gray-400">Preço base: {fmt(item.valorBase)}</div>
                      </div>
                      <button className="text-gray-300 hover:text-red-400 transition-colors"
                        onClick={() => setItens(prev => prev.filter((_, ii) => ii !== idx))}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-end gap-2 flex-wrap">
                      {/* Tipo */}
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Tipo</div>
                        <div className="flex rounded-md overflow-hidden border border-gray-200">
                          <button
                            className={clsx('text-xs px-3 py-1.5 transition-colors', item.tipo === 'FIXO' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500')}
                            onClick={() => atualizarItem(idx, { tipo: 'FIXO' })}>Fixo</button>
                          <button
                            className={clsx('text-xs px-3 py-1.5 transition-colors border-l border-gray-200', item.tipo === 'VARIAVEL' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500')}
                            onClick={() => atualizarItem(idx, { tipo: 'VARIAVEL' })}>Variável</button>
                        </div>
                      </div>

                      {/* Proporção (apenas FIXO) */}
                      {item.tipo === 'FIXO' && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Proporção</div>
                          <input type="number" min="1" step="1" className="input text-xs w-20 py-1.5"
                            value={item.proporcao}
                            onChange={e => atualizarItem(idx, { proporcao: e.target.value })} />
                        </div>
                      )}

                      {/* Preço especial */}
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Preço especial</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">R$</span>
                          <input className="input text-xs w-24 py-1.5" placeholder="0,00"
                            value={item.precoEspecial}
                            onChange={e => atualizarItem(idx, { precoEspecial: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

          {/* Prévia do preço */}
          {base > 0 && (
            <div className="card p-5">
              <div className="text-sm font-medium text-gray-900 mb-2">Prévia do preço</div>
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <span>Escolhendo 1 unidade da opção variável: </span>
                <strong className="text-gray-900">{fmt(base)}</strong>
                <div className="text-gray-400 mt-1">
                  No app, o representante escolhe a quantidade dos itens variáveis (mesclando sabores) e os itens fixos multiplicam pela proporção.
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center gap-3 justify-end">
            <button className="btn-secondary" onClick={onVoltar}>Cancelar</button>
            <button className="btn-primary flex items-center gap-1.5"
              onClick={handleSalvar}
              disabled={!form.nome || itens.length < 1 || salvar.isPending}>
              {salvar.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar combo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente raiz ──────────────────────────────────────────────────────────

export default function CombosPage() {
  const [view, setView] = useState<'lista' | 'novo' | 'editar' | 'duplicar'>('lista')
  const [comboId, setComboId] = useState<string | undefined>()

  if (view === 'novo') return <FormCombo onVoltar={() => setView('lista')} />
  if (view === 'editar' && comboId) return <FormCombo comboId={comboId} onVoltar={() => setView('lista')} />
  if (view === 'duplicar' && comboId) return <FormCombo duplicarDe={comboId} onVoltar={() => setView('lista')} />

  return (
    <ListaCombos
      onSelecionar={id => { setComboId(id); setView('editar') }}
      onNovo={() => setView('novo')}
      onDuplicar={id => { setComboId(id); setView('duplicar') }}
    />
  )
}
