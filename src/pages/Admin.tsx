import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { ROUTES } from '../routes'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import AssistenteCRM from '../components/AssistenteCRM'

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
        <Link className="admin-login-voltar" to={ROUTES.home}>
          ← Voltar para o site
        </Link>

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

/* ====================== Trocar senha ====================== */
function TrocarSenha({ onFechar }: { onFechar: () => void }) {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (senha !== confirma) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    const { error } = await supabase!.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) {
      setErro('Não foi possível trocar a senha: ' + error.message)
      return
    }
    setOk(true)
  }

  return (
    <div className="crm-overlay" role="dialog" aria-modal="true" onClick={onFechar}>
      <form className="crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
        <h3>Trocar senha</h3>

        {ok ? (
          <>
            <p className="admin-info crm-ok" role="status">
              Senha alterada com sucesso.
            </p>
            <div className="crm-modal-acoes">
              <button type="button" className="btn btn-primary" onClick={onFechar}>
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="campo">
              <label htmlFor="ts-nova">Nova senha</label>
              <input
                id="ts-nova"
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="ts-conf">Confirmar nova senha</label>
              <input
                id="ts-conf"
                type="password"
                autoComplete="new-password"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                required
              />
            </div>

            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}

            <div className="crm-modal-acoes">
              <button type="button" className="btn btn-ghost" onClick={onFechar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

/* ====================== Layout autenticado (menu + sub-páginas) ====================== */
function AdminShell({ sessao }: { sessao: Session }) {
  const location = useLocation()
  const naRaiz = location.pathname === ROUTES.admin
  const naCrm = (
    [ROUTES.adminCrm, ROUTES.adminCrmUsuarios, ROUTES.adminCrmPainel] as string[]
  ).includes(location.pathname)
  const [trocarSenha, setTrocarSenha] = useState(false)

  return (
    <section className="admin">
      <div className="shell">
        <header className="admin-topo">
          <div>
            <h1 className="page-title admin-titulo">Innova Planos de Saúde</h1>
            <p className="admin-boasvindas">Seja bem-vindo</p>
            <p className="admin-usuario">{sessao.user.email}</p>
          </div>
          <div className="admin-acoes-topo">
            {!naRaiz && (
              <Link className="btn btn-ghost" to={ROUTES.admin}>
                ← Menu
              </Link>
            )}
            {!naRaiz && location.pathname !== ROUTES.adminRedes && !naCrm && (
              <Link className="btn btn-ghost" to={ROUTES.rede}>
                Ver página pública
              </Link>
            )}
            {!naCrm && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setTrocarSenha(true)}
              >
                Trocar senha
              </button>
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

        {trocarSenha && <TrocarSenha onFechar={() => setTrocarSenha(false)} />}

        <Outlet />
      </div>

      {naCrm && <AssistenteCRM />}
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
