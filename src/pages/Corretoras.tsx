import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  emailValido,
  erroDocumento,
  focarPrimeiroErro,
  mascaraDocumento,
  mascaraTelefone,
} from '../utils/formulario'

const VANTAGENS = [
  {
    titulo: 'Operadora em expansão',
    texto:
      'A Innova cresce com responsabilidade em Rondônia, Amazonas, Roraima e Rio de Janeiro.',
    icone: 'M3 17l6-6 4 4 8-8m0 0h-5m5 0v5',
  },
  {
    titulo: 'Estrutura de suporte',
    texto:
      'Portal do corretor para acompanhar propostas, contratos e comissões em um só lugar.',
    icone: 'M4 6h16v12H4zM4 10h16M9 14h6',
  },
  {
    titulo: 'Planos competitivos',
    texto:
      'Portfólio com planos coletivos, empresariais e odontológicos para diferentes perfis.',
    icone: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z',
  },
]

type Campos = {
  nome: string
  documento: string
  susep: string
  cnh: string
  inscricao: string
  endereco: string
  telefone: string
  email: string
}

type Erros = Partial<Record<keyof Campos, string>>

const VAZIO: Campos = {
  nome: '',
  documento: '',
  susep: '',
  cnh: '',
  inscricao: '',
  endereco: '',
  telefone: '',
  email: '',
}

function validar(campos: Campos): Erros {
  const erros: Erros = {}

  if (campos.nome.trim().length < 3)
    erros.nome = 'Informe o nome ou a razão social.'

  const doc = erroDocumento(campos.documento)
  if (doc) erros.documento = doc

  if (!campos.susep.trim()) erros.susep = 'Informe o registro SUSEP.'

  /* CNH so e cobrada quando preenchida: corretora PJ nao tem. */
  if (campos.cnh && campos.cnh.replace(/\D/g, '').length !== 11)
    erros.cnh = 'A CNH tem 11 dígitos.'

  if (!campos.endereco.trim())
    erros.endereco = 'Informe o endereço fiscal/tributário.'

  if (campos.telefone.replace(/\D/g, '').length < 10)
    erros.telefone = 'Informe DDD e número.'

  if (!emailValido(campos.email)) erros.email = 'Informe um e-mail válido.'

  return erros
}

function Corretoras() {
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

  if (enviado) {
    return (
      <section className="cotacao-ok">
        <div className="shell">
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

          <h1 className="page-title">
            Cadastro recebido, <span className="accent">{campos.nome}</span>
          </h1>

          <p className="page-lead">
            Nossa equipe comercial vai conferir o registro SUSEP{' '}
            <strong>{campos.susep}</strong> e entrar em contato pelo e-mail{' '}
            {campos.email}.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-primary" to={ROUTES.home}>
              Voltar para o início <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setCampos(VAZIO)
                setEnviado(false)
              }}
            >
              Cadastrar outra corretora
            </button>
          </div>
        </div>
      </section>
    )
  }

  const campo = (nome: keyof Campos) => `campo${erros[nome] ? ' tem-erro' : ''}`
  const aria = (nome: keyof Campos) => ({
    'aria-invalid': !!erros[nome],
    'aria-describedby': erros[nome] ? `erro-${nome}` : undefined,
  })

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <nav className="crumbs" aria-label="Trilha">
            <Link to={ROUTES.home}>Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Corretoras</span>
          </nav>

          <h1 className="page-title">
            Cadastre sua corretora e
            <br />
            venha <span className="accent">crescer com a Innova</span>
          </h1>

          <p className="page-lead">
            A Innova está em plena expansão e busca parcerias com corretoras que
            compartilham do nosso propósito: transformar o acesso à saúde com
            agilidade, ética e acolhimento. Se você quer representar uma
            operadora moderna, com excelente estrutura de suporte e planos
            altamente competitivos, preencha o formulário e inicie sua jornada
            conosco.
          </p>

          <ul className="diferenciais">
            {VANTAGENS.map((item) => (
              <li key={item.titulo}>
                <span className="dif-icone" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d={item.icone}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <strong>{item.titulo}</strong>
                  <span>{item.texto}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="credenciado">
        <div className="shell">
          <form className="cotacao-form form-largo" onSubmit={enviar} noValidate>
            <h2>Preencha o formulário abaixo e cadastre sua corretora</h2>

            <fieldset>
              <legend>Dados da corretora</legend>

              <div className={campo('nome')}>
                <label htmlFor="nome">Nome / Razão social</label>
                <input
                  id="nome"
                  autoComplete="organization"
                  placeholder="Como consta no registro"
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

              <div className="linha">
                <div className={campo('documento')}>
                  <label htmlFor="documento">CNPJ / CPF</label>
                  <input
                    id="documento"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    value={campos.documento}
                    onChange={(e) =>
                      alterar('documento', mascaraDocumento(e.target.value))
                    }
                    {...aria('documento')}
                  />
                  {erros.documento && (
                    <span className="erro" id="erro-documento" role="alert">
                      {erros.documento}
                    </span>
                  )}
                </div>

                <div className={campo('susep')}>
                  <label htmlFor="susep">Registro SUSEP</label>
                  <input
                    id="susep"
                    placeholder="Número oficial"
                    value={campos.susep}
                    onChange={(e) => alterar('susep', e.target.value)}
                    {...aria('susep')}
                  />
                  {erros.susep && (
                    <span className="erro" id="erro-susep" role="alert">
                      {erros.susep}
                    </span>
                  )}
                </div>
              </div>

              <div className="linha">
                <div className={campo('cnh')}>
                  <label htmlFor="cnh">
                    CNH <span className="opcional">(opcional)</span>
                  </label>
                  <input
                    id="cnh"
                    inputMode="numeric"
                    placeholder="11 dígitos"
                    value={campos.cnh}
                    onChange={(e) =>
                      alterar('cnh', e.target.value.replace(/\D/g, '').slice(0, 11))
                    }
                    {...aria('cnh')}
                  />
                  {erros.cnh && (
                    <span className="erro" id="erro-cnh" role="alert">
                      {erros.cnh}
                    </span>
                  )}
                </div>

                <div className="campo">
                  <label htmlFor="inscricao">
                    Inscrição municipal{' '}
                    <span className="opcional">(opcional)</span>
                  </label>
                  <input
                    id="inscricao"
                    inputMode="numeric"
                    value={campos.inscricao}
                    onChange={(e) =>
                      alterar('inscricao', e.target.value.replace(/\D/g, ''))
                    }
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Contato</legend>

              <div className={campo('endereco')}>
                <label htmlFor="endereco">Endereço fiscal / tributário</label>
                <input
                  id="endereco"
                  autoComplete="street-address"
                  placeholder="Rua, número, bairro, cidade/UF"
                  value={campos.endereco}
                  onChange={(e) => alterar('endereco', e.target.value)}
                  {...aria('endereco')}
                />
                {erros.endereco && (
                  <span className="erro" id="erro-endereco" role="alert">
                    {erros.endereco}
                  </span>
                )}
              </div>

              <div className="linha">
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

                <div className={campo('email')}>
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="contato@corretora.com.br"
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
              </div>
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary form-enviar"
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Enviar cadastro'}
              {!enviando && <span aria-hidden="true">→</span>}
            </button>

            <p className="form-nota">
              Seus dados são usados apenas para a análise desta parceria.
            </p>
          </form>
        </div>
      </section>
    </>
  )
}

export default Corretoras
