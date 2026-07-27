import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { ROUTES } from '../routes'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { ESTADOS, TIPOS, type Prestador, type TipoRecurso } from '../data/rede'
import {
  carregarPrestadores,
  excluirPrestador,
  salvarPrestador,
  uploadLogo,
  type PrestadorInput,
} from '../data/redeRepo'

/* ----- modelo do formulário (arrays como texto separado por vírgula) ----- */
type FormState = {
  id?: string
  nome: string
  instituicao: string
  tipo: TipoRecurso
  uf: string
  municipio: string
  endereco: string
  especialidades: string
  redes: string
  telefones: string
  logo: string
}

const FORM_VAZIO: FormState = {
  nome: '',
  instituicao: '',
  tipo: 'Clínica',
  uf: ESTADOS[0].uf,
  municipio: '',
  endereco: '',
  especialidades: '',
  redes: '',
  telefones: '',
  logo: '',
}

const listaTexto = (v: string): string[] =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const formDoPrestador = (p: Prestador): FormState => ({
  id: p.id,
  nome: p.nome,
  instituicao: p.instituicao ?? '',
  tipo: p.tipo,
  uf: p.uf,
  municipio: p.municipio,
  endereco: p.endereco,
  especialidades: p.especialidades.join(', '),
  redes: p.redes.join(', '),
  telefones: p.telefones.join(', '),
  logo: p.logo ?? '',
})

const prestadorDoForm = (f: FormState): PrestadorInput => ({
  id: f.id,
  nome: f.nome.trim(),
  instituicao: f.instituicao.trim() || undefined,
  logo: f.logo || undefined,
  tipo: f.tipo,
  uf: f.uf,
  municipio: f.municipio.trim(),
  endereco: f.endereco.trim(),
  especialidades: listaTexto(f.especialidades),
  redes: listaTexto(f.redes),
  telefones: listaTexto(f.telefones),
})

/* ====================== Tela de login ====================== */
function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password: senha,
    })
    setEntrando(false)
    if (error) setErro('E-mail ou senha inválidos.')
  }

  return (
    <section className="admin-login">
      <form className="admin-login-card" onSubmit={entrar}>
        <h1>Admin · Rede</h1>
        <p className="admin-login-sub">Acesso restrito à equipe Innova.</p>

        <div className="campo">
          <label htmlFor="a-email">E-mail</label>
          <input
            id="a-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="a-senha">Senha</label>
          <input
            id="a-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary form-enviar"
          disabled={entrando}
        >
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}

/* ====================== Painel (logado) ====================== */
function Painel({ sessao }: { sessao: Session }) {
  const [lista, setLista] = useState<Prestador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState<FormState | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [subindoLogo, setSubindoLogo] = useState(false)
  const [erro, setErro] = useState('')

  const recarregar = () => {
    setCarregando(true)
    carregarPrestadores()
      .then(setLista)
      .catch((e) => setErro(String(e)))
      .finally(() => setCarregando(false))
  }

  useEffect(recarregar, [])

  const alterar = (campo: keyof FormState, valor: string) =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f))

  const enviarLogo = async (arquivo: File | undefined) => {
    if (!arquivo) return
    setSubindoLogo(true)
    setErro('')
    try {
      const url = await uploadLogo(arquivo)
      setForm((f) => (f ? { ...f, logo: url } : f))
    } catch (e) {
      setErro('Falha no upload da logo: ' + String(e))
    } finally {
      setSubindoLogo(false)
    }
  }

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSalvando(true)
    setErro('')
    try {
      await salvarPrestador(prestadorDoForm(form))
      setForm(null)
      recarregar()
    } catch (err) {
      setErro('Não foi possível salvar: ' + String(err))
    } finally {
      setSalvando(false)
    }
  }

  const remover = async (p: Prestador) => {
    if (!confirm(`Excluir "${p.nome}"?`)) return
    try {
      await excluirPrestador(p.id)
      recarregar()
    } catch (err) {
      setErro('Não foi possível excluir: ' + String(err))
    }
  }

  return (
    <section className="admin">
      <div className="shell">
        <header className="admin-topo">
          <div>
            <h1 className="page-title admin-titulo">Rede · Cadastro</h1>
            <p className="admin-usuario">{sessao.user.email}</p>
          </div>
          <div className="admin-acoes-topo">
            <Link className="btn btn-ghost" to={ROUTES.rede}>
              Ver página pública
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => supabase!.auth.signOut()}
            >
              Sair
            </button>
          </div>
        </header>

        {erro && (
          <p className="erro admin-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="admin-barra">
          <p className="rede-contagem">
            <strong>{lista.length}</strong> prestadores cadastrados
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setForm(FORM_VAZIO)}
          >
            + Novo prestador
          </button>
        </div>

        {carregando ? (
          <p className="admin-info">Carregando…</p>
        ) : (
          <div className="admin-tabela-wrap">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Local</th>
                  <th>Especialidades</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nome}</strong>
                      {p.instituicao && <small>{p.instituicao}</small>}
                    </td>
                    <td>{p.tipo}</td>
                    <td>
                      {p.municipio}/{p.uf}
                    </td>
                    <td>{p.especialidades.join(', ')}</td>
                    <td className="admin-td-acoes">
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => setForm(formDoPrestador(p))}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-link admin-link-danger"
                        onClick={() => remover(p)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Modal do formulário ---------- */}
      {form && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setForm(null)}
        >
          <form className="admin-form" onSubmit={salvar}>
            <h2>{form.id ? 'Editar prestador' : 'Novo prestador'}</h2>

            <div className="campo">
              <label htmlFor="fnome">Nome *</label>
              <input
                id="fnome"
                value={form.nome}
                onChange={(e) => alterar('nome', e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="finst">Instituição</label>
              <input
                id="finst"
                value={form.instituicao}
                onChange={(e) => alterar('instituicao', e.target.value)}
              />
            </div>

            <div className="admin-form-linha">
              <div className="campo">
                <label htmlFor="ftipo">Tipo de recurso *</label>
                <select
                  id="ftipo"
                  value={form.tipo}
                  onChange={(e) => alterar('tipo', e.target.value)}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="fuf">Estado *</label>
                <select
                  id="fuf"
                  value={form.uf}
                  onChange={(e) => alterar('uf', e.target.value)}
                >
                  {ESTADOS.map((e) => (
                    <option key={e.uf} value={e.uf}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="fmun">Município *</label>
                <input
                  id="fmun"
                  value={form.municipio}
                  onChange={(e) => alterar('municipio', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="campo">
              <label htmlFor="fend">Endereço</label>
              <input
                id="fend"
                value={form.endereco}
                onChange={(e) => alterar('endereco', e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="fesp">
                Especialidades <small>(separadas por vírgula)</small>
              </label>
              <input
                id="fesp"
                placeholder="Cardiologia, Clínica Geral"
                value={form.especialidades}
                onChange={(e) => alterar('especialidades', e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="fredes">
                Redes / Planos <small>(separados por vírgula)</small>
              </label>
              <input
                id="fredes"
                placeholder="Essencial RO I, Executivo Nacional"
                value={form.redes}
                onChange={(e) => alterar('redes', e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="ftel">
                Telefones <small>(separados por vírgula)</small>
              </label>
              <input
                id="ftel"
                placeholder="(69) 3000-0000, (69) 99999-0000"
                value={form.telefones}
                onChange={(e) => alterar('telefones', e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="flogo">Logo</label>
              <input
                id="flogo"
                type="file"
                accept="image/*"
                onChange={(e) => enviarLogo(e.target.files?.[0])}
              />
              {subindoLogo && <small>Enviando imagem…</small>}
              {form.logo && (
                <img className="admin-logo-preview" src={form.logo} alt="" />
              )}
            </div>

            <div className="admin-form-acoes">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={salvando || subindoLogo}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

/* ====================== Entrada ====================== */
function Admin() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setPronto(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setPronto(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSessao(s),
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  const conteudo = useMemo(() => {
    if (!supabaseConfigurado) {
      return (
        <section className="admin-login">
          <div className="admin-login-card">
            <h1>Admin · Rede</h1>
            <p className="admin-login-sub">
              O Supabase ainda não está configurado. Preencha o arquivo{' '}
              <code>.env</code> com <code>VITE_SUPABASE_URL</code> e{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> e rode o{' '}
              <code>supabase/schema.sql</code>. Veja o guia
              GUIA-REDE-DE-ATENDIMENTO.md.
            </p>
          </div>
        </section>
      )
    }
    if (!pronto) return <p className="admin-info shell">Carregando…</p>
    return sessao ? <Painel sessao={sessao} /> : <Login />
  }, [pronto, sessao])

  return conteudo
}

export default Admin
