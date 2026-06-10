'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, Building2, ChevronLeft, ChevronRight, MapPin, Phone, Mail, User, FileText, Edit2, RefreshCw, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import clsx from 'clsx'

export default function ClientesPage() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [dadosEdicao, setDadosEdicao] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', busca, page],
    queryFn: () => api.get('/clientes', { params: { busca: busca || undefined, page, limit: 20 } }).then(r => r.data),
  })

  const { data: detalhe } = useQuery({
    queryKey: ['cliente', detalheId],
    queryFn: () => api.get(`/clientes/${detalheId}`).then(r => r.data),
    enabled: !!detalheId,
  })

  useEffect(() => {
    if (modoEdicao && detalhe) {
      setDadosEdicao({
        razaoSocial: detalhe.razaoSocial ?? '',
        nomeFantasia: detalhe.nomeFantasia ?? '',
        enderecoRua: detalhe.enderecoRua ?? '',
        enderecoNumero: detalhe.enderecoNumero ?? '',
        enderecoComplemento: detalhe.enderecoComplemento ?? '',
        enderecoBairro: detalhe.enderecoBairro ?? '',
        enderecoCidade: detalhe.enderecoCidade ?? '',
        enderecoEstado: detalhe.enderecoEstado ?? '',
        enderecoCep: detalhe.enderecoCep ?? '',
        contatoNome: detalhe.contatoNome ?? '',
        contatoTelefone: detalhe.contatoTelefone ?? '',
        contatoTelefone2: detalhe.contatoTelefone2 ?? '',
        contatoEmail: detalhe.contatoEmail ?? '',
        observacao: detalhe.observacao ?? '',
      })
    } else if (!modoEdicao) {
      setDadosEdicao(null)
    }
  }, [modoEdicao, detalhe])

  useEffect(() => {
    setModoEdicao(false)
  }, [detalheId])

  const salvar = useMutation({
    mutationFn: () => api.patch(`/clientes/${detalheId}`, dadosEdicao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente', detalheId] })
      qc.invalidateQueries({ queryKey: ['clientes'] })
      setModoEdicao(false)
      toast.success('Cliente atualizado!')
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erro ao salvar'),
  })

  const clientes = data?.clientes ?? []
  const total = data?.total ?? 0
  const pages = Math.ceil(total / 20)

  const inputCls = "w-full text-xs font-medium text-gray-900 mt-0.5 border border-gray-200 rounded px-2 py-1 bg-white outline-none focus:border-brand-500"

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={clsx('flex-1 flex flex-col overflow-hidden', detalheId && 'max-w-[58%]')}>
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-semibold text-gray-900">Clientes</h1>
        </div>
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-xs" placeholder="Buscar por razão social, CNPJ..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1) }} />
          </div>
          <div className="text-xs text-gray-500 ml-auto">{total} clientes</div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-sm text-gray-400 text-center py-12">Carregando...</div>
          ) : clientes.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-12">Nenhum cliente encontrado</div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-xs font-medium text-gray-500 text-left px-4 py-2">Razão Social</th>
                    <th className="text-xs font-medium text-gray-500 text-left px-4 py-2">CNPJ</th>
                    <th className="text-xs font-medium text-gray-500 text-left px-4 py-2">Cidade</th>
                    <th className="text-xs font-medium text-gray-500 text-left px-4 py-2">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c: any) => (
                    <tr key={c.id}
                      className={clsx('hover:bg-gray-50 transition-colors cursor-pointer', detalheId === c.id && 'bg-brand-50')}
                      onClick={() => setDetalheId(c.id === detalheId ? null : c.id)}>
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-gray-900">{c.razaoSocial}</div>
                        {c.nomeFantasia && <div className="text-xs text-gray-400 mt-0.5">{c.nomeFantasia}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">{c.cnpj ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{c.enderecoCidade ?? '—'}/{c.enderecoEstado ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{c.contatoTelefone ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-gray-400">{page} / {pages}</span>
              <button className="btn-secondary p-1.5" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft size={14}/></button>
              <button className="btn-secondary p-1.5" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}><ChevronRight size={14}/></button>
            </div>
          )}
        </div>
      </div>

      {detalheId && detalhe && (
        <div className="w-[42%] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-semibold text-gray-900 truncate">{detalhe.razaoSocial}</div>
              {detalhe.nomeFantasia && <div className="text-xs text-gray-400 mt-0.5 truncate">{detalhe.nomeFantasia}</div>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!modoEdicao && (
                <button onClick={() => setModoEdicao(true)} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-50">
                  <Edit2 size={12}/> Editar
                </button>
              )}
              <button onClick={() => { setDetalheId(null); setModoEdicao(false) }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Identificação (em modo edição) */}
            {modoEdicao && dadosEdicao && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-3">Identificação</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400">Razão Social</div>
                    <input className={inputCls} value={dadosEdicao.razaoSocial} onChange={e => setDadosEdicao({ ...dadosEdicao, razaoSocial: e.target.value })} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Nome Fantasia</div>
                    <input className={inputCls} value={dadosEdicao.nomeFantasia} onChange={e => setDadosEdicao({ ...dadosEdicao, nomeFantasia: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>
              </div>
            )}

            {/* Dados fiscais (sempre só leitura) */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
                <FileText size={12}/> Dados fiscais
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['CNPJ / CPF', detalhe.cnpj, true],
                  ['Inscrição estadual', detalhe.inscricaoEstadual, false],
                  ['Código Omie', detalhe.omie_codigo, true],
                  ['Origem', detalhe.cadastradoPeloApp ? 'App mobile' : 'Omie', false],
                ].map(([label, value, mono]: any) => (
                  <div key={label}>
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className={`text-xs font-medium text-gray-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Endereço */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
                <MapPin size={12}/> Endereço
              </div>
              {modoEdicao && dadosEdicao ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <div className="text-xs text-gray-400">Rua / Av.</div>
                      <input className={inputCls} value={dadosEdicao.enderecoRua} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoRua: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Número</div>
                      <input className={inputCls} value={dadosEdicao.enderecoNumero} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoNumero: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Complemento</div>
                    <input className={inputCls} value={dadosEdicao.enderecoComplemento} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoComplemento: e.target.value })} placeholder="Opcional" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">Bairro</div>
                      <input className={inputCls} value={dadosEdicao.enderecoBairro} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoBairro: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">CEP</div>
                      <input className={inputCls} value={dadosEdicao.enderecoCep} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoCep: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">Cidade</div>
                      <input className={inputCls} value={dadosEdicao.enderecoCidade} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoCidade: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Estado (UF)</div>
                      <input className={inputCls} maxLength={2} value={dadosEdicao.enderecoEstado} onChange={e => setDadosEdicao({ ...dadosEdicao, enderecoEstado: e.target.value.toUpperCase().slice(0,2) })} />
                    </div>
                  </div>
                </div>
              ) : detalhe.enderecoRua ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <div className="text-xs text-gray-400">Rua / Av.</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.enderecoRua}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Número</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.enderecoNumero ?? 'S/N'}</div>
                    </div>
                  </div>
                  {detalhe.enderecoComplemento && (
                    <div>
                      <div className="text-xs text-gray-400">Complemento</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.enderecoComplemento}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">Bairro</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.enderecoBairro ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">CEP</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5 font-mono">{detalhe.enderecoCep ?? '—'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">Cidade</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.enderecoCidade ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Estado</div>
                      <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.enderecoEstado ?? '—'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Endereço não informado</div>
              )}
            </div>

            {/* Contato */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
                <User size={12}/> Contato
              </div>
              {modoEdicao && dadosEdicao ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-400">Responsável</div>
                    <input className={inputCls} value={dadosEdicao.contatoNome} onChange={e => setDadosEdicao({ ...dadosEdicao, contatoNome: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">Telefone</div>
                      <input className={inputCls} value={dadosEdicao.contatoTelefone} onChange={e => setDadosEdicao({ ...dadosEdicao, contatoTelefone: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Telefone 2</div>
                      <input className={inputCls} value={dadosEdicao.contatoTelefone2} onChange={e => setDadosEdicao({ ...dadosEdicao, contatoTelefone2: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Email</div>
                    <input className={inputCls} type="email" value={dadosEdicao.contatoEmail} onChange={e => setDadosEdicao({ ...dadosEdicao, contatoEmail: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: 'Responsável', value: detalhe.contatoNome },
                    { label: 'Telefone',    value: detalhe.contatoTelefone },
                    { label: 'Telefone 2',  value: detalhe.contatoTelefone2 },
                    { label: 'Email',       value: detalhe.contatoEmail },
                  ].filter(f => f.value).map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs font-medium text-gray-900 text-right">{value}</span>
                    </div>
                  ))}
                  {!detalhe.contatoNome && !detalhe.contatoTelefone && !detalhe.contatoEmail && (
                    <div className="text-xs text-gray-400">Sem contato cadastrado</div>
                  )}
                </div>
              )}
            </div>

            {/* Tabelas de preço */}
            {!modoEdicao && detalhe.tabelasCliente?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Tabelas de preço</div>
                {detalhe.tabelasCliente.map((ct: any) => (
                  <div key={ct.tabelaId} className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-900">{ct.tabela.nome}</span>
                    {ct.padrao && <span className="badge-blue">Padrão</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Observação */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Observações</div>
              {modoEdicao && dadosEdicao ? (
                <textarea
                  className={inputCls + ' min-h-[60px]'}
                  value={dadosEdicao.observacao}
                  onChange={e => setDadosEdicao({ ...dadosEdicao, observacao: e.target.value })}
                  placeholder="Anotações sobre o cliente..."
                />
              ) : detalhe.observacao ? (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">{detalhe.observacao}</div>
              ) : (
                <div className="text-xs text-gray-400">Sem observações</div>
              )}
            </div>

            {/* Últimos pedidos */}
            {!modoEdicao && detalhe.pedidos?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Últimos pedidos</div>
                {detalhe.pedidos.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-mono text-gray-500">{p.id.slice(0,8).toUpperCase()}</span>
                    <span className="text-xs font-medium text-gray-900">{Number(p.total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
                    <span className="text-xs text-gray-400">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}

            {!modoEdicao && (
              <div className="text-xs text-gray-300 text-center pt-2">
                {detalhe.sincronizadoEm
                  ? `Sincronizado em ${new Date(detalhe.sincronizadoEm).toLocaleString('pt-BR')}`
                  : `Cadastrado em ${new Date(detalhe.criadoEm).toLocaleString('pt-BR')}`}
              </div>
            )}
          </div>

          {/* Rodapé: ações de edição */}
          {modoEdicao && (
            <div className="p-4 border-t border-gray-100 flex items-center gap-2">
              <button
                onClick={() => setModoEdicao(false)}
                className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1.5"
                disabled={salvar.isPending}
              >
                <X size={14}/> Cancelar
              </button>
              <button
                onClick={() => salvar.mutate()}
                disabled={salvar.isPending || !dadosEdicao?.razaoSocial}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white py-2 rounded text-sm flex items-center justify-center gap-1.5 font-medium"
              >
                {salvar.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14}/>}
                Salvar alterações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
