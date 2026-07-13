'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Sparkles, Send } from 'lucide-react'

const EXEMPLOS = [
  'Quais clientes não compram há 60 dias?',
  'Quais os produtos mais vendidos?',
  'Quem são meus maiores clientes?',
  'Quanto vendi no último mês?',
  'Quais entregas estão pendentes?',
]

function RespostaFormatada({ texto }: { texto: string }) {
  const linhas = texto.split('\n')
  return (
    <div className="space-y-1.5">
      {linhas.map((linha, i) => {
        const l = linha.trim()
        if (!l) return <div key={i} className="h-1" />
        if (l.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-gray-900 mt-2">{formataInline(l.slice(4))}</h3>
        if (l.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-2">{formataInline(l.slice(3))}</h2>
        if (l.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-gray-900 mt-1">{formataInline(l.slice(2))}</h1>
        if (l.startsWith('- ') || l.startsWith('* ')) return <div key={i} className="flex gap-2 text-sm text-gray-700 pl-1"><span className="text-brand-600">•</span><span>{formataInline(l.slice(2))}</span></div>
        const num = l.match(/^(\d+)\.\s+(.*)/)
        if (num) return <div key={i} className="flex gap-2 text-sm text-gray-700 pl-1"><span className="text-brand-600 font-semibold">{num[1]}.</span><span>{formataInline(num[2])}</span></div>
        return <p key={i} className="text-sm text-gray-700">{formataInline(l)}</p>
      })}
    </div>
  )
}
function formataInline(s: string) {
  const partes = s.split(/(\*\*[^*]+\*\*)/g)
  return partes.map((p, i) => p.startsWith('**') && p.endsWith('**')
    ? <strong key={i} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>
    : <span key={i}>{p}</span>)
}

export default function PerguntePage() {
  const [pergunta, setPergunta] = useState('')
  const [loading, setLoading] = useState(false)
  const [resposta, setResposta] = useState('')
  const [erro, setErro] = useState('')

  async function enviar(texto?: string) {
    const q = (texto ?? pergunta).trim()
    if (!q) return
    setPergunta(q); setLoading(true); setErro(''); setResposta('')
    try {
      const r = await api.post('/perguntar', { pergunta: q }).then(r => r.data)
      setResposta(r.resposta || 'Sem resposta.')
    } catch (e: any) {
      setErro('Não foi possível responder agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="text-brand-600" size={22} />
        <h1 className="text-xl font-semibold text-gray-900">Pergunte ao TForce</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">Faça uma pergunta sobre clientes, vendas, produtos ou entregas.</p>

      <div className="flex gap-2 mb-4">
        <input
          value={pergunta}
          onChange={e => setPergunta(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') enviar() }}
          placeholder="Ex: quais clientes não compram há 60 dias?"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={() => enviar()}
          disabled={loading || !pergunta.trim()}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Send size={15} /> Perguntar
        </button>
      </div>

      {!resposta && !loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {EXEMPLOS.map(ex => (
            <button key={ex} onClick={() => enviar(ex)}
              className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 hover:border-brand-300">
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-brand-600 py-6">
          <Sparkles size={16} className="animate-pulse" /> Pensando…
        </div>
      )}
      {erro && <div className="text-sm text-red-500 py-4">{erro}</div>}
      {resposta && (
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <RespostaFormatada texto={resposta} />
          <button onClick={() => { setResposta(''); setPergunta('') }}
            className="text-xs text-brand-600 hover:text-brand-700 underline mt-4">
            Nova pergunta
          </button>
        </div>
      )}
    </div>
  )
}
