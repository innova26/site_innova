// Edge Function: enviar-cotacao
// Recebe os dados do formulário de cotação, grava na tabela `cotacoes`
// (service role, ignora RLS) e envia um e-mail de aviso via Resend.
//
// Deploy:  supabase functions deploy enviar-cotacao
// Secrets: supabase secrets set RESEND_API_KEY=... COTACAO_DESTINO=... COTACAO_REMETENTE=...

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const DESTINO = Deno.env.get('COTACAO_DESTINO') ?? 'faleconosco@innovaoperadora.com.br'
// Antes de verificar o domínio no Resend, use o remetente de teste deles:
//   Innova <onboarding@resend.dev>
// Depois de verificar innovaoperadora.com.br, troque para algo como:
//   Innova <cotacao@innovaoperadora.com.br>
const REMETENTE = Deno.env.get('COTACAO_REMETENTE') ?? 'Innova <onboarding@resend.dev>'

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

  const plano = String(body.plano ?? '').trim()
  const pessoas = Number(body.pessoas)
  const nome = String(body.nome ?? '').trim()
  const email = String(body.email ?? '').trim()
  const telefone = String(body.telefone ?? '').trim()

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const telOk = telefone.replace(/\D/g, '').length >= 10
  if (
    !plano ||
    nome.length < 3 ||
    !emailOk ||
    !telOk ||
    !Number.isInteger(pessoas) ||
    pessoas < 1
  ) {
    return json({ error: 'Dados inválidos.' }, 422)
  }

  // 1) grava o lead (garante que nada se perde, mesmo se o e-mail falhar)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { error: dbErr } = await supabase
    .from('cotacoes')
    .insert({ plano, pessoas, nome, email, telefone })

  if (dbErr) {
    console.error('Erro ao gravar cotação:', dbErr)
    return json({ error: 'Não foi possível registrar sua cotação.' }, 500)
  }

  // 2) envia o e-mail de aviso (não derruba a requisição se falhar)
  if (RESEND_API_KEY) {
    try {
      const html = `
        <h2>Nova solicitação de cotação</h2>
        <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif">
          <tr><td><strong>Nome</strong></td><td>${esc(nome)}</td></tr>
          <tr><td><strong>Plano</strong></td><td>${esc(plano)}</td></tr>
          <tr><td><strong>Pessoas</strong></td><td>${pessoas}</td></tr>
          <tr><td><strong>E-mail</strong></td><td>${esc(email)}</td></tr>
          <tr><td><strong>Telefone</strong></td><td>${esc(telefone)}</td></tr>
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
          reply_to: email,
          subject: `Nova cotação — ${nome} (${plano})`,
          html,
        }),
      })
      if (!resp.ok) console.error('Resend falhou:', resp.status, await resp.text())
    } catch (e) {
      console.error('Erro no envio de e-mail:', e)
    }
  } else {
    console.warn('RESEND_API_KEY ausente — lead gravado, mas e-mail não enviado.')
  }

  return json({ ok: true })
})
