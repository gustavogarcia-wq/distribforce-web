'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, Building2, ChevronLeft, ChevronRight, MapPin, Phone, Mail, User, FileText } from 'lucide-react'
import clsx from 'clsx'

export default function ClientesPage() {
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [detalheId, setDetalheId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', busca, page],
    queryFn: () => api.get('/clientes', { params: { busca: busca || undefined, page, limit: 20 } }).then(r => r.data),
  })

  const { data: detalhe } = useQuery({
    queryKey: ['cliente', detalheId],
    queryFn: () => api.get(`/clientes/${detalheId}`).then(r => r.data),
    enabled: !!detalheId,
  })

  const clientes = data?.clientes ?? []
  const total = data?.total ?? 0
  const pages = Math.ceil(total / 20)

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={clsx('flex-1 flex flex-col overflow-hidden', detalheId && 'max-w-[58%]')}>
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-semibold text-gray-900">Clientes</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} clientes na carteira</p>
        </div>

        <div className="bg-white border-b border-gray-100 px-6 py-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-xs" placeholder="Buscar por nome, CNPJ, cidade ou email..."
              value={busca} onChange={e => { setBusca(e.target.value); setPage(1) }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <svg className="animate-spin w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/></svg>
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Building2 size={32} strokeWidth={1} />
              <p className="text-sm mt-2">Nenhum cliente encontrado</p>
              <p className="text-xs mt-1 text-center max-w-xs">Sincronize com o Omie em Configurações para importar sua carteira</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-2.5 font-medium text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">CNPJ / CPF</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Cidade / UF</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Contato</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Vendedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((c: any) => (
                  <tr key={c.id}
                    className={clsx('hover:bg-gray-50 transition-colors cursor-pointer', detalheId === c.id && 'bg-brand-50')}
                    onClick={() => setDetalheId(c.id === detalheId ? null : c.id)}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900">{c.razaoSocial}</div>
                      {c.nomeFantasia && <div className="text-gray-400">{c.nomeFantasia}</div>}
                      {c.cadastradoPeloApp && <span className="badge-blue">App</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">{c.cnpj ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.enderecoCidade ? `${c.enderecoCidade}${c.enderecoEstado ? ` / ${c.enderecoEstado}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{c.contatoNome ?? '—'}</div>
                      {c.contatoTelefone && <div className="text-gray-400">{c.contatoTelefone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.vendedor?.usuario?.nome ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Página {page} de {pages}</span>
            <div className="flex items-center gap-1">
              <button className="btn-secondary p-1.5" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft size={14}/></button>
              <button className="btn-secondary p-1.5" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Painel de detalhe */}
      {detalheId && detalhe && (
        <div className="w-[42%] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{detalhe.razaoSocial}</div>
              {detalhe.nomeFantasia && <div className="text-xs text-gray-400 mt-0.5">{detalhe.nomeFantasia}</div>}
            </div>
            <button onClick={() => setDetalheId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Dados fiscais */}
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
              {detalhe.enderecoRua ? (
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
              </div>
            </div>

            {/* Tabelas de preço */}
            {detalhe.tabelasCliente?.length > 0 && (
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
            {detalhe.observacao && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Observações</div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">{detalhe.observacao}</div>
              </div>
            )}

            {/* Últimos pedidos */}
            {detalhe.pedidos?.length > 0 && (
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

            <div className="text-xs text-gray-300 text-center pt-2">
              {detalhe.sincronizadoEm
                ? `Sincronizado em ${new Date(detalhe.sincronizadoEm).toLocaleString('pt-BR')}`
                : `Cadastrado em ${new Date(detalhe.criadoEm).toLocaleString('pt-BR')}`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
