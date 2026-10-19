import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import { mascaraDocumento } from '../utils/formulario'
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
  cpf: string
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
  cpf: '',
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
      setErro('Não foi possível carregar as solicitações: ' + mensagemErro(e))
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
        if (vivo) setErro('Falha ao iniciar o CRM: ' + mensagemErro(e))
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
      setErro('Não foi possível salvar a alteração: ' + mensagemErro(e))
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
      setErro('Não foi possível excluir: ' + mensagemErro(e))
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
        cpf: form.cpf.trim(),
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
      // dedup por id: o tempo real pode ter adicionado a nova antes daqui
      setLista((atual) => [nova, ...atual.filter((s) => s.id !== nova.id)])
      setForm(null)
      if (AVISOS_ATIVOS) void notificar('nova', nova.id)
    } catch (err) {
      setErro('Não foi possível criar a solicitação: ' + mensagemErro(err))
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
        <div className="crm-toast-erro" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={() => setErro('')} aria-label="Fechar">
            ×
          </button>
        </div>
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
    if (salvando) return
    setSalvando(true)
    await onCriar(docs)
    setSalvando(false)
  }

  return (
    <div className="crm-overlay" role="dialog" aria-modal="true">
      <form className="crm-modal" onSubmit={enviar}>
        <div className="crm-modal-head">
          <div>
            <h3>Nova solicitação</h3>
            <p className="crm-modal-sub">Preencha os dados do atendimento para abrir o protocolo.</p>
          </div>
          <button type="button" className="crm-fechar" onClick={onCancelar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="crm-modal-corpo">
          <fieldset className="crm-fgrp">
            <legend>Identificação</legend>
            <div className="linha">
              <div className="campo">
                <label htmlFor="n-protocolo">
                  Protocolo <span className="crm-req">*</span>
                </label>
                <input
                  id="n-protocolo"
                  placeholder="Protocolo do sistema de origem"
                  value={form.protocolo}
                  onChange={(e) => set('protocolo', e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="n-solic">
                  Solicitante <span className="crm-req">*</span>
                </label>
                <input
                  id="n-solic"
                  value={form.solicitante}
                  onChange={(e) => set('solicitante', e.target.value)}
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="crm-fgrp">
            <legend>Paciente</legend>
            <div className="linha">
              <div className="campo">
                <label htmlFor="n-benef">
                  Beneficiário / Paciente <span className="crm-req">*</span>
                </label>
                <input
                  id="n-benef"
                  value={form.beneficiario}
                  onChange={(e) => set('beneficiario', e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="n-cpf">CPF do paciente</label>
                <input
                  id="n-cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => set('cpf', mascaraDocumento(e.target.value))}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="crm-fgrp">
            <legend>Atendimento</legend>
            <div className="campo">
              <label htmlFor="n-proc">
                Procedimento <span className="crm-req">*</span>
              </label>
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
          </fieldset>

          <fieldset className="crm-fgrp">
            <legend>Pagamento</legend>
            <div className="campo">
              <label htmlFor="n-banc">Dados bancários (Pix)</label>
              <input
                id="n-banc"
                placeholder="Pix (e-mail / CPF-CNPJ / telefone / chave)"
                value={form.dadosBancarios}
                onChange={(e) => set('dadosBancarios', e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="crm-fgrp">
            <legend>Anexos e observações</legend>
            <div className="campo">
              <label>
                Documentos <span className="opcional">(PDF, JPG ou PNG)</span>
              </label>
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

            <div className="campo">
              <label htmlFor="n-obs">Observações</label>
              <textarea
                id="n-obs"
                rows={2}
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
              />
            </div>
          </fieldset>
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

  const autorizado = s.autorizacao === 'sim'
  const classeEnf = s.autorizacao !== 'pendente' ? 'done' : 'active'
  const classeFin =
    et.chave === 'pago'
      ? 'done'
      : et.chave === 'financeiro' || et.chave === 'agendado'
        ? 'active'
        : ''

  return (
    <div className="crm-overlay" role="dialog" aria-modal="true">
      <aside className="crm-drawer">
        <div className="crm-dh-top">
          <span className={`crm-badge tom-${et.tom}`}>{et.label}</span>
          <button type="button" className="crm-fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="crm-dh-title">
          <h3>{s.beneficiario}</h3>
          <div className="crm-dh-desc">
            {s.procedimento}
            {s.clinicaHospital ? ` · ${s.clinicaHospital}` : ''}
          </div>
          <div className="crm-dh-proto">Protocolo {s.protocolo}</div>
        </div>

        <div className="crm-stats">
          <div className="crm-stat big">
            <div className="k">Valor</div>
            <div className="v">{formatarValor(s.valorSolicitado)}</div>
          </div>
          <div className="crm-stat">
            <div className="k">Consulta</div>
            <div className="v">{formatarData(s.dataConsulta)}</div>
          </div>
          <div className="crm-stat">
            <div className="k">Prazo</div>
            <div className="v">{formatarData(s.termino)}</div>
          </div>
        </div>

        <div className="crm-steps" aria-hidden="true">
          <div className="crm-step done">
            <span className="crm-step-b">✓</span>
            <span className="crm-step-t">Atendimento</span>
            <span className="crm-step-ln" />
          </div>
          <div className={`crm-step ${classeEnf}`}>
            <span className="crm-step-b">{classeEnf === 'done' ? '✓' : '2'}</span>
            <span className="crm-step-t">Enfermagem</span>
            <span className="crm-step-ln" />
          </div>
          <div className={`crm-step ${classeFin}`}>
            <span className="crm-step-b">{classeFin === 'done' ? '✓' : '3'}</span>
            <span className="crm-step-t">Financeiro</span>
          </div>
        </div>

        {/* ---- zona de ação contextual ---- */}
        {et.chave === 'enfermagem' &&
          (podeEditarEnfermagem(papel) ? (
            <div className="crm-acao">
              <div className="crm-acao-lbl">Esta solicitação aguarda a análise da enfermagem.</div>
              <div className="crm-acoes">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onAtualizar(s.id, { autorizacao: 'sim', dataAutorizacao: hojeISO() })}
                >
                  Autorizar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost crm-btn-recusar"
                  onClick={() => onAtualizar(s.id, { autorizacao: 'nao', dataAutorizacao: hojeISO() })}
                >
                  Recusar
                </button>
              </div>
            </div>
          ) : (
            <p className="crm-acao-nota crm-aviso">Aguardando a análise da enfermagem.</p>
          ))}

        {et.chave === 'recusado' && (
          <div className="crm-acao-crit">
            Não autorizado{s.dataAutorizacao ? ` em ${formatarData(s.dataAutorizacao)}` : ''}.
          </div>
        )}

        {(et.chave === 'financeiro' || et.chave === 'agendado') && (
          <>
            <p className="crm-acao-nota crm-ok">
              ✓ Autorizado{s.dataAutorizacao ? ` em ${formatarData(s.dataAutorizacao)}` : ''}
            </p>
            {podeEditarFinanceiro(papel) ? (
              <div className="crm-acao">
                <div className="crm-acao-lbl">Pagamento</div>
                <div className="crm-linha2">
                  <div className="campo">
                    <label>Data prevista</label>
                    <input type="date" value={dataPrev} onChange={(e) => setDataPrev(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as StatusFinanceiro)}>
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
                      onAtualizar(s.id, { dataPrevistaPagamento: dataPrev || null, statusFinanceiro: status })
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
            ) : (
              <p className="crm-acao-nota crm-aviso">Aguardando o financeiro.</p>
            )}
          </>
        )}

        {et.chave === 'pago' && (
          <div className="crm-acao-ok">
            ✓ Pago{s.dataPagamento ? ` em ${formatarData(s.dataPagamento)}` : ''}
            {s.dataPrevistaPagamento ? ` · prev. ${formatarData(s.dataPrevistaPagamento)}` : ''}
          </div>
        )}

        {/* ---- informações ---- */}
        <section className="crm-bloco">
          <h4>Paciente e atendimento</h4>
          <div className="crm-linha2">
            <Campo rot="CPF do paciente" val={s.cpf || '—'} />
            <Campo rot="Solicitante" val={s.solicitante} />
          </div>
          <div className="crm-linha2">
            <Campo rot="Procedimento" val={s.procedimento} />
            <Campo rot="Clínica / Hospital" val={s.clinicaHospital || '—'} />
          </div>
          <Campo rot="Abertura" val={formatarData(s.abertura)} />
        </section>

        <section className="crm-bloco">
          <h4>Dados para pagamento</h4>
          {s.dadosBancarios ? (
            <div className="crm-pay">
              <span className="crm-pay-info">{s.dadosBancarios}</span>
              <BotaoCopiarPix dados={s.dadosBancarios} />
            </div>
          ) : (
            <p className="crm-aviso">Não informado.</p>
          )}
        </section>

        <section className="crm-bloco">
          <h4>Documentos</h4>
          <Anexos solicitacaoId={s.id} tipo="documento" podeEnviar={podeEditarAtendimento(papel)} />
        </section>

        {autorizado && (
          <section className="crm-bloco">
            <h4>Recibo de pagamento</h4>
            <Anexos solicitacaoId={s.id} tipo="recibo" podeEnviar={podeEditarFinanceiro(papel)} />
          </section>
        )}

        {s.observacoes && (
          <section className="crm-bloco">
            <h4>Observações</h4>
            <p className="crm-obs">{s.observacoes}</p>
          </section>
        )}

        <details className="crm-hist-det">
          <summary>
            <span>Histórico</span>
            <span aria-hidden="true">▾</span>
          </summary>
          <div className="crm-hist-corpo">
            <Historico solicitacaoId={s.id} />
          </div>
        </details>

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

/** Extrai só a chave Pix (o que se cola no banco), sem o rótulo. */
function chavePixParaCopiar(dados: string): string {
  const t = dados.trim()
  return t.includes(':') ? t.slice(t.lastIndexOf(':') + 1).trim() : t
}

function IconeCopiar() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BotaoCopiarPix({ dados }: { dados: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(chavePixParaCopiar(dados))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* alguns navegadores bloqueiam; ignora */
    }
  }
  return (
    <button
      type="button"
      className={`crm-copiar${copiado ? ' ok' : ''}`}
      onClick={copiar}
      aria-label="Copiar chave Pix"
      title="Copiar chave Pix"
    >
      {copiado ? '✓ Copiado' : <IconeCopiar />}
    </button>
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
