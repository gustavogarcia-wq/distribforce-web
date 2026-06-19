'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { RefreshCw, Plus, CheckCircle, XCircle, Image as ImageIcon, Trash2, Upload } from 'lucide-react'

export default function ConfiguracoesPage() {
  const qc = useQueryClient()
  const [novaTabela, setNovaTabela] = useState({ nome: '', descontoMaximo: 0, ativa: true })
  const [showForm, setShowForm] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const { data: banner } = useQuery({
    queryKey: ['banner'],
    queryFn: () => api.get('/banner').then(r => r.data),
  })
  const subirBanner = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('imagem', bannerFile as File)
      return api.post('/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { toast.success('Banner atualizado!'); setBannerFile(null); qc.invalidateQueries({ queryKey: ['banner'] }) },
    onError: () => toast.error('Erro ao subir o banner'),
  })
  const removerBanner = useMutation({
    mutationFn: () => api.delete('/banner'),
    onSuccess: () => { toast.success('Banner removido!'); qc.invalidateQueries({ queryKey: ['banner'] }) },
    onError: () => toast.error('Erro ao remover o banner'),
  })

  const { data: tabelas, isLoading: loadTabelas } = useQuery({
    queryKey: ['tabelas'],
    queryFn: () => api.get('/tabelas').then(r => r.data),
  })

  const { data: omieStatus } = useQuery({
    queryKey: ['omie-status'],
    queryFn: () => api.get('/omie/status').then(r => r.data),
    refetchInterval: 30000,
  })

  const criarTabela = useMutation({
    mutationFn: () => api.post('/tabelas', novaTabela),
    onSuccess: () => {
      toast.success('Tabela criada!')
      qc.invalidateQueries({ queryKey: ['tabelas'] })
      setShowForm(false)
      setNovaTabela({ nome: '', descontoMaximo: 0, ativa: true })
    },
    onError: () => toast.error('Erro ao criar tabela'),
  })

  const syncClientes = useMutation({
    mutationFn: () => api.post('/omie/sync/clientes'),
    onSuccess: (r) => toast.success(`Sync concluído: ${r.data.criados} criados, ${r.data.atualizados} atualizados`),
    onError: () => toast.error('Erro ao sincronizar clientes'),
  })

  const syncProdutos = useMutation({
    mutationFn: () => api.post('/omie/sync/produtos'),
    onSuccess: (r) => toast.success(`Sync concluído: ${r.data.criados} criados, ${r.data.atualizados} atualizados`),
    onError: () => toast.error('Erro ao sincronizar produtos'),
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-base font-semibold text-gray-900">Configurações</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Integração Omie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Integração Omie</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sincronize clientes, produtos e tabelas de preço</p>
            </div>
            <div className="flex items-center gap-2">
              {omieStatus?.conectado ? (
                <span className="badge-green flex items-center gap-1"><CheckCircle size={10} /> Conectado</span>
              ) : (
                <span className="badge-red flex items-center gap-1"><XCircle size={10} /> Desconectado</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="btn-secondary flex items-center justify-center gap-2 py-2.5"
              onClick={() => syncClientes.mutate()}
              disabled={syncClientes.isPending}
            >
              <RefreshCw size={14} className={syncClientes.isPending ? 'animate-spin' : ''} />
              {syncClientes.isPending ? 'Sincronizando...' : 'Sync clientes'}
            </button>
            <button
              className="btn-secondary flex items-center justify-center gap-2 py-2.5"
              onClick={() => syncProdutos.mutate()}
              disabled={syncProdutos.isPending}
            >
              <RefreshCw size={14} className={syncProdutos.isPending ? 'animate-spin' : ''} />
              {syncProdutos.isPending ? 'Sincronizando...' : 'Sync produtos'}
            </button>
          </div>

          {omieStatus?.verificadoEm && (
            <p className="text-xs text-gray-400 mt-3">
              Verificado em {new Date(omieStatus.verificadoEm).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {/* Tabelas de preço */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Tabelas de preço</h2>
              <p className="text-xs text-gray-400 mt-0.5">Gerencie as tabelas disponíveis para os representantes</p>
            </div>
            <button className="btn-primary flex items-center gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
              <Plus size={13} /> Nova tabela
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome da tabela</label>
                  <input className="input text-xs" placeholder="Ex: Atacado Volume" value={novaTabela.nome}
                    onChange={e => setNovaTabela(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Desconto máximo (%)</label>
                  <input type="number" min="0" max="100" className="input text-xs" value={novaTabela.descontoMaximo}
                    onChange={e => setNovaTabela(p => ({ ...p, descontoMaximo: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={novaTabela.ativa}
                    onChange={e => setNovaTabela(p => ({ ...p, ativa: e.target.checked }))} />
                  <span className="text-xs text-gray-600">Tabela ativa</span>
                </label>
                <div className="ml-auto flex items-center gap-2">
                  <button className="btn-secondary text-xs" onClick={() => setShowForm(false)}>Cancelar</button>
                  <button className="btn-primary text-xs" onClick={() => criarTabela.mutate()} disabled={!novaTabela.nome || criarTabela.isPending}>
                    {criarTabela.isPending ? 'Criando...' : 'Criar tabela'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loadTabelas ? (
            <div className="flex items-center justify-center h-16">
              <svg className="animate-spin w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/></svg>
            </div>
          ) : tabelas?.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">Nenhuma tabela criada ainda</div>
          ) : (
            <div className="space-y-2">
              {tabelas?.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.nome}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Desc. máx. {Number(t.descontoMaximo)}% · {t._count?.itens ?? 0} produtos · {t._count?.clientesTabelas ?? 0} clientes
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.validade && (
                      <span className="badge-amber text-xs">Válida até {new Date(t.validade).toLocaleDateString('pt-BR')}</span>
                    )}
                    <span className={t.ativa ? 'badge-green' : 'badge-gray'}>{t.ativa ? 'Ativa' : 'Inativa'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Banner de avisos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Aparece no app do representante ao abrir. Remova para ocultar.</p>
            </div>
          </div>
          {banner?.ativo ? (
            <div className="space-y-3">
              <img src={banner.imagemUrl} alt="Banner atual" className="w-full max-w-md rounded-lg border border-gray-200" />
              <button onClick={() => removerBanner.mutate()} disabled={removerBanner.isPending} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                <Trash2 size={15} /> Remover banner
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3">Nenhum banner ativo no momento.</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <button onClick={() => subirBanner.mutate()} disabled={!bannerFile || subirBanner.isPending} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50">
              <Upload size={15} /> {banner?.ativo ? 'Substituir' : 'Subir'} banner
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
