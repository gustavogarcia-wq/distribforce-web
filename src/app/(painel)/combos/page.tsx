'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Package, Trash2, Gift, ChevronRight, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Lista de combos ──────────────────────────────────────────────────────────

function ListaCombos({ onSelecionar, onNovo }: { onSelecionar: (id: string) => void; onNovo: () => void }) {
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
          <p className="text-xs text-gray-400 mt-0.5">Kits fixos com preço especial para o representante oferecer</p>
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
              const valorOriginal = c.itens?.reduce((s: number, i: any) => s + Number(i.quantidade) * Number(i.produto?.valorUnitario ?? 0), 0) ?? 0
              const economia = valorOriginal - Number(c.precoEspecial)
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
                      <span>{c.itens?.length ?? 0} produtos no kit</span>
                      <span className="font-medium text-gray-900">{fmt(Number(c.precoEspecial))}</span>
                      {economia > 0 && <span className="text-green-600">Economia de {fmt(economia)}</span>}
                      {c.validadeFim && <span className="text-amber-600">Válido até {new Date(c.validadeFim).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {c.itens?.slice(0, 4).map((item: any) => (
                        <span key={item.id} className="text-xs bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                          {Number(item.quantidade)}× {item.produto?.nome?.split(' ').slice(0, 3).join(' ')}
                        </span>
                      ))}
                      {c.itens?.length > 4 && <span className="text-xs text-gray-400">+{c.itens.length - 4} mais</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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

function FormCombo({ comboId, onVoltar }: { comboId?: string; onVoltar: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!comboId

  const [form, setForm] = useState({
    nome: '', descricao: '', precoEspecial: '',
    tabelaId: '', validadeInicio: '', validadeFim: '', ativo: true,
  })
  const [itens, setItens] = useState<{ produtoId: string; nome: string; foto: string; quantidade: number; valorBase: number }[]>([])
  const [buscaProd, setBuscaProd] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const { data: combo } = useQuery({
    queryKey: ['combo', comboId],
    queryFn: () => api.get(`/combos/${comboId}`).then(r => r.data),
    enabled: isEdit,
    onSuccess: (data: any) => {
      setForm({
        nome: data.nome, descricao: data.descricao ?? '',
        precoEspecial: String(data.precoEspecial),
        tabelaId: data.tabelaId ?? '', validadeInicio: '', validadeFim: '', ativo: data.ativo,
      })
      setItens(data.itens.map((i: any) => ({
        produtoId: i.produtoId, nome: i.produto.nome,
        foto: i.produto.fotoUrl ?? '', quantidade: Number(i.quantidade),
        valorBase: Number(i.produto.valorUnitario ?? 0),
      })))
    }
  } as any)

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
        precoEspecial: Number(form.precoEspecial.replace(',', '.')),
        tabelaId: form.tabelaId || null,
        validadeInicio: form.validadeInicio || null,
        validadeFim: form.validadeFim || null,
        itens: itens.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
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
    setItens(prev => [...prev, { produtoId: p.id, nome: p.nome, foto: p.fotoUrl ?? '', quantidade: 1, valorBase: Number(p.valorUnitario ?? 0) }])
    setShowPicker(false)
    setBuscaProd('')
  }

  const valorOriginal = itens.reduce((s, i) => s + i.quantidade * i.valorBase, 0)
  const precoFinal = Number(form.precoEspecial.replace(',', '.')) || 0
  const economia = valorOriginal - precoFinal

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
              <input className="input" placeholder="Ex: Kit Verão, Combo Proteína..."
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
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-900">Produtos do kit</div>
              <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={() => setShowPicker(!showPicker)}>
                <Plus size={12} /> Adicionar produto
              </button>
            </div>

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
                Adicione pelo menos 2 produtos ao combo
              </div>
            ) : (
              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div key={item.produtoId} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Qtd:</span>
                      <input type="number" min="1" step="1" className="input text-xs w-16 py-1"
                        value={item.quantidade}
                        onChange={e => setItens(prev => prev.map((i, ii) => ii === idx ? { ...i, quantidade: Number(e.target.value) } : i))} />
                    </div>
                    <button className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                      onClick={() => setItens(prev => prev.filter((_, ii) => ii !== idx))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preço especial */}
          <div className="card p-5">
            <div className="text-sm font-medium text-gray-900 mb-4">Preço do combo</div>
            {valorOriginal > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <span>Valor unitário total: <strong>{fmt(valorOriginal)}</strong></span>
                {economia > 0 && <span className="text-green-600">Economia: <strong>{fmt(economia)}</strong> ({Math.round(economia / valorOriginal * 100)}%)</span>}
                {economia < 0 && <span className="text-red-500">Atenção: preço especial acima do valor individual</span>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">R$</span>
              <input className="input w-40 text-lg font-semibold"
                placeholder="0,00"
                value={form.precoEspecial}
                onChange={e => setForm(p => ({ ...p, precoEspecial: e.target.value }))} />
              {valorOriginal > 0 && precoFinal > 0 && (
                <span className="text-xs text-gray-400 ml-1">
                  = {Math.round((1 - precoFinal / valorOriginal) * 100)}% de desconto sobre valor individual
                </span>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 justify-end">
            <button className="btn-secondary" onClick={onVoltar}>Cancelar</button>
            <button className="btn-primary flex items-center gap-1.5"
              onClick={() => salvar.mutate()}
              disabled={!form.nome || !form.precoEspecial || itens.length < 2 || salvar.isPending}>
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
  const [view, setView] = useState<'lista' | 'novo' | 'editar'>('lista')
  const [comboId, setComboId] = useState<string | undefined>()

  if (view === 'novo') return <FormCombo onVoltar={() => setView('lista')} />
  if (view === 'editar' && comboId) return <FormCombo comboId={comboId} onVoltar={() => setView('lista')} />

  return (
    <ListaCombos
      onSelecionar={id => { setComboId(id); setView('editar') }}
      onNovo={() => setView('novo')}
    />
  )
}
