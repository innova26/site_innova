import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import { enviarCredenciado } from '../data/credenciadosRepo'
import {
  emailValido,
  erroDocumento,
  focarPrimeiroErro,
  mascaraDocumento,
  mascaraTelefone,
} from '../utils/formulario'

const UFS = [
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'São Paulo',
  'Sergipe',
  'Tocantins',
]

/* O select do site atual esta vazio; esta lista e uma proposta a validar. */
const TIPOS_PRESTADOR = [
  'Clínica',
  'Consultório',
  'Hospital',
  'Laboratório de análises clínicas',
  'Centro de diagnóstico por imagem',
  'Pronto atendimento',
  'Odontologia',
  'Fisioterapia e reabilitação',
  'Profissional autônomo',
  'Home care',
  'Outro',
]

const TAMANHO_MAX = 25 * 1024 * 1024 // 25 MB

type Campos = {
  documento: string
  nome: string
  telefone: string
  whatsapp: string
  email: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  tipo: string
  especialidades: string
  comentario: string
}

type Erros = Partial<Record<keyof Campos | 'portfolio', string>>

const VAZIO: Campos = {
  documento: '',
  nome: '',
  telefone: '',
  whatsapp: '',
  email: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  tipo: '',
  especialidades: '',
  comentario: '',
}

function validar(campos: Campos, portfolio: File | null): Erros {
  const erros: Erros = {}

  const doc = erroDocumento(campos.documento)
  if (doc) erros.documento = doc

  if (campos.nome.trim().length < 3) erros.nome = 'Informe o nome completo.'

  if (campos.telefone.replace(/\D/g, '').length < 10)
    erros.telefone = 'Informe DDD e número.'

  if (campos.whatsapp && campos.whatsapp.replace(/\D/g, '').length < 10)
    erros.whatsapp = 'Informe DDD e número.'

  if (!emailValido(campos.email)) erros.email = 'Informe um e-mail válido.'

  if (!campos.endereco.trim()) erros.endereco = 'Informe o endereço.'
  if (!campos.numero.trim()) erros.numero = 'Informe o número.'
  if (!campos.bairro.trim()) erros.bairro = 'Informe o bairro.'
  if (!campos.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!campos.uf) erros.uf = 'Selecione a UF.'
  if (!campos.tipo) erros.tipo = 'Selecione o tipo de prestador.'

  if (!campos.especialidades.trim())
    erros.especialidades = 'Descreva as especialidades ou serviços realizados.'

  if (portfolio) {
    if (portfolio.type !== 'application/pdf')
      erros.portfolio = 'Envie apenas arquivos PDF.'
    else if (portfolio.size > TAMANHO_MAX)
      erros.portfolio = 'O arquivo passa de 25 MB.'
  }

  return erros
}

function Credenciado() {
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [portfolio, setPortfolio] = useState<File | null>(null)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const alterar = (campo: keyof Campos, valor: string) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  const escolherArquivo = (event: ChangeEvent<HTMLInputElement>) => {
    setPortfolio(event.target.files?.[0] ?? null)
    setErros((atual) => ({ ...atual, portfolio: undefined }))
  }

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const encontrados = validar(campos, portfolio)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      focarPrimeiroErro()
      return
    }

    setErroEnvio(null)
    setEnviando(true)
    try {
      await enviarCredenciado(campos, portfolio)
      setEnviado(true)
    } catch (err) {
      console.error('Falha ao enviar credenciamento:', err)
      setErroEnvio(
        'Não conseguimos enviar seu cadastro agora. Tente novamente em instantes ou fale com a gente pelo telefone.',
      )
    } finally {
      setEnviando(false)
    }
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
            Cadastro enviado, <span className="accent">{campos.nome}</span>
          </h1>

          <p className="page-lead">
            Nossa equipe de credenciamento vai analisar os dados de{' '}
            <strong>{campos.tipo.toLowerCase()}</strong> em {campos.cidade}/
            {campos.uf} e entrar em contato pelo e-mail {campos.email}.
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
                setPortfolio(null)
                setEnviado(false)
              }}
            >
              Enviar outro cadastro
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
            <span aria-current="page">Seja um credenciado</span>
          </nav>

          <h1 className="page-title">
            Faça parte da nossa
            <br />
            <span className="accent">rede credenciada</span>
          </h1>

          <p className="page-lead">
            Faça parte da rede de profissionais e instituições que compartilham
            do nosso compromisso com a saúde de qualidade, acessível e
            humanizada. A Innova está em constante crescimento — e você pode
            crescer junto.
          </p>
        </div>
      </section>

      <section className="credenciado">
        <div className="shell">
          <form className="cotacao-form form-largo" onSubmit={enviar} noValidate>
            <h2>
              Preencha o formulário abaixo e faça parte da nossa rede
              credenciada
            </h2>

            {/* ---------- identificação ---------- */}
            <fieldset>
              <legend>Identificação</legend>

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

                <div className={campo('nome')}>
                  <label htmlFor="nome">Nome / Razão social</label>
                  <input
                    id="nome"
                    autoComplete="organization"
                    placeholder="Como deve aparecer no cadastro"
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
              </div>

              <div className="linha">
                <div className={campo('telefone')}>
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    type="tel"
                    placeholder="(69) 0000-0000"
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

                <div className={campo('whatsapp')}>
                  <label htmlFor="whatsapp">
                    WhatsApp <span className="opcional">(opcional)</span>
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    placeholder="(69) 90000-0000"
                    value={campos.whatsapp}
                    onChange={(e) =>
                      alterar('whatsapp', mascaraTelefone(e.target.value))
                    }
                    {...aria('whatsapp')}
                  />
                  {erros.whatsapp && (
                    <span className="erro" id="erro-whatsapp" role="alert">
                      {erros.whatsapp}
                    </span>
                  )}
                </div>
              </div>

              <div className={campo('email')}>
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="contato@clinica.com.br"
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
            </fieldset>

            {/* ---------- endereço ---------- */}
            <fieldset>
              <legend>Endereço</legend>

              <div className="linha linha-endereco">
                <div className={campo('endereco')}>
                  <label htmlFor="endereco">Endereço</label>
                  <input
                    id="endereco"
                    autoComplete="street-address"
                    placeholder="Rua, avenida…"
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

                <div className={campo('numero')}>
                  <label htmlFor="numero">Número</label>
                  <input
                    id="numero"
                    placeholder="123"
                    value={campos.numero}
                    onChange={(e) => alterar('numero', e.target.value)}
                    {...aria('numero')}
                  />
                  {erros.numero && (
                    <span className="erro" id="erro-numero" role="alert">
                      {erros.numero}
                    </span>
                  )}
                </div>
              </div>

              <div className="linha linha-cidade">
                <div className={campo('bairro')}>
                  <label htmlFor="bairro">Bairro</label>
                  <input
                    id="bairro"
                    value={campos.bairro}
                    onChange={(e) => alterar('bairro', e.target.value)}
                    {...aria('bairro')}
                  />
                  {erros.bairro && (
                    <span className="erro" id="erro-bairro" role="alert">
                      {erros.bairro}
                    </span>
                  )}
                </div>

                <div className={campo('cidade')}>
                  <label htmlFor="cidade">Cidade</label>
                  <input
                    id="cidade"
                    value={campos.cidade}
                    onChange={(e) => alterar('cidade', e.target.value)}
                    {...aria('cidade')}
                  />
                  {erros.cidade && (
                    <span className="erro" id="erro-cidade" role="alert">
                      {erros.cidade}
                    </span>
                  )}
                </div>

                <div className={campo('uf')}>
                  <label htmlFor="uf">UF</label>
                  <select
                    id="uf"
                    value={campos.uf}
                    onChange={(e) => alterar('uf', e.target.value)}
                    {...aria('uf')}
                  >
                    <option value="">Selecione</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {erros.uf && (
                    <span className="erro" id="erro-uf" role="alert">
                      {erros.uf}
                    </span>
                  )}
                </div>
              </div>
            </fieldset>

            {/* ---------- atuação ---------- */}
            <fieldset>
              <legend>Atuação</legend>

              <div className={campo('tipo')}>
                <label htmlFor="tipo">Tipo de prestador</label>
                <select
                  id="tipo"
                  value={campos.tipo}
                  onChange={(e) => alterar('tipo', e.target.value)}
                  {...aria('tipo')}
                >
                  <option value="">Selecione</option>
                  {TIPOS_PRESTADOR.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                {erros.tipo && (
                  <span className="erro" id="erro-tipo" role="alert">
                    {erros.tipo}
                  </span>
                )}
              </div>

              <div className={campo('especialidades')}>
                <label htmlFor="especialidades">
                  Especialidades / serviços realizados
                </label>
                <textarea
                  id="especialidades"
                  rows={3}
                  placeholder="Ex.: cardiologia, exames laboratoriais, fisioterapia ortopédica…"
                  value={campos.especialidades}
                  onChange={(e) => alterar('especialidades', e.target.value)}
                  {...aria('especialidades')}
                />
                {erros.especialidades && (
                  <span className="erro" id="erro-especialidades" role="alert">
                    {erros.especialidades}
                  </span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="comentario">
                  Comentário <span className="opcional">(opcional)</span>
                </label>
                <textarea
                  id="comentario"
                  rows={3}
                  placeholder="Algo mais que devemos saber?"
                  value={campos.comentario}
                  onChange={(e) => alterar('comentario', e.target.value)}
                />
              </div>

              <div className={`campo${erros.portfolio ? ' tem-erro' : ''}`}>
                <label htmlFor="portfolio">
                  Portfólio <span className="opcional">(opcional)</span>
                </label>

                <label className="arquivo" htmlFor="portfolio">
                  <span className="arquivo-icone" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12 16V4m0 0L8 8m4-4l4 4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="arquivo-texto">
                    {portfolio ? (
                      <strong>{portfolio.name}</strong>
                    ) : (
                      <>
                        <strong>Escolher arquivo</strong>
                        <span>Apenas PDF, até 25 MB</span>
                      </>
                    )}
                  </span>
                </label>

                <input
                  id="portfolio"
                  type="file"
                  accept="application/pdf"
                  className="arquivo-input"
                  onChange={escolherArquivo}
                  aria-invalid={!!erros.portfolio}
                  aria-describedby={
                    erros.portfolio ? 'erro-portfolio' : undefined
                  }
                />

                {erros.portfolio && (
                  <span className="erro" id="erro-portfolio" role="alert">
                    {erros.portfolio}
                  </span>
                )}
              </div>
            </fieldset>

            {erroEnvio && (
              <p className="form-erro-envio" role="alert">
                {erroEnvio}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary form-enviar"
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Enviar cadastro'}
              {!enviando && <span aria-hidden="true">→</span>}
            </button>

            <p className="form-nota">
              Seus dados são usados apenas para a análise deste credenciamento.
            </p>
          </form>
        </div>
      </section>
    </>
  )
}

export default Credenciado
