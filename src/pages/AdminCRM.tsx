import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
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
  atualizarSolicitacao,
  criarSolicitacao,
  listarSolicitacoes,
  meuPapel,
  notificar,
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
        const p = await meuPapel()
        if (!vivo) return
        setPapel(p)
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
      if (patch.autorizacao === 'sim') void notificar('autorizada', id)
    } catch (e) {
      setErro('Não foi possível salvar a alteração: ' + String(e))
    }
  }

  const criar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setErro('')
    try {
      const nova = await criarSolicitacao({
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
      setLista((atual) => [nova, ...atual])
      setForm(null)
      void notificar('nova', nova.id)
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
        <h2 className="admin-secao-titulo">Controle de CRM · CM e Reembolsos</h2>
        <div className="crm-topo-acoes">
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
          <button type="button" className="btn btn-primary" onClick={() => setForm(FORM_VAZIO)}>
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
          onSalvar={criar}
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
  onSalvar,
  onCancelar,
}: {
  form: FormNova
  setForm: (f: FormNova) => void
  onSalvar: (e: FormEvent) => void
  onCancelar: () => void
}) {
  const set = (campo: keyof FormNova, valor: string) => setForm({ ...form, [campo]: valor })
  return (
    <div className="crm-overlay" role="dialog" aria-modal="true" onClick={onCancelar}>
      <form className="crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={onSalvar}>
        <h3>Nova solicitação</h3>

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
            value={form.procedimento}
            onChange={(e) => set('procedimento', e.target.value)}
            required
          />
        </div>

        <div className="linha">
          <div className="campo">
            <label htmlFor="n-clinica">Clínica / Hospital</label>
            <input
              id="n-clinica"
              value={form.clinicaHospital}
              onChange={(e) => set('clinicaHospital', e.target.value)}
            />
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

        <div className="crm-modal-acoes">
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Criar solicitação
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
}: {
  s: SolicitacaoCRM
  papel: PapelCRM
  onFechar: () => void
  onAtualizar: (id: string, patch: Partial<SolicitacaoCRM>) => void
}) {
  const et = etapaAtual(s)
  const [dataPrev, setDataPrev] = useState(s.dataPrevistaPagamento ?? '')
  const [status, setStatus] = useState<StatusFinanceiro>(s.statusFinanceiro ?? 'Pendente')

  return (
    <div className="crm-overlay" role="dialog" aria-modal="true" onClick={onFechar}>
      <aside className="crm-drawer" onClick={(e) => e.stopPropagation()}>
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
            </>
          )}
        </section>

        {s.observacoes && (
          <section className="crm-bloco">
            <h4>Observações</h4>
            <p className="crm-obs">{s.observacoes}</p>
          </section>
        )}
      </aside>
    </div>
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
