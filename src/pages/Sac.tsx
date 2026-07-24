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

          <article className="canal-card is-destaque">
            <span className="canal-icone" aria-hidden="true">
              <svg viewBox="0 0 448 512" className="wa-mark">
                <path
                  fill="currentColor"
                  d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
                />
              </svg>
            </span>

            <h2>WhatsApp de contato</h2>
            <p>
              Deseja contratar um plano de saúde? Fale com nosso time comercial
              de forma prática e rápida!
            </p>

            <a className="canal-numero" href={CONTATOS.comercial.telefone}>
              {CONTATOS.comercial.rotulo}
            </a>

            <a
              className="btn btn-primary"
              href={linkWhatsapp(
                CONTATOS.comercial.whatsapp,
                'Olá! Gostaria de falar com o time comercial da Innova.',
              )}
              target="_blank"
              rel="noreferrer"
            >
              Entre em contato <span aria-hidden="true">→</span>
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
