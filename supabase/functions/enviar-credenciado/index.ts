// Edge Function: enviar-credenciado
// Recebe os dados do formulário "Seja um credenciado", grava na tabela
// `credenciados` (service role) e envia um e-mail de aviso via Resend, com
// link assinado do PDF de portfólio (quando enviado).
//
// Deploy:  supabase functions deploy enviar-credenciado
// Reaproveita os secrets COTACAO_DESTINO / COTACAO_REMETENTE (opcionalmente
// CREDENCIADO_DESTINO sobrescreve o destino).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const DESTINOS = (
  Deno.env.get('CREDENCIADO_DESTINO') ??
  Deno.env.get('COTACAO_DESTINO') ??
  'relacionamentorede@innovaoperadora.com.br'
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
const REMETENTE =
  Deno.env.get('COTACAO_REMETENTE') ?? 'Innova <onboarding@resend.dev>'

const SIGNED_URL_TTL = 60 * 60 * 24 * 90 // 90 dias

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
  return s.replace(/[<>&"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string),
  )
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

  const str = (k: string) => String(body[k] ?? '').trim()
  const dados = {
    documento: str('documento'),
    nome: str('nome'),
    telefone: str('telefone'),
    whatsapp: str('whatsapp'),
    email: str('email'),
    endereco: str('endereco'),
    numero: str('numero'),
    bairro: str('bairro'),
    cidade: str('cidade'),
    uf: str('uf'),
    tipo: str('tipo'),
    especialidades: str('especialidades'),
    comentario: str('comentario'),
  }
  const portfolioPath = str('portfolioPath') || null

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)
  const telOk = dados.telefone.replace(/\D/g, '').length >= 10
  const obrig = [
    dados.documento,
    dados.endereco,
    dados.numero,
    dados.bairro,
    dados.cidade,
    dados.uf,
    dados.tipo,
    dados.especialidades,
  ]
  if (
    dados.nome.length < 3 ||
    !emailOk ||
    !telOk ||
    obrig.some((v) => !v)
  ) {
    return json({ error: 'Dados inválidos.' }, 422)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1) grava o lead
  const { error: dbErr } = await supabase
    .from('credenciados')
    .insert({ ...dados, portfolio_path: portfolioPath })

  if (dbErr) {
    console.error('Erro ao gravar credenciado:', dbErr)
    return json({ error: 'Não foi possível registrar seu cadastro.' }, 500)
  }

  // 2) link assinado do portfólio (quando houver)
  let portfolioUrl: string | null = null
  if (portfolioPath) {
    const { data, error } = await supabase.storage
      .from('portfolios')
      .createSignedUrl(portfolioPath, SIGNED_URL_TTL)
    if (error) console.error('Erro ao assinar portfólio:', error)
    else portfolioUrl = data?.signedUrl ?? null
  }

  // 3) e-mail de aviso (best-effort)
  if (RESEND_API_KEY) {
    try {
      const linha = (rot: string, val: string) =>
        val
          ? `<tr><td style="padding:4px 10px"><strong>${rot}</strong></td><td style="padding:4px 10px">${esc(val)}</td></tr>`
          : ''

      const html = `
        <h2>Novo cadastro de credenciamento</h2>
        <table cellpadding="0" style="border-collapse:collapse;font-family:Arial,sans-serif">
          ${linha('Nome / Razão social', dados.nome)}
          ${linha('CNPJ / CPF', dados.documento)}
          ${linha('Tipo', dados.tipo)}
          ${linha('Especialidades', dados.especialidades)}
          ${linha('Telefone', dados.telefone)}
          ${linha('WhatsApp', dados.whatsapp)}
          ${linha('E-mail', dados.email)}
          ${linha('Endereço', `${dados.endereco}, ${dados.numero} — ${dados.bairro}, ${dados.cidade}/${dados.uf}`)}
          ${linha('Comentário', dados.comentario)}
        </table>
        ${
          portfolioUrl
            ? `<p style="font-family:Arial,sans-serif"><a href="${portfolioUrl}">📎 Baixar portfólio (PDF)</a> <em>(link válido por 90 dias)</em></p>`
            : '<p style="font-family:Arial,sans-serif;color:#888">Sem portfólio anexado.</p>'
        }`

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: REMETENTE,
          to: DESTINOS,
          reply_to: dados.email,
          subject: `Novo credenciamento — ${dados.nome} (${dados.tipo})`,
          html,
        }),
      })
      if (!resp.ok) console.error('Resend falhou:', resp.status, await resp.text())
    } catch (e) {
      console.error('Erro no envio de e-mail:', e)
    }
  } else {
    console.warn('RESEND_API_KEY ausente — cadastro gravado, e-mail não enviado.')
  }

  return json({ ok: true })
})
