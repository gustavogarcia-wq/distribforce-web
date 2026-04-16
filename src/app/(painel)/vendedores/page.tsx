'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Users, ArrowLeft, Save, UserCheck, MapPin } from 'lucide-react'
import clsx from 'clsx'

const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
]

const PERFIS = [
  { value: 'REPRESENTANTE', label: 'Representante' },
  { value: 'GESTOR',        label: 'Gestor' },
  { value: 'OPERADOR',      label: 'Operador' },
]

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function ListaVendedores({ onNovo, onEditar }: { onNovo: () => void; onEditar: (id: string) => void }) {
  const { data: vendedores, isLoading } = useQuery({
    queryKey: ['vendedores-lista'],
    queryFn: () => api.get('/relatorios/vendedores').then(r => r.data),
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Vendedores</h1>
          <p className="text-xs text-gray-400 mt-0.5">{vendedores?.length ?? 0} vendedores cadastrados</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={onNovo}>
          <Plus size={14} /> Novo vendedor
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/>
            </svg>
          </div>
        ) : !vendedores?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users size={32} strokeWidth={1} />
            <p className="text-sm mt-2">Nenhum vendedor cadastrado</p>
            <p className="text-xs mt-1">Clique em "Novo vendedor" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {vendedores.map((v: any) => {
              const fat = v.pedidos?.reduce((s: number, p: any) => s + Number(p.total), 0) ?? 0
              const meta = Number(v.metas?.[0]?.valorMeta ?? 0)
              const pct = meta > 0 ? Math.min((fat / meta) * 100, 100) : 0
              const initials = v.usuario.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

              return (
                <div key={v.id}
                  className="card p-4 flex items-center gap-4 cursor-pointer hover:border-brand-300 transition-colors"
                  onClick={() => onEditar(v.usuarioId ?? v.usuario?.id)}>
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-sm font-medium text-brand-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{v.usuario.nome}</span>
                      <span className={v.ativo !== false ? 'badge-green' : 'badge-gray'}>
                        {v.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                      {v.regiao?.nome && <span className="badge-blue">{v.regiao.nome}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{v.usuario.email}</span>
                      {v.telefone && <span>{v.telefone}</span>}
                    </div>
                    {meta > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-brand-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{fmt(fat)} / {fmt(meta)} ({Math.round(pct)}%)</span>
                      </div>
                    )}
                  </div>
                  <span className="text-gray-300 text-lg flex-shrink-0">›</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FormVendedor({ usuarioId, onVoltar }: { usuarioId?: string; onVoltar: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!usuarioId
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'carteira'>('dados')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', perfil: 'REPRESENTANTE',
    telefone: '', estados: ['MG'], metaMensal: '', ativo: true,
  })
  const [carregado, setCarregado] = useState(false)

  useQuery({
    queryKey: ['usuario-detalhe', usuarioId],
    queryFn: () => api.get(`/usuarios/${usuarioId}`).then(r => r.data),
    enabled: isEdit && !carregado,
    onSuccess: (data: any) => {
      setForm({
        nome:       data.nome ?? '',
        email:      data.email ?? '',
        senha:      '',
        perfil:     data.perfil ?? 'REPRESENTANTE',
        telefone:   data.vendedor?.telefone ?? '',
        estados:    data.vendedor?.estados?.length ? data.vendedor.estados : [data.vendedor?.regiao?.nome ?? 'MG'],
        metaMensal: data.vendedor?.metaMensal ? String(Math.round(Number(data.vendedor.metaMensal))) : '',
        ativo:      data.ativo ?? true,
      })
      setCarregado(true)
    }
  } as any)

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-carteira', usuarioId, buscaCliente],
    queryFn: () => api.get('/clientes', {
      params: { vendedor_id: usuarioId, busca: buscaCliente || undefined, limit: 50 }
    }).then(r => r.data),
    enabled: isEdit && abaAtiva === 'carteira',
  })

  const salvar = useMutation({
    mutationFn: () => isEdit
      ? api.patch(`/usuarios/${usuarioId}`, {
          nome:       form.nome,
          ativo:      form.ativo,
          ...(form.senha ? { senhaHash: form.senha } : {}),
        })
      : api.post('/usuarios', {
          nome:       form.nome,
          email:      form.email,
          senha:      form.senha,
          perfil:     form.perfil,
          telefone:   form.telefone || undefined,
          estados:    form.estados,
          metaMensal: form.metaMensal ? Number(form.metaMensal) : 0,
          ativo:      form.ativo,
        }),
    onSuccess: () => {
      toast.success(isEdit ? 'Vendedor atualizado!' : 'Vendedor criado com sucesso!')
      qc.invalidateQueries({ queryKey: ['vendedores-lista'] })
      onVoltar()
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erro ao salvar'),
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onVoltar}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          {isEdit ? `Editar vendedor` : 'Novo vendedor'}
        </h1>
      </div>

      {isEdit && (
        <div className="bg-white border-b border-gray-100 px-6 flex gap-1">
          {[['dados', 'Dados cadastrais'], ['carteira', 'Carteira de clientes']].map(([k, v]) => (
            <button key={k} onClick={() => setAbaAtiva(k as any)}
              className={clsx('px-3 py-2.5 text-xs border-b-2 transition-colors',
                abaAtiva === k ? 'border-brand-500 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {v}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">

        {abaAtiva === 'dados' && (
          <div className="max-w-xl space-y-5">

            <div className="card p-5 space-y-4">
              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <UserCheck size={14} className="text-brand-600" /> Dados pessoais
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nome completo *</label>
                  <input className="input" placeholder="Nome do vendedor"
                    value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" placeholder="email@empresa.com"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    disabled={isEdit} />
                  {isEdit && <p className="text-xs text-gray-400 mt-1">Email não pode ser alterado</p>}
                </div>
                <div>
                  <label className="label">Telefone / WhatsApp</label>
                  <input className="input" placeholder="(11) 99999-0000"
                    value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{isEdit ? 'Nova senha (vazio = manter)' : 'Senha *'}</label>
                  <input type="password" className="input"
                    placeholder={isEdit ? 'Deixe vazio para não alterar' : 'Mínimo 6 caracteres'}
                    value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Perfil de acesso *</label>
                  <select className="input" value={form.perfil}
                    onChange={e => setForm(p => ({ ...p, perfil: e.target.value }))}
                    disabled={isEdit}>
                    {PERFIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo-vend" checked={form.ativo}
                  onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))} />
                <label htmlFor="ativo-vend" className="text-sm text-gray-600 cursor-pointer">Vendedor ativo</label>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <MapPin size={14} className="text-brand-600" /> Região e meta
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Estados de atuação *</label>
                  <div className="grid grid-cols-6 gap-2 mt-1">
                    {ESTADOS.map(e => (
                      <label key={e} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={form.estados.includes(e)}
                          onChange={ev => setForm(p => ({
                            ...p,
                            estados: ev.target.checked
                              ? [...p.estados, e]
                              : p.estados.filter(s => s !== e)
                          }))} />
                        <span className="text-xs text-gray-700">{e}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Verá apenas clientes destes estados</p>
                </div>
                <div>
                  <label className="label">Meta mensal (R$)</label>
                  <input type="number" min="0" className="input" placeholder="Ex: 50000"
                    value={form.metaMensal}
                    onChange={e => setForm(p => ({ ...p, metaMensal: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button className="btn-secondary" onClick={onVoltar}>Cancelar</button>
              <button className="btn-primary flex items-center gap-1.5"
                onClick={() => salvar.mutate()}
                disabled={!form.nome || !form.email || (!isEdit && !form.senha) || !form.estados.length || salvar.isPending}>
                <Save size={14} />
                {salvar.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar vendedor'}
              </button>
            </div>
          </div>
        )}

        {abaAtiva === 'carteira' && isEdit && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <input className="input text-xs max-w-sm" placeholder="Buscar cliente na carteira..."
                value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} />
              <span className="text-xs text-gray-400">{clientesData?.total ?? 0} clientes</span>
            </div>
            {!clientesData?.clientes?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <p className="text-sm">Nenhum cliente vinculado ainda</p>
                <p className="text-xs mt-1">Clientes do estados {form.estados.join(", ")} aparecerão aqui após o sync</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Cliente</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">CNPJ</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Cidade</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Telefone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientesData.clientes.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{c.razaoSocial}</div>
                          {c.nomeFantasia && <div className="text-gray-400">{c.nomeFantasia}</div>}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500">{c.cnpj ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{c.enderecoCidade ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{c.contatoTelefone ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VendedoresPage() {
  const [view, setView] = useState<'lista' | 'novo' | 'editar'>('lista')
  const [usuarioId, setUsuarioId] = useState<string | undefined>()

  if (view === 'novo')   return <FormVendedor onVoltar={() => setView('lista')} />
  if (view === 'editar') return <FormVendedor usuarioId={usuarioId} onVoltar={() => setView('lista')} />

  return (
    <ListaVendedores
      onNovo={() => setView('novo')}
      onEditar={id => { setUsuarioId(id); setView('editar') }}
    />
  )
}
