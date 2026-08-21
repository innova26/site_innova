import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ESTADOS, TIPOS, type Prestador, type TipoRecurso } from '../data/rede'
import { ESPECIALIDADES_PADRAO } from '../data/especialidades'
import { REDES_PADRAO } from '../data/redesPlanos'
import SelecaoMultipla from '../components/SelecaoMultipla'
import {
  carregarPrestadores,
  definirVisivel,
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
  profissional: string
  tipo: TipoRecurso
  uf: string
  municipio: string
  endereco: string
  especialidades: string[]
  redes: string[]
  telefones: string
  logo: string
  visivel: boolean
}

const FORM_VAZIO: FormState = {
  nome: '',
  instituicao: '',
  profissional: '',
  tipo: 'Clínica',
  uf: ESTADOS[0].uf,
  municipio: '',
  endereco: '',
  especialidades: [],
  redes: [],
  telefones: '',
  logo: '',
  visivel: true,
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
  profissional: p.profissional ?? '',
  tipo: p.tipo,
  uf: p.uf,
  municipio: p.municipio,
  endereco: p.endereco,
  especialidades: p.especialidades,
  redes: p.redes,
  telefones: p.telefones.join(', '),
  logo: p.logo ?? '',
  visivel: p.visivel !== false,
})

const prestadorDoForm = (f: FormState): PrestadorInput => ({
  id: f.id,
  nome: f.nome.trim(),
  instituicao: f.instituicao.trim() || undefined,
  profissional: f.profissional.trim() || undefined,
  logo: f.logo || undefined,
  tipo: f.tipo,
  uf: f.uf,
  municipio: f.municipio.trim(),
  endereco: f.endereco.trim(),
  especialidades: f.especialidades,
  redes: f.redes,
  telefones: listaTexto(f.telefones),
  visivel: f.visivel,
})

/** Switch liga/desliga para a visibilidade (Público / Não público). */
function Switch({ ligado, onToggle }: { ligado: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      className={`admin-switch${ligado ? '' : ' off'}`}
      onClick={onToggle}
      title="Público aparece no site; não público fica oculto"
    >
      <span className="admin-switch-track" aria-hidden="true">
        <span className="admin-switch-knob" />
      </span>
      <span className="admin-switch-txt">{ligado ? 'Público' : 'Não público'}</span>
    </button>
  )
}

export default function AdminCredenciadas() {
  const [lista, setLista] = useState<Prestador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState<FormState | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [subindoLogo, setSubindoLogo] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const listaFiltrada = useMemo(() => {
    const t = busca.trim().toLowerCase()
    if (!t) return lista
    return lista.filter((p) =>
      [
        p.nome,
        p.instituicao ?? '',
        p.profissional ?? '',
        p.municipio,
        p.uf,
        p.tipo,
        p.especialidades.join(' '),
        p.redes.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(t),
    )
  }, [lista, busca])

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

  const alternarVisivel = async (p: Prestador) => {
    const novo = p.visivel === false
    /* atualização otimista */
    setLista((atual) => atual.map((x) => (x.id === p.id ? { ...x, visivel: novo } : x)))
    try {
      await definirVisivel(p.id, novo)
    } catch (err) {
      setErro('Não foi possível alterar a visibilidade: ' + String(err))
      recarregar()
    }
  }

  return (
    <>
      <h2 className="admin-secao-titulo">Rede · Cadastro</h2>

      {erro && (
        <p className="erro admin-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="admin-barra">
        <p className="rede-contagem">
          <strong>{listaFiltrada.length}</strong>
          {busca.trim() ? ` de ${lista.length}` : ''} prestadores
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setForm(FORM_VAZIO)}>
          + Novo prestador
        </button>
      </div>

      <div className="admin-busca-wrap">
        <input
          type="search"
          className="admin-busca-input"
          placeholder="Buscar por nome, profissional, cidade, especialidade…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
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
                <th>Visível</th>
                <th>Especialidades</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-td-vazio">
                    Nenhum prestador encontrado para “{busca}”.
                  </td>
                </tr>
              )}
              {listaFiltrada.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nome}</strong>
                    {p.instituicao && <small>{p.instituicao}</small>}
                  </td>
                  <td>{p.tipo}</td>
                  <td>
                    {p.municipio}/{p.uf}
                  </td>
                  <td>
                    <Switch ligado={p.visivel !== false} onToggle={() => alternarVisivel(p)} />
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

            <div className="campo">
              <label htmlFor="fprof">
                Profissional <small>(ex.: Dr. Fulano — opcional)</small>
              </label>
              <input
                id="fprof"
                placeholder="Dr. Fulano, Dra. Beltrana"
                value={form.profissional}
                onChange={(e) => alterar('profissional', e.target.value)}
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
                <select id="fuf" value={form.uf} onChange={(e) => alterar('uf', e.target.value)}>
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
                Especialidades <small>(busque e marque; pode adicionar nova)</small>
              </label>
              <SelecaoMultipla
                id="fesp"
                opcoes={ESPECIALIDADES_PADRAO}
                selecionados={form.especialidades}
                onChange={(novas) => setForm((f) => (f ? { ...f, especialidades: novas } : f))}
                placeholder="Buscar especialidade…"
              />
            </div>

            <div className="campo">
              <label htmlFor="fredes">
                Redes / Planos <small>(busque e marque; pode adicionar nova)</small>
              </label>
              <SelecaoMultipla
                id="fredes"
                opcoes={REDES_PADRAO}
                selecionados={form.redes}
                onChange={(novas) => setForm((f) => (f ? { ...f, redes: novas } : f))}
                placeholder="Buscar rede / plano…"
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
              {form.logo && <img className="admin-logo-preview" src={form.logo} alt="" />}
            </div>

            <div className="campo">
              <label>Visibilidade</label>
              <Switch
                ligado={form.visivel}
                onToggle={() => setForm((f) => (f ? { ...f, visivel: !f.visivel } : f))}
              />
            </div>

            <div className="admin-form-acoes">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando || subindoLogo}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
