import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  emailValido,
  focarPrimeiroErro,
  mascaraTelefone,
} from '../utils/formulario'

const PLANOS = [
  'Plano coletivo por adesão',
  'Plano empresarial',
  'Plano odonto individual',
  'Plano odonto empresarial',
]

const DIFERENCIAIS = [
  {
    titulo: 'Proposta sob medida',
    texto: 'Com poucos dados montamos um plano que cabe no seu perfil.',
    icone: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  },
  {
    titulo: 'Sem compromisso',
    texto: 'A cotação é gratuita e não gera nenhuma obrigação de contratação.',
    icone: 'M9 12l2 2 4-4M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  },
  {
    titulo: 'Retorno ágil',
    texto: 'Nossa equipe entra em contato com clareza e suporte desde o início.',
    icone: 'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  },
]

type Campos = {
  plano: string
  pessoas: string
  nome: string
  email: string
  telefone: string
}

type Erros = Partial<Record<keyof Campos, string>>

const VAZIO: Campos = {
  plano: '',
  pessoas: '',
  nome: '',
  email: '',
  telefone: '',
}

function validar(campos: Campos): Erros {
  const erros: Erros = {}

  if (!campos.plano) erros.plano = 'Escolha o plano desejado.'

  const pessoas = Number(campos.pessoas)
  if (!campos.pessoas.trim()) erros.pessoas = 'Informe a quantidade de pessoas.'
  else if (!Number.isInteger(pessoas) || pessoas < 1)
    erros.pessoas = 'Use um número inteiro a partir de 1.'

  if (campos.nome.trim().length < 3) erros.nome = 'Informe seu nome completo.'

  if (!emailValido(campos.email)) erros.email = 'Informe um e-mail válido.'

  const digitos = campos.telefone.replace(/\D/g, '')
  if (digitos.length < 10) erros.telefone = 'Informe DDD e número.'

  return erros
}

function Cotacao() {
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const alterar = (campo: keyof Campos, valor: string) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }))
    /* limpa o erro do campo assim que o usuario volta a digitar */
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
            Recebemos seus dados, <span className="accent">{campos.nome}</span>
          </h1>

          <p className="page-lead">
            Nossa equipe vai preparar uma proposta para o{' '}
            <strong>{campos.plano.toLowerCase()}</strong> e entrar em contato
            pelo e-mail {campos.email} ou pelo telefone {campos.telefone}.
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
              Fazer outra cotação
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="cotacao">
      <div className="shell cotacao-inner">
        {/* ---------- coluna de texto ---------- */}
        <div className="cotacao-copy">
          <nav className="crumbs" aria-label="Trilha">
            <Link to={ROUTES.home}>Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Cotação</span>
          </nav>

          <h1 className="page-title">
            Seu plano ideal
            <br />
            <span className="accent">começa aqui</span>
          </h1>

          <p className="page-lead">
            Solicite uma cotação personalizada com quem entende o que você
            precisa: cuidado, agilidade e respeito. A Innova está ao seu lado
            para oferecer um plano que realmente funciona, com preços acessíveis
            e atendimento humanizado.
          </p>

          <ul className="diferenciais">
            {DIFERENCIAIS.map((item) => (
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

        {/* ---------- formulário ---------- */}
        <div className="cotacao-form-wrap">
          <form className="cotacao-form" onSubmit={enviar} noValidate>
            <h2>Solicite agora sua cotação sem compromisso</h2>
            <p className="form-intro">
              Na Innova, cuidar da sua saúde começa com um atendimento que
              respeita seu tempo. Com poucos dados preparamos uma proposta sob
              medida para você ou sua empresa.
            </p>

            <div className={`campo${erros.plano ? ' tem-erro' : ''}`}>
              <label htmlFor="plano">Escolha seu plano</label>
              <select
                id="plano"
                value={campos.plano}
                onChange={(e) => alterar('plano', e.target.value)}
                aria-invalid={!!erros.plano}
                aria-describedby={erros.plano ? 'erro-plano' : undefined}
              >
                <option value="">Selecione uma opção</option>
                {PLANOS.map((plano) => (
                  <option key={plano} value={plano}>
                    {plano}
                  </option>
                ))}
              </select>
              {erros.plano && (
                <span className="erro" id="erro-plano" role="alert">
                  {erros.plano}
                </span>
              )}
            </div>

            <div className={`campo${erros.pessoas ? ' tem-erro' : ''}`}>
              <label htmlFor="pessoas">Quantidade de pessoas no plano</label>
              <input
                id="pessoas"
                inputMode="numeric"
                placeholder="Ex.: 3"
                value={campos.pessoas}
                onChange={(e) =>
                  alterar('pessoas', e.target.value.replace(/\D/g, ''))
                }
                aria-invalid={!!erros.pessoas}
                aria-describedby={erros.pessoas ? 'erro-pessoas' : undefined}
              />
              {erros.pessoas && (
                <span className="erro" id="erro-pessoas" role="alert">
                  {erros.pessoas}
                </span>
              )}
            </div>

            <div className={`campo${erros.nome ? ' tem-erro' : ''}`}>
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                autoComplete="name"
                placeholder="Seu nome completo"
                value={campos.nome}
                onChange={(e) => alterar('nome', e.target.value)}
                aria-invalid={!!erros.nome}
                aria-describedby={erros.nome ? 'erro-nome' : undefined}
              />
              {erros.nome && (
                <span className="erro" id="erro-nome" role="alert">
                  {erros.nome}
                </span>
              )}
            </div>

            <div className={`campo${erros.email ? ' tem-erro' : ''}`}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={campos.email}
                onChange={(e) => alterar('email', e.target.value)}
                aria-invalid={!!erros.email}
                aria-describedby={erros.email ? 'erro-email' : undefined}
              />
              {erros.email && (
                <span className="erro" id="erro-email" role="alert">
                  {erros.email}
                </span>
              )}
            </div>

            <div className={`campo${erros.telefone ? ' tem-erro' : ''}`}>
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(69) 90000-0000"
                value={campos.telefone}
                onChange={(e) =>
                  alterar('telefone', mascaraTelefone(e.target.value))
                }
                aria-invalid={!!erros.telefone}
                aria-describedby={erros.telefone ? 'erro-telefone' : undefined}
              />
              {erros.telefone && (
                <span className="erro" id="erro-telefone" role="alert">
                  {erros.telefone}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary form-enviar"
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Solicitar cotação'}
              {!enviando && <span aria-hidden="true">→</span>}
            </button>

            <p className="form-nota">
              Seus dados são usados apenas para o contato desta cotação.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Cotacao
