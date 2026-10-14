import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import { PAPEL_LABEL, type PapelCRM } from '../data/crm'
import {
  atualizarUsuario,
  convidarUsuario,
  listarUsuarios,
  meuPapel,
  meuUserId,
  redefinirSenha,
  removerUsuario,
  type UsuarioCRM,
} from '../data/crmRepo'

/** Gestão de usuários do CRM — somente admin. */

const PAPEIS: PapelCRM[] = ['atendimento', 'enfermagem', 'financeiro', 'admin']

type FormNovo = { nome: string; email: string; papel: PapelCRM }
const FORM_VAZIO: FormNovo = { nome: '', email: '', papel: 'atendimento' }

export default function AdminCRMUsuarios() {
  const [papel, setPapel] = useState<PapelCRM | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [lista, setLista] = useState<UsuarioCRM[]>([])
  const [form, setForm] = useState<FormNovo | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [meuId, setMeuId] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [p, id] = await Promise.all([meuPapel(), meuUserId()])
        if (!vivo) return
        setPapel(p)
        setMeuId(id)
        if (p === 'admin') {
          const us = await listarUsuarios()
          if (vivo) setLista(us)
        }
      } catch (e) {
        if (vivo) setErro('Falha ao carregar usuários: ' + String(e))
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  const alternarAtivo = async (u: UsuarioCRM) => {
    setErro('')
    try {
      const novo = await atualizarUsuario(u.user_id, { ativo: !u.ativo })
      setLista((atual) => atual.map((x) => (x.user_id === u.user_id ? novo : x)))
    } catch (e) {
      setErro(String(e))
    }
  }

  const mudarPapel = async (u: UsuarioCRM, novoPapel: PapelCRM) => {
    setErro('')
    try {
      const novo = await atualizarUsuario(u.user_id, { papel: novoPapel })
      setLista((atual) => atual.map((x) => (x.user_id === u.user_id ? novo : x)))
    } catch (e) {
      setErro(String(e))
    }
  }

  const redefinir = async (u: UsuarioCRM) => {
    if (!confirm(`Enviar uma nova senha provisória para ${u.nome || u.email}?`)) return
    setErro('')
    setAviso('')
    setOcupado(u.user_id)
    try {
      await redefinirSenha(u.user_id)
      setAviso(`Nova senha provisória enviada para ${u.email}.`)
    } catch (e) {
      setErro(String(e))
    } finally {
      setOcupado(null)
    }
  }

  const remover = async (u: UsuarioCRM) => {
    if (!confirm(`Remover ${u.nome || u.email}? O acesso dessa pessoa será apagado.`)) return
    setErro('')
    setAviso('')
    setOcupado(u.user_id)
    try {
      await removerUsuario(u.user_id)
      setLista((atual) => atual.filter((x) => x.user_id !== u.user_id))
      setAviso(`${u.nome || u.email} foi removido.`)
    } catch (e) {
      setErro(String(e))
    } finally {
      setOcupado(null)
    }
  }

  const criar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setErro('')
    setAviso('')
    setSalvando(true)
    try {
      const novo = await convidarUsuario(form.nome.trim(), form.email.trim(), form.papel)
      setLista((atual) => [...atual, novo])
      setForm(null)
      setAviso(`Acesso enviado para ${novo.email} (e-mail com a senha provisória).`)
    } catch (err) {
      setErro('Não foi possível convidar: ' + String(err))
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <p className="admin-info">Carregando usuários…</p>

  if (papel !== 'admin') {
    return (
      <div className="crm">
        <h2 className="admin-secao-titulo">CRM · Usuários</h2>
        <p className="admin-info">Área restrita a administradores do CRM.</p>
      </div>
    )
  }

  return (
    <div className="crm">
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">CRM · Usuários</h2>
        <Link className="btn btn-ghost" to={ROUTES.adminCrm}>
          ← Voltar ao CRM
        </Link>
      </div>

      {erro && (
        <p className="erro admin-erro" role="alert">
          {erro}
        </p>
      )}
      {aviso && <p className="admin-info crm-ok" role="status">{aviso}</p>}

      <div className="admin-barra">
        <p className="rede-contagem">
          <strong>{lista.length}</strong> usuários
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setForm(FORM_VAZIO)}>
          + Novo usuário
        </button>
      </div>

      <div className="admin-tabela-wrap">
        <table className="admin-tabela crm-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Ativo</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-td-vazio">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
            {lista.map((u) => (
              <tr key={u.user_id}>
                <td>
                  <strong>{u.nome || '—'}</strong>
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="crm-sel-papel"
                    value={u.papel}
                    onChange={(e) => mudarPapel(u, e.target.value as PapelCRM)}
                  >
                    {PAPEIS.map((p) => (
                      <option key={p} value={p}>
                        {PAPEL_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className={`crm-switch${u.ativo ? ' on' : ''}`}
                    role="switch"
                    aria-checked={u.ativo}
                    aria-label={u.ativo ? 'Desativar' : 'Ativar'}
                    onClick={() => alternarAtivo(u)}
                  >
                    <span />
                  </button>
                </td>
                <td className="admin-td-acoes">
                  <button
                    type="button"
                    className="admin-link"
                    disabled={ocupado === u.user_id}
                    onClick={() => redefinir(u)}
                  >
                    Redefinir senha
                  </button>
                  {u.user_id !== meuId && (
                    <button
                      type="button"
                      className="admin-link admin-link-danger"
                      disabled={ocupado === u.user_id}
                      onClick={() => remover(u)}
                    >
                      Remover
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="crm-overlay" role="dialog" aria-modal="true" onClick={() => setForm(null)}>
          <form className="crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={criar}>
            <h3>Novo usuário</h3>

            <div className="campo">
              <label htmlFor="u-nome">Nome</label>
              <input
                id="u-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="u-email">E-mail (login)</label>
              <input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="u-papel">Papel</label>
              <select
                id="u-papel"
                value={form.papel}
                onChange={(e) => setForm({ ...form, papel: e.target.value as PapelCRM })}
              >
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {PAPEL_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>

            <p className="crm-aviso">
              Ao criar, o usuário recebe um e-mail com uma senha provisória e já
              entra em /admin com o papel escolhido.
            </p>

            <div className="crm-modal-acoes">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Enviando…' : 'Criar e convidar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
