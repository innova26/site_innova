import { useMemo, useState } from 'react'

/* ============================================================
 * Assistente guiado do CRM — botão flutuante de ajuda.
 * Perguntas prontas por perfil + busca. Sem IA externa, sem custo,
 * nenhum dado de paciente envolvido (respostas fixas de procedimento).
 * Aparece apenas nas páginas do CRM (montado no AdminShell).
 * ========================================================== */

type Grupo = 'Geral' | 'Atendimento' | 'Enfermagem' | 'Financeiro'

type Duvida = { grupo: Grupo; p: string; r: string }

const DUVIDAS: Duvida[] = [
  // ---- Geral ----
  {
    grupo: 'Geral',
    p: 'O que é o Controle de CRM?',
    r: 'É o fluxo das solicitações entre três setores: o Atendimento abre, a Enfermagem autoriza ou recusa e o Financeiro agenda e paga. Cada solicitação caminha por etapas até ser paga ou recusada.',
  },
  {
    grupo: 'Geral',
    p: 'O que significam as cores das etapas?',
    r: 'Âmbar = aguardando enfermagem · Azul = aguardando financeiro · Roxo = pagamento agendado · Verde = pago · Vermelho = não autorizado. A mesma cor significa a mesma coisa no filtro e nos selos.',
  },
  {
    grupo: 'Geral',
    p: 'Como filtrar e buscar na lista?',
    r: 'Use os chips coloridos no topo para filtrar por etapa e o campo de busca para procurar por protocolo, paciente, solicitante ou procedimento.',
  },
  {
    grupo: 'Geral',
    p: 'A lista atualiza sozinha?',
    r: 'Sim. A lista é em tempo real: quando alguém cria ou altera uma solicitação, ela aparece atualizada para todos os setores automaticamente, sem precisar recarregar.',
  },
  {
    grupo: 'Geral',
    p: 'O que são os "Alertas para revisão"?',
    r: 'São avisos automáticos no painel (ex.: mesma chave Pix em beneficiários diferentes, autorizada sem documento). Servem para você conferir antes de pagar — não bloqueiam nada.',
  },
  {
    grupo: 'Geral',
    p: 'Por que os nomes ficam em MAIÚSCULAS?',
    r: 'Para padronizar. Assim "Maria" e "MARIA" não contam como duas pessoas diferentes nos rankings e relatórios do painel.',
  },
  // ---- Atendimento ----
  {
    grupo: 'Atendimento',
    p: 'Como abrir uma nova solicitação?',
    r: 'Clique em "Nova solicitação", preencha as seções (Identificação, Paciente, Atendimento, Pagamento) e anexe os documentos. O protocolo é gerado automaticamente.',
  },
  {
    grupo: 'Atendimento',
    p: 'O campo Solicitante já vem preenchido?',
    r: 'Sim, com o nome de quem está logado. Você pode ajustar se precisar.',
  },
  {
    grupo: 'Atendimento',
    p: 'Como anexar documentos?',
    r: 'No formulário de criação, em "Documentos", ou depois abrindo a solicitação e usando a seção Documentos. Aceita PDF, JPG ou PNG.',
  },
  {
    grupo: 'Atendimento',
    p: 'Preciso corrigir algo depois de criar. Dá para editar?',
    r: 'Dá. Abra a solicitação e clique em "Editar" no bloco "Paciente e atendimento". Você ajusta os dados de abertura (paciente, valor, procedimento, Pix, etc.) e salva.',
  },
  // ---- Enfermagem ----
  {
    grupo: 'Enfermagem',
    p: 'Como autorizar ou recusar uma solicitação?',
    r: 'Abra a solicitação que está "Aguardando enfermagem". Na zona de ação no topo, use os botões Autorizar ou Recusar. A data fica registrada automaticamente.',
  },
  {
    grupo: 'Enfermagem',
    p: 'O que acontece quando eu recuso?',
    r: 'A solicitação passa para "Não autorizado" (vermelho) e sai do fluxo de pagamento. O motivo pode ser registrado nas observações.',
  },
  {
    grupo: 'Enfermagem',
    p: 'Consigo ver os documentos antes de decidir?',
    r: 'Sim. No detalhe da solicitação, a seção "Documentos" lista os anexos enviados pelo atendimento.',
  },
  // ---- Financeiro ----
  {
    grupo: 'Financeiro',
    p: 'Como agendar e dar baixa no pagamento?',
    r: 'Abra a solicitação autorizada. Em "Pagamento", defina a data prevista e o status; quando pagar, clique em "Marcar como pago" e anexe o recibo.',
  },
  {
    grupo: 'Financeiro',
    p: 'Como copiar a chave Pix rapidamente?',
    r: 'No bloco "Dados para pagamento", clique no botão de copiar ao lado da chave Pix.',
  },
  {
    grupo: 'Financeiro',
    p: 'Dei baixa errado num pagamento já pago. Como corrijo?',
    r: 'Na etapa "Pago", clique em "Editar" no aviso verde. Abre um formulário só com os campos do financeiro (status, data do pagamento, data prevista) para você corrigir.',
  },
  {
    grupo: 'Financeiro',
    p: 'Onde anexo o recibo do pagamento?',
    r: 'No detalhe da solicitação autorizada, use a seção "Recibo de pagamento" para anexar o comprovante.',
  },
]

const GRUPOS: Grupo[] = ['Geral', 'Atendimento', 'Enfermagem', 'Financeiro']

function IconeAjuda() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5 8.5a4.5 4.5 0 0 1 9 0c0 3-4.5 3.5-4.5 6" />
      <circle cx="12" cy="18" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function AssistenteCRM() {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [abertaKey, setAbertaKey] = useState<string | null>(null)

  const termo = busca.trim().toLowerCase()
  const filtradas = useMemo(
    () =>
      termo
        ? DUVIDAS.filter((d) => (d.p + ' ' + d.r).toLowerCase().includes(termo))
        : DUVIDAS,
    [termo],
  )

  return (
    <>
      <button
        type="button"
        className="assist-fab"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={aberto ? 'Fechar ajuda' : 'Abrir ajuda do CRM'}
      >
        {aberto ? '×' : <IconeAjuda />}
      </button>

      {aberto && (
        <aside className="assist-painel" role="dialog" aria-label="Ajuda do CRM">
          <header className="assist-cab">
            <div>
              <strong>Ajuda do CRM</strong>
              <span>Dúvidas de uso do sistema</span>
            </div>
            <button type="button" className="assist-x" onClick={() => setAberto(false)} aria-label="Fechar">
              ×
            </button>
          </header>

          <div className="assist-busca">
            <input
              type="search"
              placeholder="Buscar dúvida…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="assist-corpo">
            {filtradas.length === 0 && (
              <p className="assist-vazio">Nenhuma dúvida encontrada. Tente outras palavras.</p>
            )}

            {GRUPOS.map((g) => {
              const itens = filtradas.filter((d) => d.grupo === g)
              if (itens.length === 0) return null
              return (
                <section key={g} className="assist-grupo">
                  <h4>{g}</h4>
                  {itens.map((d) => {
                    const key = d.grupo + d.p
                    const open = abertaKey === key
                    return (
                      <div key={key} className={`assist-item${open ? ' aberta' : ''}`}>
                        <button
                          type="button"
                          className="assist-q"
                          aria-expanded={open}
                          onClick={() => setAbertaKey(open ? null : key)}
                        >
                          <span>{d.p}</span>
                          <span className="assist-seta" aria-hidden="true">
                            ⌄
                          </span>
                        </button>
                        {open && <p className="assist-r">{d.r}</p>}
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </div>

          <footer className="assist-rodape">
            Não achou? Fale com a TI.
          </footer>
        </aside>
      )}
    </>
  )
}
