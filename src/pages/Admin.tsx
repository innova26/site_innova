import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { ROUTES } from '../routes'
import { supabase, supabaseConfigurado } from '../lib/supabase'

function OlhoIcone({ aberto }: { aberto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {!aberto && (
        <path
          d="M4 4l16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

/* ====================== Tela de login ====================== */
function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
        <h1>Admin · Innova</h1>
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
          <div className="campo-senha">
            <input
              id="a-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="olho-btn"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrarSenha}
            >
              <OlhoIcone aberto={mostrarSenha} />
            </button>
          </div>
        </div>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="btn btn-primary form-enviar" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}

/* ====================== Layout autenticado (menu + sub-páginas) ====================== */
function AdminShell({ sessao }: { sessao: Session }) {
  const location = useLocation()
  const naRaiz = location.pathname === ROUTES.admin

  return (
    <section className="admin">
      <div className="shell">
        <header className="admin-topo">
          <div>
            <h1 className="page-title admin-titulo">
              {naRaiz ? 'Admin · Dashboard' : 'Admin'}
            </h1>
            <p className="admin-usuario">{sessao.user.email}</p>
          </div>
          <div className="admin-acoes-topo">
            {!naRaiz && (
              <Link className="btn btn-ghost" to={ROUTES.admin}>
                ← Menu
              </Link>
            )}
            {location.pathname !== ROUTES.adminRedes && (
              <Link className="btn btn-ghost" to={ROUTES.rede}>
                Ver página pública
              </Link>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => supabase!.auth.signOut()}
            >
              Sair
            </button>
          </div>
        </header>

        <Outlet />
      </div>
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const conteudo = useMemo(() => {
    if (!supabaseConfigurado) {
      return (
        <section className="admin-login">
          <div className="admin-login-card">
            <h1>Admin · Innova</h1>
            <p className="admin-login-sub">
              O Supabase ainda não está configurado. Preencha o arquivo <code>.env</code> com{' '}
              <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> e rode o{' '}
              <code>supabase/schema.sql</code>. Veja o guia GUIA-REDE-DE-ATENDIMENTO.md.
            </p>
          </div>
        </section>
      )
    }
    if (!pronto) return <p className="admin-info shell">Carregando…</p>
    return sessao ? <AdminShell sessao={sessao} /> : <Login />
  }, [pronto, sessao])

  return conteudo
}

export default Admin
