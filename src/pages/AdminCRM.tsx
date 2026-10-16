import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  AVISOS_ATIVOS,
  STATUS_FINANCEIRO,
  PAPEL_LABEL,
  etapaAtual,
  formatarData,
  formatarValor,
  hojeISO,
  podeEditarAtendimento,
  podeEditarEnfermagem,
  podeEditarFinanceiro,
  type PapelCRM,
  type SolicitacaoCRM,
  type StatusFinanceiro,
} from '../data/crm'
import {
  assinarSolicitacoes,
  atualizarSolicitacao,
  criarSolicitacao,
  excluirAnexo,
  excluirSolicitacao,
  enviarAnexo,
  listarAnexos,
  listarHistorico,
  listarSolicitacoes,
  meuNome,
  meuPapel,
  notificar,
  sugestoesRede,
  urlAnexo,
  type AnexoCRM,
  type HistoricoCRM,
  type TipoAnexo,
} from '../data/crmRepo'

/* ============================================================
 * Filtros de etapa (para a barra de filtro e os cards)
 * ========================================================== */
const FILTROS = [
  { chave: 'todos', label: 'Todas' },
  { chave: 'enfermagem', label: 'Aguardando enfermagem' },
  { chave: 'financeiro', label: 'Aguardando financeiro' },
  { chave: 'agendado', label: 'Agendado' },
  { chave: 'pago', label: 'Pago' },
  { chave: 'recusado', label: 'Não autorizado' },
] as const

type FormNova = {
  protocolo: string
  solicitante: string
  beneficiario: string
  procedimento: string
  clinicaHospital: string
  dataConsulta: string
  termino: string
  valorSolicitado: string
  dadosBancarios: string
  observacoes: string
}

const FORM_VAZIO: FormNova = {
  protocolo: '',
  solicitante: '',
  beneficiario: '',
  procedimento: '',
  clinicaHospital: '',
  dataConsulta: '',
  termino: '',
  valorSolicitado: '',
  dadosBancarios: '',
  observacoes: '',
}

export default function AdminCRM() {
  const [papel, setPapel] = useState<PapelCRM | null>(null)
  const [lista, setLista] = useState<SolicitacaoCRM[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<string>('todos')
  const [selecionada, setSelecionada] = useState<SolicitacaoCRM | null>(null)
  const [form, setForm] = useState<FormNova | null>(null)
  const [nomeAtendente, setNomeAtendente] = useState('')
  const [redeSug, setRedeSug] = useState<{ clinicas: string[]; procedimentos: string[] }>({
    clinicas: [],
    procedimentos: [],
  })

  const recarregar = async () => {
    try {
      const dados = await listarSolicitacoes()
      setLista(dados)
    } catch (e) {
      setErro('Não foi possível carregar as solicitações: ' + String(e))
    }
  }

  useEffect(() => {
    let vivo = true
    ;(async () => {
      setCarregando(true)
      try {
        const [p, nome, rede] = await Promise.all([meuPapel(), meuNome(), sugestoesRede()])
        if (!vivo) return
        setPapel(p)
        setNomeAtendente(nome)
        setRedeSug(rede)
        if (p) await recarregar()
      } catch (e) {
        if (vivo) setErro('Falha ao iniciar o CRM: ' + String(e))
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  /* ---- tempo real: atualiza a lista quando outro usuário muda algo ---- */
  useEffect(() => {
    if (!papel) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const agendar = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void recarregar(), 400)
    }
    const desassinar = assinarSolicitacoes(agendar)
    const aoFocar = () => void recarregar()
    window.addEventListener('focus', aoFocar)
    return () => {
      clearTimeout(timer)
      desassinar()
      window.removeEventListener('focus', aoFocar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papel])

  /* ---- métricas do painel ---- */
  const metricas = useMemo(() => {
    const porEtapa = (chave: string) =>
      lista.filter((s) => etapaAtual(s).chave === chave).length
    const totalAPagar = lista
      .filter((s) => s.autorizacao === 'sim' && s.statusFinanceiro !== 'Pago')
      .reduce((acc, s) => acc + (s.valorSolicitado ?? 0), 0)
    const mes = hojeISO().slice(0, 7)
    const pagoNoMes = lista
      .filter((s) => s.statusFinanceiro === 'Pago' && (s.dataPagamento ?? '').startsWith(mes))
      .reduce((acc, s) => acc + (s.valorSolicitado ?? 0), 0)
    return {
      enfermagem: porEtapa('enfermagem'),
      financeiro: porEtapa('financeiro'),
      totalAPagar,
      pagoNoMes,
    }
  }, [lista])

  /* ---- sugestões (autocomplete): rede de atendimento + o que já foi usado ---- */
  const sugestoes = useMemo(() => {
    const proc = new Set<string>(redeSug.procedimentos)
    const clin = new Set<string>(redeSug.clinicas)
    for (const s of lista) {
      if (s.procedimento.trim()) proc.add(s.procedimento.trim())
      if (s.clinicaHospital.trim()) clin.add(s.clinicaHospital.trim())
    }
    const ordenar = (c: Set<string>) => [...c].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return { procedimentos: ordenar(proc), clinicas: ordenar(clin) }
  }, [lista, redeSug])

  /* ---- filtragem ---- */
  const filtrada = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return lista.filter((s) => {
      if (filtro !== 'todos' && etapaAtual(s).chave !== filtro) return false
      if (!termo) return true
      return [s.protocolo, s.beneficiario, s.solicitante, s.procedimento, s.clinicaHospital]
        .join(' ')
        .toLowerCase()
        .includes(termo)
    })
  }, [lista, busca, filtro])

  /* ---- mutações (Supabase) ---- */
  const atualizar = async (id: string, patch: Partial<SolicitacaoCRM>) => {
    setErro('')
    try {
      const nova = await atualizarSolicitacao(id, patch)
      setLista((atual) => atual.map((s) => (s.id === id ? nova : s)))
      setSelecionada((atual) => (atual && atual.id === id ? nova : atual))
      if (AVISOS_ATIVOS && patch.autorizacao === 'sim') void notificar('autorizada', id)
    } catch (e) {
      setErro('Não foi possível salvar a alteração: ' + String(e))
    }
  }

  const excluir = async (s: SolicitacaoCRM) => {
    if (!confirm(`Excluir a solicitação ${s.protocolo} (${s.beneficiario})? Essa ação não pode ser desfeita.`))
      return
    setErro('')
    try {
      await excluirSolicitacao(s.id)
      setLista((atual) => atual.filter((x) => x.id !== s.id))
      setSelecionada(null)
    } catch (e) {
      setErro('Não foi possível excluir: ' + String(e))
    }
  }

  const criar = async (documentos: File[]) => {
    if (!form) return
    setErro('')
    try {
      const nova = await criarSolicitacao({
        protocolo: form.protocolo.trim(),
        solicitante: form.solicitante.trim(),
        beneficiario: form.beneficiario.trim(),
        procedimento: form.procedimento.trim(),
        clinicaHospital: form.clinicaHospital.trim(),
        dataConsulta: form.dataConsulta || null,
        termino: form.termino || null,
        valorSolicitado: form.valorSolicitado ? Number(form.valorSolicitado) : null,
        dadosBancarios: form.dadosBancarios.trim(),
        observacoes: form.observacoes.trim(),
      })
      // anexa os documentos (best-effort — não bloqueia a criação)
      for (const doc of documentos) {
        try {
          await enviarAnexo(nova.id, 'documento', doc)
        } catch (e) {
          console.warn('Falha ao anexar documento:', e)
        }
      }
      setLista((atual) => [nova, ...atual])
      setForm(null)
      if (AVISOS_ATIVOS) void notificar('nova', nova.id)
    } catch (err) {
      setErro('Não foi possível criar a solicitação: ' + String(err))
    }
  }

  if (carregando) return <p className="admin-info">Carregando CRM…</p>

  if (!papel) {
    return (
      <div className="crm">
        <h2 className="admin-secao-titulo">Controle de CRM</h2>
        <p className="admin-info">
          Seu usuário ainda não tem um perfil no CRM. Peça a um administrador para
          cadastrá-lo na tabela <code>crm_perfis</code> com o papel adequado
          (atendimento, enfermagem ou financeiro).
        </p>
      </div>
    )
  }

  return (
    <div className="crm">
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">Controle de CRM</h2>
        <div className="crm-topo-acoes">
          <Link className="btn btn-ghost" to={ROUTES.adminCrmPainel}>
            Dashboard
          </Link>
          {papel === 'admin' && (
            <Link className="btn btn-ghost" to={ROUTES.adminCrmUsuarios}>
              Usuários
            </Link>
          )}
          <span className="crm-papel-badge">{PAPEL_LABEL[papel]}</span>
        </div>
      </div>

      {erro && (
        <p className="erro admin-erro" role="alert">
          {erro}
        </p>
      )}

      {/* ---------- cards ---------- */}
      <div className="crm-cards">
        <button className="crm-card" type="button" onClick={() => setFiltro('enfermagem')}>
          <span className="crm-card-num">{metricas.enfermagem}</span>
          <span className="crm-card-rot">Aguardando enfermagem</span>
        </button>
        <button className="crm-card" type="button" onClick={() => setFiltro('financeiro')}>
          <span className="crm-card-num">{metricas.financeiro}</span>
          <span className="crm-card-rot">Aguardando financeiro</span>
        </button>
        <div className="crm-card crm-card-valor">
          <span className="crm-card-num">{formatarValor(metricas.totalAPagar)}</span>
          <span className="crm-card-rot">Total a pagar (autorizado)</span>
        </div>
        <div className="crm-card crm-card-valor">
          <span className="crm-card-num">{formatarValor(metricas.pagoNoMes)}</span>
          <span className="crm-card-rot">Pago no mês</span>
        </div>
      </div>

      {/* ---------- barra ---------- */}
      <div className="admin-barra">
        <p className="rede-contagem">
          <strong>{filtrada.length}</strong>
          {busca.trim() || filtro !== 'todos' ? ` de ${lista.length}` : ''} solicitações
        </p>
        {podeEditarAtendimento(papel) && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setForm({ ...FORM_VAZIO, solicitante: nomeAtendente })}
          >
            + Nova solicitação
          </button>
        )}
      </div>

      <div className="crm-filtros">
        {FILTROS.map((f) => (
          <button
            key={f.chave}
            type="button"
            className={`crm-chip${filtro === f.chave ? ' ativo' : ''}`}
            onClick={() => setFiltro(f.chave)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-busca-wrap">
        <input
          type="search"
          className="admin-busca-input"
          placeholder="Buscar por protocolo, paciente, solicitante, procedimento…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* ---------- tabela ---------- */}
      <div className="admin-tabela-wrap">
        <table className="admin-tabela crm-tabela">
          <thead>
            <tr>
              <th>Protocolo</th>
              <th>Paciente</th>
              <th>Procedimento</th>
              <th>Valor</th>
              <th>Etapa</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {filtrada.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-td-vazio">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
            {filtrada.map((s) => {
              const et = etapaAtual(s)
              return (
                <tr key={s.id}>
                  <td>
                    <strong>{s.protocolo}</strong>
                    <small>{formatarData(s.abertura)}</small>
                  </td>
                  <td>
                    <strong>{s.beneficiario}</strong>
                    <small>{s.solicitante}</small>
                  </td>
                  <td>
                    {s.procedimento}
                    {s.clinicaHospital && <small>{s.clinicaHospital}</small>}
                  </td>
                  <td>{formatarValor(s.valorSolicitado)}</td>
                  <td>
                    <span className={`crm-badge tom-${et.tom}`}>{et.label}</span>
                  </td>
                  <td className="admin-td-acoes">
                    <button type="button" className="admin-link" onClick={() => setSelecionada(s)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- modal nova solicitação ---------- */}
      {form && (
        <FormNovaSolicitacao
          form={form}
          setForm={setForm as (f: FormNova) => void}
          sugestoes={sugestoes}
          onCriar={criar}
          onCancelar={() => setForm(null)}
        />
      )}

      {/* ---------- drawer de detalhe ---------- */}
      {selecionada && (
        <DetalheSolicitacao
          s={selecionada}
          papel={papel}
          onFechar={() => setSelecionada(null)}
          onAtualizar={atualizar}
          onExcluir={excluir}
        />
      )}
    </div>
  )
}

/* ============================================================
 * Modal — nova solicitação (Atendimento)
 * ========================================================== */
function FormNovaSolicitacao({
  form,
  setForm,
  sugestoes,
  onCriar,
  onCancelar,
}: {
  form: FormNova
  setForm: (f: FormNova) => void
  sugestoes: { procedimentos: string[]; clinicas: string[] }
  onCriar: (documentos: File[]) => void | Promise<void>
  onCancelar: () => void
}) {
  const set = (campo: keyof FormNova, valor: string) => setForm({ ...form, [campo]: valor })
  const [docs, setDocs] = useState<File[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erroArquivo, setErroArquivo] = useState('')

  const adicionarDocs = (arquivos: FileList | null) => {
    if (!arquivos) return
    setErroArquivo('')
    const novos: File[] = []
    for (const f of Array.from(arquivos)) {
      if (!TIPOS_ANEXO_ACEITOS.includes(f.type)) {
        setErroArquivo('Envie apenas PDF, JPG ou PNG.')
        continue
      }
      if (f.size > TAMANHO_MAX_ANEXO) {
        setErroArquivo('Cada arquivo deve ter até 10 MB.')
        continue
      }
      novos.push(f)
    }
    if (novos.length) setDocs((atual) => [...atual, ...novos])
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    await onCriar(docs)
    setSalvando(false)
  }

  return (
    <div className="crm-overlay" role="dialog" aria-modal="true">
      <form className="crm-modal" onSubmit={enviar}>
        <h3>Nova solicitação</h3>

        <div className="campo">
          <label htmlFor="n-protocolo">Protocolo</label>
          <input
            id="n-protocolo"
            placeholder="Protocolo do sistema de origem"
            value={form.protocolo}
            onChange={(e) => set('protocolo', e.target.value)}
            required
          />
        </div>

        <div className="linha">
          <div className="campo">
            <label htmlFor="n-solic">Solicitante</label>
            <input
              id="n-solic"
              value={form.solicitante}
              onChange={(e) => set('solicitante', e.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="n-benef">Beneficiário / Paciente</label>
            <input
              id="n-benef"
              value={form.beneficiario}
              onChange={(e) => set('beneficiario', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="n-proc">Procedimento</label>
          <input
            id="n-proc"
            list="sug-procedimentos"
            value={form.procedimento}
            onChange={(e) => set('procedimento', e.target.value)}
            required
          />
          <datalist id="sug-procedimentos">
            {sugestoes.procedimentos.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div className="linha">
          <div className="campo">
            <label htmlFor="n-clinica">Clínica / Hospital</label>
            <input
              id="n-clinica"
              list="sug-clinicas"
              value={form.clinicaHospital}
              onChange={(e) => set('clinicaHospital', e.target.value)}
            />
            <datalist id="sug-clinicas">
              {sugestoes.clinicas.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="campo">
            <label htmlFor="n-valor">Valor solicitado (R$)</label>
            <input
              id="n-valor"
              type="number"
              min="0"
              step="0.01"
              value={form.valorSolicitado}
              onChange={(e) => set('valorSolicitado', e.target.value)}
            />
          </div>
        </div>

        <div className="linha">
          <div className="campo">
            <label htmlFor="n-consulta">Data da consulta</label>
            <input
              id="n-consulta"
              type="date"
              value={form.dataConsulta}
              onChange={(e) => set('dataConsulta', e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="n-termino">Término / prazo</label>
            <input
              id="n-termino"
              type="date"
              value={form.termino}
              onChange={(e) => set('termino', e.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="n-banc">Dados bancários (Pix)</label>
          <input
            id="n-banc"
            placeholder="Pix (e-mail / CPF-CNPJ / telefone / chave)"
            value={form.dadosBancarios}
            onChange={(e) => set('dadosBancarios', e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="n-obs">Observações</label>
          <textarea
            id="n-obs"
            rows={2}
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Documentos <span className="opcional">(PDF, JPG ou PNG)</span></label>
          {docs.length > 0 && (
            <ul className="crm-anexos-lista">
              {docs.map((d, i) => (
                <li key={`${d.name}-${i}`}>
                  <span>{d.name}</span>
                  <button
                    type="button"
                    className="admin-link admin-link-danger"
                    onClick={() => setDocs((atual) => atual.filter((_, j) => j !== i))}
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="crm-anexo-add">
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              hidden
              onChange={(e) => {
                adicionarDocs(e.target.files)
                e.target.value = ''
              }}
            />
            <span>+ Anexar documento</span>
          </label>
          {erroArquivo && (
            <span className="erro" role="alert">
              {erroArquivo}
            </span>
          )}
        </div>

        <div className="crm-modal-acoes">
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Criando…' : 'Criar solicitação'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ============================================================
 * Drawer — detalhe + ações por etapa
 * ========================================================== */
function DetalheSolicitacao({
  s,
  papel,
  onFechar,
  onAtualizar,
  onExcluir,
}: {
  s: SolicitacaoCRM
  papel: PapelCRM
  onFechar: () => void
  onAtualizar: (id: string, patch: Partial<SolicitacaoCRM>) => void
  onExcluir: (s: SolicitacaoCRM) => void
}) {
  const et = etapaAtual(s)
  const [dataPrev, setDataPrev] = useState(s.dataPrevistaPagamento ?? '')
  const [status, setStatus] = useState<StatusFinanceiro>(s.statusFinanceiro ?? 'Pendente')

  return (
    <div className="crm-overlay" role="dialog" aria-modal="true">
      <aside className="crm-drawer">
        <header className="crm-drawer-topo">
          <div>
            <span className={`crm-badge tom-${et.tom}`}>{et.label}</span>
            <h3>{s.protocolo}</h3>
          </div>
          <button type="button" className="crm-fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </header>

        {/* ---- Atendimento ---- */}
        <section className="crm-bloco">
          <h4>1 · Atendimento</h4>
          <Campo rot="Beneficiário / Paciente" val={s.beneficiario} />
          <Campo rot="Solicitante" val={s.solicitante} />
          <Campo rot="Procedimento" val={s.procedimento} />
          <Campo rot="Clínica / Hospital" val={s.clinicaHospital || '—'} />
          <div className="crm-linha2">
            <Campo rot="Valor solicitado" val={formatarValor(s.valorSolicitado)} />
            <Campo rot="Data consulta" val={formatarData(s.dataConsulta)} />
          </div>
          <div className="crm-linha2">
            <Campo rot="Abertura" val={formatarData(s.abertura)} />
            <Campo rot="Término / prazo" val={formatarData(s.termino)} />
          </div>
          <Campo rot="Dados bancários (Pix)" val={s.dadosBancarios || '—'} />

          <div className="crm-anexos-bloco">
            <span className="crm-campo-rot">Documentos</span>
            <Anexos
              solicitacaoId={s.id}
              tipo="documento"
              podeEnviar={podeEditarAtendimento(papel)}
            />
          </div>
        </section>

        {/* ---- Enfermagem ---- */}
        <section className="crm-bloco">
          <h4>2 · Enfermagem</h4>
          <div className="crm-linha2">
            <Campo
              rot="Autorização"
              val={
                s.autorizacao === 'pendente'
                  ? 'Pendente'
                  : s.autorizacao === 'sim'
                    ? 'Autorizado'
                    : 'Não autorizado'
              }
            />
            <Campo rot="Data autorização" val={formatarData(s.dataAutorizacao)} />
          </div>

          {podeEditarEnfermagem(papel) && s.autorizacao === 'pendente' && (
            <div className="crm-acoes">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  onAtualizar(s.id, {
                    autorizacao: 'sim',
                    dataAutorizacao: hojeISO(),
                  })
                }
              >
                Autorizar
              </button>
              <button
                type="button"
                className="btn btn-ghost crm-btn-recusar"
                onClick={() =>
                  onAtualizar(s.id, {
                    autorizacao: 'nao',
                    dataAutorizacao: hojeISO(),
                  })
                }
              >
                Recusar
              </button>
            </div>
          )}
        </section>

        {/* ---- Financeiro ---- */}
        <section className="crm-bloco">
          <h4>3 · Financeiro</h4>
          {s.autorizacao !== 'sim' ? (
            <p className="crm-aviso">Disponível após autorização da enfermagem.</p>
          ) : (
            <>
              <div className="crm-linha2">
                <Campo rot="Status" val={s.statusFinanceiro ?? '—'} />
                <Campo rot="Prev. pagamento" val={formatarData(s.dataPrevistaPagamento)} />
              </div>
              <Campo rot="Data do pagamento" val={formatarData(s.dataPagamento)} />

              {podeEditarFinanceiro(papel) && s.statusFinanceiro !== 'Pago' && (
                <div className="crm-form-fin">
                  <div className="crm-linha2">
                    <div className="campo">
                      <label>Data prevista</label>
                      <input
                        type="date"
                        value={dataPrev}
                        onChange={(e) => setDataPrev(e.target.value)}
                      />
                    </div>
                    <div className="campo">
                      <label>Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StatusFinanceiro)}
                      >
                        {STATUS_FINANCEIRO.filter((x) => x !== 'Recusado').map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="crm-acoes">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        onAtualizar(s.id, {
                          dataPrevistaPagamento: dataPrev || null,
                          statusFinanceiro: status,
                        })
                      }
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        onAtualizar(s.id, {
                          statusFinanceiro: 'Pago',
                          dataPagamento: hojeISO(),
                          dataPrevistaPagamento: dataPrev || s.dataPrevistaPagamento,
                        })
                      }
                    >
                      Marcar como pago
                    </button>
                  </div>
                </div>
              )}

              <div className="crm-anexos-bloco">
                <span className="crm-campo-rot">Recibo de pagamento</span>
                <Anexos
                  solicitacaoId={s.id}
                  tipo="recibo"
                  podeEnviar={podeEditarFinanceiro(papel)}
                />
              </div>
            </>
          )}
        </section>

        {s.observacoes && (
          <section className="crm-bloco">
            <h4>Observações</h4>
            <p className="crm-obs">{s.observacoes}</p>
          </section>
        )}

        <section className="crm-bloco">
          <h4>Histórico</h4>
          <Historico solicitacaoId={s.id} />
        </section>

        {papel === 'admin' && (
          <section className="crm-bloco crm-excluir">
            <button type="button" className="btn btn-ghost crm-btn-recusar" onClick={() => onExcluir(s)}>
              Excluir solicitação
            </button>
          </section>
        )}
      </aside>
    </div>
  )
}

/* ============================================================
 * Histórico (linha do tempo) de uma solicitação
 * ========================================================== */
const ROTULO_EVENTO: Record<string, string> = {
  criada: 'Criada',
  autorizada: 'Autorizada',
  recusada: 'Recusada',
  agendada: 'Agendada',
  paga: 'Paga',
  anexo: 'Anexo',
}

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Historico({ solicitacaoId }: { solicitacaoId: string }) {
  const [itens, setItens] = useState<HistoricoCRM[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const h = await listarHistorico(solicitacaoId)
        if (vivo) setItens(h)
      } catch {
        /* ignora */
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [solicitacaoId])

  if (carregando) return <p className="crm-aviso">Carregando…</p>
  if (itens.length === 0) return <p className="crm-aviso">Sem registros ainda.</p>

  return (
    <ul className="crm-timeline">
      {itens.map((h) => (
        <li key={h.id}>
          <span className="crm-timeline-quando">{dataHora(h.createdAt)}</span>
          <span className="crm-timeline-evt">{ROTULO_EVENTO[h.evento] ?? h.evento}</span>
          {h.userNome && <span className="crm-timeline-quem">por {h.userNome}</span>}
          {h.detalhe && <span className="crm-timeline-det">{h.detalhe}</span>}
        </li>
      ))}
    </ul>
  )
}

function Campo({ rot, val }: { rot: string; val: string }) {
  return (
    <div className="crm-campo-ro">
      <span className="crm-campo-rot">{rot}</span>
      <span className="crm-campo-val">{val}</span>
    </div>
  )
}

const TIPOS_ANEXO_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png']
const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024 // 10 MB

function mensagemErro(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

/* ============================================================
 * Anexos de uma solicitação (documentos ou recibo)
 * ========================================================== */
function Anexos({
  solicitacaoId,
  tipo,
  podeEnviar,
}: {
  solicitacaoId: string
  tipo: TipoAnexo
  podeEnviar: boolean
}) {
  const [itens, setItens] = useState<AnexoCRM[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const a = await listarAnexos(solicitacaoId)
        if (vivo) setItens(a.filter((x) => x.tipo === tipo))
      } catch (e) {
        if (vivo) setErro(mensagemErro(e))
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [solicitacaoId, tipo])

  const enviar = async (arquivo?: File) => {
    if (!arquivo) return
    setErro('')
    if (!TIPOS_ANEXO_ACEITOS.includes(arquivo.type)) {
      setErro('Envie apenas PDF, JPG ou PNG.')
      return
    }
    if (arquivo.size > TAMANHO_MAX_ANEXO) {
      setErro('Arquivo acima de 10 MB.')
      return
    }
    setEnviando(true)
    try {
      const novo = await enviarAnexo(solicitacaoId, tipo, arquivo)
      setItens((x) => [...x, novo])
    } catch (e) {
      setErro('Não foi possível enviar: ' + mensagemErro(e))
    } finally {
      setEnviando(false)
    }
  }

  const abrir = async (a: AnexoCRM) => {
    setErro('')
    try {
      const url = await urlAnexo(a.path)
      window.open(url, '_blank', 'noopener')
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  const remover = async (a: AnexoCRM) => {
    if (!confirm(`Remover "${a.nome}"?`)) return
    setErro('')
    try {
      await excluirAnexo(a)
      setItens((x) => x.filter((y) => y.id !== a.id))
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  return (
    <div className="crm-anexos">
      {carregando ? (
        <p className="crm-aviso">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="crm-aviso">Nenhum arquivo anexado.</p>
      ) : (
        <ul className="crm-anexos-lista">
          {itens.map((a) => (
            <li key={a.id}>
              <button type="button" className="admin-link" onClick={() => abrir(a)}>
                {a.nome}
              </button>
              {podeEnviar && (
                <button
                  type="button"
                  className="admin-link admin-link-danger"
                  onClick={() => remover(a)}
                >
                  remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeEnviar && (
        <label className="crm-anexo-add">
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            hidden
            disabled={enviando}
            onChange={(e) => {
              void enviar(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <span>{enviando ? 'Enviando…' : '+ Anexar arquivo'}</span>
        </label>
      )}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
