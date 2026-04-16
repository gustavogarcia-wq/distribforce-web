'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProdutosPage() {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [page, setPage] = useState(1)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [apenasAtivos, setApenasAtivos] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['produtos', busca, categoria, page, apenasAtivos],
    queryFn: () => api.get('/produtos', {
      params: { busca: busca || undefined, categoria: categoria || undefined, page, limit: 24, ativo: apenasAtivos || undefined }
    }).then(r => r.data),
  })

  const { data: categorias } = useQuery({
    queryKey: ['produtos-categorias'],
    queryFn: () => api.get('/produtos', { params: { limit: 500 } }).then(r => {
      const cats = [...new Set(r.data.produtos?.map((p: any) => p.categoria).filter(Boolean))] as string[]
      return cats.sort()
    }),
  })

  const { data: detalhe } = useQuery({
    queryKey: ['produto', detalheId],
    queryFn: () => api.get(`/produtos/${detalheId}`).then(r => r.data),
    enabled: !!detalheId,
  })

  const produtos = data?.produtos ?? []
  const total = data?.total ?? 0
  const pages = Math.ceil(total / 24)

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* Lista */}
      <div className={clsx('flex-1 flex flex-col overflow-hidden', detalheId && 'max-w-[60%]')}>
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Produtos</h1>
            <p className="text-xs text-gray-400 mt-0.5">{total} produtos sincronizados do Omie</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-xs w-56" placeholder="Buscar por nome ou código..."
              value={busca} onChange={e => { setBusca(e.target.value); setPage(1) }} />
          </div>

          <select className="input text-xs w-44"
            value={categoria} onChange={e => { setCategoria(e.target.value); setPage(1) }}>
            <option value="">Todas as categorias</option>
            {categorias?.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
            <input type="checkbox" checked={apenasAtivos}
              onChange={e => { setApenasAtivos(e.target.checked); setPage(1) }} />
            Apenas ativos
          </label>

          {(busca || categoria) && (
            <button className="btn-secondary text-xs"
              onClick={() => { setBusca(''); setCategoria(''); setPage(1) }}>Limpar</button>
          )}
          <div className="ml-auto text-xs text-gray-400">{total} produtos</div>
        </div>

        {/* Grid de produtos */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <svg className="animate-spin w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/>
              </svg>
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package size={32} strokeWidth={1} />
              <p className="text-sm mt-2">Nenhum produto encontrado</p>
              <p className="text-xs mt-1">Use Configurações → Sync produtos para importar do Omie</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {produtos.map((p: any) => (
                <div key={p.id}
                  className={clsx('card p-3 cursor-pointer hover:border-brand-300 transition-colors', detalheId === p.id && 'border-brand-400 bg-brand-50')}
                  onClick={() => setDetalheId(p.id === detalheId ? null : p.id)}>

                  {/* Foto */}
                  <div className="w-full h-28 bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} alt={p.nome}
                        className="w-full h-full object-contain"
                        onError={(e: any) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                    ) : null}
                    <div className={clsx('w-full h-full items-center justify-center text-gray-300', p.fotoUrl ? 'hidden' : 'flex')}>
                      <Package size={28} strokeWidth={1} />
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    {p.categoria && (
                      <span className="badge-gray text-xs mb-1 inline-block">{p.categoria}</span>
                    )}
                    <div className="text-xs font-medium text-gray-900 leading-tight line-clamp-2 mb-2">{p.nome}</div>
                    <div className="flex items-center justify-between">
                      {p.codigoInterno && (
                        <span className="text-xs font-mono text-gray-400">SKU {p.codigoInterno}</span>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-xs text-gray-400">{p.unidade}</span>
                        {!p.ativo && <span className="badge-red">Inativo</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
        <div className="w-[40%] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 pr-4 leading-tight">{detalhe.nome}</div>
            <button onClick={() => setDetalheId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Foto grande */}
            <div className="w-full h-48 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
              {detalhe.fotoUrl ? (
                <img src={detalhe.fotoUrl} alt={detalhe.nome} className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <Package size={40} strokeWidth={1} />
                  <span className="text-xs mt-1">Sem foto</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={detalhe.ativo ? 'badge-green' : 'badge-red'}>
                {detalhe.ativo ? 'Ativo' : 'Inativo'}
              </span>
              {detalhe.categoria && <span className="badge-gray">{detalhe.categoria}</span>}
            </div>

            {/* Dados principais */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Código interno', detalhe.codigoInterno, true],
                ['Código Omie',    detalhe.omie_codigo,   true],
                ['EAN / Código de barras', detalhe.ean,   true],
                ['NCM',            detalhe.ncm,           true],
                ['Unidade',        detalhe.unidade,       false],
                ['Preço base',     fmt(detalhe.valorUnitario ?? 0), false],
              ].map(([label, value, mono]: any) => value ? (
                <div key={label}>
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className={`text-xs font-medium text-gray-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</div>
                </div>
              ) : null)}
            </div>

            {/* Estoque */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 mb-2">Estoque</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Atual</div>
                  <div className="text-lg font-semibold text-gray-900">{Number(detalhe.estoque).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-gray-400">{detalhe.unidade}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Mínimo</div>
                  <div className="text-lg font-semibold text-gray-900">{Number(detalhe.estoqueMinimo ?? 0).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-gray-400">{detalhe.unidade}</div>
                </div>
              </div>
              {Number(detalhe.estoque) <= Number(detalhe.estoqueMinimo ?? 0) && Number(detalhe.estoqueMinimo) > 0 && (
                <div className="mt-2 badge-amber">Estoque abaixo do mínimo</div>
              )}
            </div>

            {/* Peso */}
            {(detalhe.pesoBruto || detalhe.pesoLiquido) && (
              <div className="grid grid-cols-2 gap-3">
                {detalhe.pesoBruto && (
                  <div>
                    <div className="text-xs text-gray-400">Peso bruto</div>
                    <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.pesoBruto} kg</div>
                  </div>
                )}
                {detalhe.pesoLiquido && (
                  <div>
                    <div className="text-xs text-gray-400">Peso líquido</div>
                    <div className="text-xs font-medium text-gray-900 mt-0.5">{detalhe.pesoLiquido} kg</div>
                  </div>
                )}
              </div>
            )}

            {detalhe.descricao && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Descrição detalhada</div>
                <div className="text-xs text-gray-600 leading-relaxed">{detalhe.descricao}</div>
              </div>
            )}

            <div className="text-xs text-gray-300 text-center pt-2">
              Sincronizado em {new Date(detalhe.sincronizadoEm ?? detalhe.criadoEm).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
