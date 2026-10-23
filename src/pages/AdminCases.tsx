import { useState } from 'react'

/* ============================================================
 * Case de Estudos — UX/UI Fullstack Developer
 * Módulo interno do setor de TI para documentar as melhorias
 * desenvolvidas na Innova. Cada estudo é um arquivo HTML autônomo
 * em /public/casos; aqui ficam a galeria e o visualizador.
 * Propriedade intelectual de Khemraj Junior.
 * ========================================================== */

type Caso = {
  slug: string
  titulo: string
  resumo: string
  tags: string[]
  arquivo: string
  data: string
}

const CASOS: Caso[] = [
  {
    slug: 'crm-controle-de-solicitacoes',
    titulo: 'Controle de CRM — Gestão de solicitações',
    resumo:
      'Redesenho de um fluxo manual de autorização e pagamento (atendimento → enfermagem → financeiro) para um sistema web com papéis, rastreabilidade, anexos, painel de indicadores e atualização em tempo real.',
    tags: ['UX/UI', 'Full-stack', 'React', 'Supabase', 'RLS'],
    arquivo: '/casos/crm-controle-de-solicitacoes.html',
    data: 'Out 2026',
  },
  {
    slug: 'novi-assistente',
    titulo: 'Novi — Identidade do assistente',
    resumo:
      'Guia de identidade e tom de voz do Novi, o robozinho assistente da Innova: conceito, personalidade, estados visuais (atento, pensando, sucesso, feliz) e como ele fala nos sistemas.',
    tags: ['Branding', 'UX Writing', 'Design', 'Mascote'],
    arquivo: '/casos/novi-assistente.html',
    data: 'Out 2026',
  },
]

export default function AdminCases() {
  const [aberto, setAberto] = useState<Caso | null>(null)

  if (aberto) {
    return (
      <div className="cases">
        <div className="cases-viewer-topo">
          <button type="button" className="btn btn-ghost" onClick={() => setAberto(null)}>
            ← Voltar aos estudos
          </button>
          <strong className="cases-viewer-titulo">{aberto.titulo}</strong>
          <a className="btn btn-ghost" href={aberto.arquivo} target="_blank" rel="noopener noreferrer">
            Abrir em nova aba ↗
          </a>
        </div>
        <iframe className="cases-frame" src={aberto.arquivo} title={aberto.titulo} />
      </div>
    )
  }

  return (
    <div className="cases">
      <header className="cases-cabecalho">
        <span className="cases-eyebrow">Setor de TI · Documentação interna</span>
        <h2 className="cases-titulo">Case de Estudos — UX/UI Fullstack Developer</h2>
        <p className="cases-sub">
          Registro das melhorias de produto, experiência e engenharia desenvolvidas dentro da
          Innova. Cada estudo documenta o problema, as decisões de UX/UI e a construção técnica.
        </p>
      </header>

      <div className="cases-grid">
        {CASOS.map((c) => (
          <button key={c.slug} type="button" className="cases-card" onClick={() => setAberto(c)}>
            <span className="cases-card-data">{c.data}</span>
            <strong className="cases-card-titulo">{c.titulo}</strong>
            <p className="cases-card-resumo">{c.resumo}</p>
            <span className="cases-tags">
              {c.tags.map((t) => (
                <span key={t} className="cases-tag">
                  {t}
                </span>
              ))}
            </span>
            <span className="cases-card-abrir">Abrir estudo →</span>
          </button>
        ))}
      </div>

      <footer className="cases-ip">
        <strong>Propriedade intelectual de Khemraj Junior</strong>
        <span>Analista de Sistemas Jr. · Desenvolvedor Full Stack</span>
        <span className="cases-ip-nota">
          Conteúdo de uso interno do setor de TI, referente a melhorias desenvolvidas na Innova.
        </span>
      </footer>
    </div>
  )
}
