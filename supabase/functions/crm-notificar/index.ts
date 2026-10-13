// Edge Function: crm-notificar
// Envia o aviso por e-mail entre as etapas do Controle de CRM.
//
//   evento "nova"       -> atendimento abriu  -> avisa a ENFERMAGEM (regulação)
//   evento "autorizada" -> enfermagem liberou -> avisa o FINANCEIRO
//
// Reaproveita a conta Resend já em produção (mesmo RESEND_API_KEY e o
// remetente do domínio verificado). Busca a solicitação pelo id com a
// service role, então não confia em dados vindos do cliente.
//
// Deploy:  supabase functions deploy crm-notificar
// Secrets reaproveitados: RESEND_API_KEY, COTACAO_REMETENTE
// Secrets opcionais (têm fallback embutido):
//   CRM_REMETENTE, CRM_EMAIL_ENFERMAGEM, CRM_EMAIL_FINANCEIRO

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

const REMETENTE =
  Deno.env.get('CRM_REMETENTE') ??
  Deno.env.get('COTACAO_REMETENTE') ??
  'Innova <onboarding@resend.dev>'

const EMAIL_ENFERMAGEM =
  Deno.env.get('CRM_EMAIL_ENFERMAGEM') ?? 'regulacao@innovaoperadora.com.br'
const EMAIL_FINANCEIRO =
  Deno.env.get('CRM_EMAIL_FINANCEIRO') ?? 'financeiro@innovaoperadora.com.br'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function esc(s: string) {
  return String(s ?? '').replace(/[<>&"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string),
  )
}

function fmtData(iso: string | null) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  return a && m && d ? `${d}/${m}/${a}` : '—'
}

function fmtValor(v: number | null) {
  if (v == null) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido.' }, 400)
  }

  const evento = String(body.evento ?? '')
  const id = String(body.id ?? '')
  if (!['nova', 'autorizada'].includes(evento) || !id) {
    return json({ error: 'Parâmetros inválidos.' }, 422)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: s, error } = await supabase
    .from('crm_solicitacoes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !s) {
    console.error('Solicitação não encontrada:', error)
    return json({ error: 'Solicitação não encontrada.' }, 404)
  }

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY ausente — e-mail não enviado.')
    return json({ ok: true, enviado: false })
  }

  const destino = evento === 'nova' ? EMAIL_ENFERMAGEM : EMAIL_FINANCEIRO
  const assunto =
    evento === 'nova'
      ? `Nova solicitação ${s.protocolo} — aguardando análise`
      : `Solicitação ${s.protocolo} autorizada — providenciar pagamento`
  const chamada =
    evento === 'nova'
      ? 'Uma nova solicitação foi aberta pelo atendimento e aguarda a análise da enfermagem.'
      : 'A enfermagem autorizou a solicitação abaixo. O financeiro pode providenciar o pagamento.'

  const linha = (rot: string, val: string) =>
    `<tr><td style="padding:4px 10px"><strong>${rot}</strong></td><td style="padding:4px 10px">${esc(val)}</td></tr>`

  const html = `
    <h2>${esc(s.protocolo)}</h2>
    <p style="font-family:Arial,sans-serif">${chamada}</p>
    <table cellpadding="0" style="border-collapse:collapse;font-family:Arial,sans-serif">
      ${linha('Beneficiário / Paciente', s.beneficiario)}
      ${linha('Procedimento', s.procedimento)}
      ${linha('Clínica / Hospital', s.clinica_hospital ?? '—')}
      ${linha('Valor solicitado', fmtValor(s.valor_solicitado))}
      ${linha('Solicitante', s.solicitante)}
      ${linha('Data da consulta', fmtData(s.data_consulta))}
      ${evento === 'autorizada' ? linha('Data autorização', fmtData(s.data_autorizacao)) : ''}
      ${evento === 'autorizada' ? linha('Dados bancários (Pix)', s.dados_bancarios ?? '—') : ''}
    </table>`

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: [destino],
        subject: assunto,
        html,
      }),
    })
    if (!resp.ok) {
      console.error('Resend falhou:', resp.status, await resp.text())
      return json({ ok: true, enviado: false })
    }
  } catch (e) {
    console.error('Erro no envio de e-mail:', e)
    return json({ ok: true, enviado: false })
  }

  return json({ ok: true, enviado: true, destino })
})
