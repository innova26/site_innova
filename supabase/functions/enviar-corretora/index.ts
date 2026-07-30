// Edge Function: enviar-corretora
// Recebe os dados do formulário /corretoras, grava na tabela `corretoras`
// (service role) e envia um e-mail de aviso via Resend.
//
// Deploy:  supabase functions deploy enviar-corretora
// Reaproveita os secrets COTACAO_DESTINO / COTACAO_REMETENTE (opcionalmente
// CORRETORA_DESTINO sobrescreve o destino).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const DESTINO =
  Deno.env.get('CORRETORA_DESTINO') ??
  Deno.env.get('COTACAO_DESTINO') ??
  'faleconosco@innovaoperadora.com.br'
const REMETENTE =
  Deno.env.get('COTACAO_REMETENTE') ?? 'Innova <onboarding@resend.dev>'

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
    nome: str('nome'),
    documento: str('documento'),
    susep: str('susep'),
    cnh: str('cnh'),
    inscricao: str('inscricao'),
    endereco: str('endereco'),
    telefone: str('telefone'),
    email: str('email'),
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)
  const telOk = dados.telefone.replace(/\D/g, '').length >= 10
  if (
    dados.nome.length < 3 ||
    !dados.documento ||
    !dados.susep ||
    !dados.endereco ||
    !emailOk ||
    !telOk
  ) {
    return json({ error: 'Dados inválidos.' }, 422)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1) grava o lead
  const { error: dbErr } = await supabase.from('corretoras').insert(dados)
  if (dbErr) {
    console.error('Erro ao gravar corretora:', dbErr)
    return json({ error: 'Não foi possível registrar seu cadastro.' }, 500)
  }

  // 2) e-mail de aviso (best-effort)
  if (RESEND_API_KEY) {
    try {
      const linha = (rot: string, val: string) =>
        val
          ? `<tr><td style="padding:4px 10px"><strong>${rot}</strong></td><td style="padding:4px 10px">${esc(val)}</td></tr>`
          : ''

      const html = `
        <h2>Novo cadastro de corretora</h2>
        <table cellpadding="0" style="border-collapse:collapse;font-family:Arial,sans-serif">
          ${linha('Nome / Razão social', dados.nome)}
          ${linha('CNPJ / CPF', dados.documento)}
          ${linha('Registro SUSEP', dados.susep)}
          ${linha('CNH', dados.cnh)}
          ${linha('Inscrição municipal', dados.inscricao)}
          ${linha('Endereço', dados.endereco)}
          ${linha('Telefone', dados.telefone)}
          ${linha('E-mail', dados.email)}
        </table>`

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: REMETENTE,
          to: [DESTINO],
          reply_to: dados.email,
          subject: `Nova corretora — ${dados.nome} (SUSEP ${dados.susep})`,
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
