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
  {
    grupo: 'Geral',
    p: 'O que significa o aviso de "consulta não paga"?',
    r: 'É o alerta de urgência: quando a consulta está chegando e ainda não foi paga, a solicitação ganha uma faixa e um selo na lista (vermelho = hoje/amanhã ou atrasada; âmbar = nos próximos dias) e um aviso no topo do detalhe. As de hoje/amanhã também entram em "Alertas para revisão" no painel, para o financeiro pagar a tempo.',
  },
  {
    grupo: 'Geral',
    p: 'Para que serve o filtro "Próximas consultas"?',
    r: 'Mostra só as solicitações de consulta ainda não pagas e com data marcada, ordenadas da mais próxima para a mais distante — é a fila do que precisa ser pago primeiro.',
  },
  {
    grupo: 'Geral',
    p: 'Qual a diferença entre Consulta e Reembolso?',
    r: 'São os dois tipos de solicitação. Consulta é o atendimento a ser pago; Reembolso é uma despesa já paga pelo beneficiário que ele quer de volta. O fluxo é o mesmo (abrir → autorizar → pagar); muda só o tipo e alguns rótulos.',
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
  {
    grupo: 'Atendimento',
    p: 'Como abrir um Reembolso?',
    r: 'Em "Nova solicitação", escolha o tipo "Reembolso" no topo do formulário. Os rótulos se ajustam (ex.: "Valor a reembolsar", "Data do atendimento") e o resto é igual ao da consulta. Na lista, o reembolso aparece com o selo "Reembolso".',
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
  {
    grupo: 'Financeiro',
    p: 'Como vejo o que precisa ser pago com urgência?',
    r: 'Use o filtro "⏰ Próximas consultas" (lista ordenada pela data) e fique de olho nos selos vermelhos/âmbar na lista e nos "Alertas para revisão" do painel — eles apontam as consultas de hoje/amanhã ou atrasadas ainda não pagas.',
  },
]

const GRUPOS: Grupo[] = ['Geral', 'Atendimento', 'Enfermagem', 'Financeiro']

/* Avatar do Novi — robozinho sorridente nas cores da Innova. */
function NoviAvatar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* antena */}
      <line x1="32" y1="12" x2="32" y2="6" stroke="#e2ebf8" strokeWidth="2.4" strokeLinecap="round" />
      <circle className="novi-antena" cx="32" cy="4.5" r="3.2" fill="#37c35a" />
      {/* orelhas */}
      <rect x="9" y="22" width="6" height="12" rx="3" fill="#37c35a" />
      <rect x="49" y="22" width="6" height="12" rx="3" fill="#2a8fe0" />
      {/* cabeça */}
      <rect x="14" y="12" width="36" height="30" rx="12" fill="#f4f8fd" stroke="#cfdcf0" strokeWidth="1.5" />
      {/* tela */}
      <rect x="18.5" y="17.5" width="27" height="19" rx="8" fill="#0e1830" />
      {/* olhos sorridentes */}
      <path d="M23 27 Q27 22.5 31 27" stroke="#49d4ff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M33 27 Q37 22.5 41 27" stroke="#49d4ff" strokeWidth="2.4" strokeLinecap="round" />
      {/* sorriso */}
      <path d="M28 31 Q32 35 36 31" stroke="#49d4ff" strokeWidth="2.2" strokeLinecap="round" />
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
        aria-label={aberto ? 'Fechar o Novi' : 'Abrir o Novi — assistente da Innova'}
      >
        {aberto ? '×' : <NoviAvatar className="novi" />}
      </button>

      {aberto && (
        <aside className="assist-painel" role="dialog" aria-label="Novi — assistente da Innova">
          <header className="assist-cab">
            <div className="assist-cab-id">
              <NoviAvatar className="novi" />
              <div>
                <strong>Novi</strong>
                <span>Assistente da Innova</span>
              </div>
            </div>
            <button type="button" className="assist-x" onClick={() => setAberto(false)} aria-label="Fechar">
              ×
            </button>
          </header>

          <p className="assist-ola">
            Oi! Sou o <strong>Novi</strong>. Escolha um tema ou busque sua dúvida que eu te ajudo.
          </p>

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
            Não achei por aqui? Fale com o setor de TI que a gente resolve.
          </footer>
        </aside>
      )}
    </>
  )
}
