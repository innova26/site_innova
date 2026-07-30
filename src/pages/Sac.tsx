import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import { CONTATOS, linkWhatsapp } from '../contatos'
import {
  emailValido,
  focarPrimeiroErro,
  mascaraTelefone,
} from '../utils/formulario'

type Campos = {
  nome: string
  email: string
  telefone: string
  mensagem: string
}

type Erros = Partial<Record<keyof Campos, string>>

const VAZIO: Campos = { nome: '', email: '', telefone: '', mensagem: '' }

function validar(campos: Campos): Erros {
  const erros: Erros = {}
  if (campos.nome.trim().length < 3) erros.nome = 'Informe seu nome.'
  if (!emailValido(campos.email)) erros.email = 'Informe um e-mail válido.'
  if (campos.telefone.replace(/\D/g, '').length < 10)
    erros.telefone = 'Informe DDD e número.'
  if (campos.mensagem.trim().length < 10)
    erros.mensagem = 'Escreva sua mensagem com um pouco mais de detalhe.'
  return erros
}

function Sac() {
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const alterar = (campo: keyof Campos, valor: string) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const encontrados = validar(campos)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      focarPrimeiroErro()
      return
    }
    setEnviando(true)
    // TODO: ligar a um endpoint real. Hoje nada e enviado para o servidor.
    await new Promise((r) => setTimeout(r, 700))
    setEnviando(false)
    setEnviado(true)
  }

  const campo = (nome: keyof Campos) => `campo${erros[nome] ? ' tem-erro' : ''}`
  const aria = (nome: keyof Campos) => ({
    'aria-invalid': !!erros[nome],
    'aria-describedby': erros[nome] ? `erro-${nome}` : undefined,
  })

  return (
    <>
      {/* ---------- abertura ---------- */}
      <section className="page-hero">
        <div className="shell">
          <nav className="crumbs" aria-label="Trilha">
            <Link to={ROUTES.home}>Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">SAC</span>
          </nav>

          <h1 className="page-title">
            Fale com a gente
            <br />
            <span className="accent">sempre que precisar</span>
          </h1>

          <p className="page-lead">
            Nosso time está pronto para te atender com atenção, agilidade e
            respeito. Seja por telefone ou WhatsApp, garantimos um suporte
            eficiente e acolhedor para tirar dúvidas, resolver pendências ou
            orientar sobre seu plano de saúde.
          </p>
        </div>
      </section>

      {/* ---------- canais ---------- */}
      <section className="canais">
        <div className="shell canais-grid">
          <article className="canal-card">
            <span className="canal-icone" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 7.2 2 2 0 0 1 6 5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <h2>Telefone para contato</h2>
            <p>
              Canal exclusivo para beneficiários e prestadores da rede Innova.
              Fale com a nossa central de atendimento e tire suas dúvidas com um
              de nossos especialistas.
            </p>

            <a className="canal-numero" href={CONTATOS.central.telefone}>
              {CONTATOS.central.rotulo}
            </a>

            <a
              className="btn btn-ghost"
              href={linkWhatsapp(
                CONTATOS.central.whatsapp,
                'Olá! Preciso de atendimento da central Innova.',
              )}
              target="_blank"
              rel="noreferrer"
            >
              Falar pela central
            </a>
          </article>

          
        </div>
      </section>

      {/* ---------- formulário ---------- */}
      <section className="sac-form-secao">
        <div className="shell sac-inner">
          <div className="sac-copy">
            <h2 className="section-title on-dark">
              Envie uma mensagem e{' '}
              <span className="accent">fale com a Innova</span>
            </h2>
            <p className="section-lead on-dark">
              Se preferir, você pode entrar em contato pelo formulário ao lado.
              Nossa equipe irá retornar o mais rápido possível para esclarecer
              dúvidas, orientar sobre seu plano ou oferecer suporte com atenção
              e clareza.
            </p>

            <a className="sac-email" href={`mailto:${CONTATOS.email}`}>
              <span aria-hidden="true">✉</span>
              {CONTATOS.email}
            </a>
          </div>

          {enviado ? (
            <div className="cotacao-form sac-ok">
              <span className="ok-selo" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h2>Mensagem enviada</h2>
              <p>
                Obrigado, {campos.nome}. Nossa equipe vai responder no e-mail{' '}
                {campos.email} o mais rápido possível.
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setCampos(VAZIO)
                  setEnviado(false)
                }}
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form className="cotacao-form" onSubmit={enviar} noValidate>
              <div className={campo('nome')}>
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={campos.nome}
                  onChange={(e) => alterar('nome', e.target.value)}
                  {...aria('nome')}
                />
                {erros.nome && (
                  <span className="erro" id="erro-nome" role="alert">
                    {erros.nome}
                  </span>
                )}
              </div>

              <div className={campo('email')}>
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={campos.email}
                  onChange={(e) => alterar('email', e.target.value)}
                  {...aria('email')}
                />
                {erros.email && (
                  <span className="erro" id="erro-email" role="alert">
                    {erros.email}
                  </span>
                )}
              </div>

              <div className={campo('telefone')}>
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  type="tel"
                  placeholder="(69) 90000-0000"
                  value={campos.telefone}
                  onChange={(e) =>
                    alterar('telefone', mascaraTelefone(e.target.value))
                  }
                  {...aria('telefone')}
                />
                {erros.telefone && (
                  <span className="erro" id="erro-telefone" role="alert">
                    {erros.telefone}
                  </span>
                )}
              </div>

              <div className={campo('mensagem')}>
                <label htmlFor="mensagem">Envie sua mensagem</label>
                <textarea
                  id="mensagem"
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  value={campos.mensagem}
                  onChange={(e) => alterar('mensagem', e.target.value)}
                  {...aria('mensagem')}
                />
                {erros.mensagem && (
                  <span className="erro" id="erro-mensagem" role="alert">
                    {erros.mensagem}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary form-enviar"
                disabled={enviando}
              >
                {enviando ? 'Enviando…' : 'Enviar mensagem'}
                {!enviando && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ---------- localização ---------- */}
      <section className="localizacao">
        <div className="shell">
          <p className="section-eyebrow">
            <span className="eyebrow-dash" aria-hidden="true" />
            ONDE ESTAMOS
          </p>

          <h2 className="section-title">
            Estamos em uma das principais
            <br />
            avenidas de <span className="accent">Porto Velho</span>
          </h2>

          <p className="section-lead">
            Estrutura moderna para receber você com conforto e agilidade.
          </p>

          <div className="mapa-bloco">
            <address className="endereco">
              <strong>{CONTATOS.endereco.rua}</strong>
              <span>{CONTATOS.endereco.bairro}</span>
              <span>{CONTATOS.endereco.cidade}</span>
              <span>CEP {CONTATOS.endereco.cep}</span>

              <a
                className="btn btn-primary"
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${CONTATOS.endereco.rua}, ${CONTATOS.endereco.bairro}, ${CONTATOS.endereco.cidade}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver rota <span aria-hidden="true">→</span>
              </a>
            </address>

            <div className="mapa">
              <iframe
                src={CONTATOS.endereco.mapa}
                title="Mapa da sede da Innova em Porto Velho"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Sac
