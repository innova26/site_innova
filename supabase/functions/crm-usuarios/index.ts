// Edge Function: crm-usuarios
// Gestão de usuários do CRM — SOMENTE para quem tem papel 'admin'.
//
//   acao "listar"    -> lista os perfis do CRM
//   acao "convidar"  -> cria o usuário e envia convite por e-mail (define a senha)
//   acao "atualizar" -> muda papel e/ou ativo de um usuário
//
// Verifica o solicitante pelo JWT (precisa ser admin) e executa as operações
// privilegiadas com a service role.
//
// Deploy:  supabase functions deploy crm-usuarios

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
// Para onde o convidado é levado ao definir a senha (ajustável por secret).
const REDIRECT = Deno.env.get('CRM_CONVITE_REDIRECT') ?? 'https://innovaoperadora.com.br/admin'

// E-mail do convite enviado pela própria função via Resend (sem depender do
// SMTP do Auth). Reaproveita a chave e o remetente já em produção.
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const REMETENTE =
  Deno.env.get('CRM_REMETENTE') ??
  Deno.env.get('COTACAO_REMETENTE') ??
  'Innova <onboarding@resend.dev>'

const PAPEIS = ['atendimento', 'enfermagem', 'financeiro', 'admin']

async function enviarConvite(email: string, nome: string, link: string) {
  if (!RESEND_API_KEY) return false
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px">
      <h2>Bem-vindo(a) ao CRM da Innova</h2>
      <p>Olá${nome ? ', ' + nome.split(' ')[0] : ''}! Sua conta de acesso ao Controle de CRM foi criada.</p>
      <p>Clique no botão abaixo para definir sua senha e acessar:</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#2456c9;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Definir minha senha</a>
      </p>
      <p style="color:#888;font-size:12px">Se você não esperava este convite, ignore este e-mail.</p>
    </div>`
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: [email],
        subject: 'Seu acesso ao CRM da Innova',
        html,
      }),
    })
    if (!resp.ok) console.error('Resend convite falhou:', resp.status, await resp.text())
    return resp.ok
  } catch (e) {
    console.error('Erro ao enviar convite:', e)
    return false
  }
}

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  // 1) identifica o solicitante pelo JWT
  const authHeader = req.headers.get('Authorization') ?? ''
  const comoUsuario = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await comoUsuario.auth.getUser()
  const solicitante = userData.user
  if (!solicitante) return json({ error: 'Não autenticado.' }, 401)

  // 2) confirma que é admin (com service role, sem depender de RLS)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: perfil } = await admin
    .from('crm_perfis')
    .select('papel, ativo')
    .eq('user_id', solicitante.id)
    .maybeSingle()

  if (!perfil || !perfil.ativo || perfil.papel !== 'admin') {
    return json({ error: 'Acesso restrito a administradores.' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido.' }, 400)
  }
  const acao = String(body.acao ?? '')

  // --- listar ---
  if (acao === 'listar') {
    const { data, error } = await admin
      .from('crm_perfis')
      .select('user_id, nome, email, papel, ativo, created_at')
      .order('created_at', { ascending: true })
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true, usuarios: data })
  }

  // --- convidar ---
  if (acao === 'convidar') {
    const nome = String(body.nome ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const papel = String(body.papel ?? '')
    if (!nome || !email || !PAPEIS.includes(papel)) {
      return json({ error: 'Dados inválidos.' }, 422)
    }

    // Tenta como usuário novo (invite). generateLink NÃO envia e-mail —
    // o envio é feito pelo Resend logo abaixo, sem depender do SMTP do Auth.
    const inv = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: { nome }, redirectTo: REDIRECT },
    })

    let user = inv.data?.user ?? null
    let link = inv.data?.properties?.action_link ?? null
    let jaExistia = false

    // Se o e-mail já existe, gera um link de recuperação (definir nova senha)
    // para o usuário existente, em vez de falhar com "já cadastrado".
    if (inv.error) {
      const msg = (inv.error.message || '').toLowerCase()
      const existe =
        (inv.error as { code?: string }).code === 'email_exists' ||
        msg.includes('already') ||
        msg.includes('registered') ||
        msg.includes('exists')
      if (!existe) {
        return json({ error: 'Não foi possível convidar: ' + inv.error.message }, 400)
      }
      jaExistia = true
      const rec = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: REDIRECT },
      })
      if (rec.error || !rec.data?.user || !rec.data.properties?.action_link) {
        return json(
          { error: 'Usuário já existe, mas não foi possível gerar o link de acesso: ' + (rec.error?.message ?? '') },
          400,
        )
      }
      user = rec.data.user
      link = rec.data.properties.action_link
    }

    if (!user || !link) {
      return json({ error: 'Não foi possível convidar: link indisponível.' }, 400)
    }

    const { error: errPerfil } = await admin.from('crm_perfis').upsert({
      user_id: user.id,
      nome,
      email,
      papel,
      ativo: true,
    })
    if (errPerfil) return json({ error: errPerfil.message }, 500)

    const enviado = await enviarConvite(email, nome, link)

    return json({
      ok: true,
      enviado,
      jaExistia,
      usuario: { user_id: user.id, nome, email, papel, ativo: true },
    })
  }

  // --- atualizar (papel / ativo) ---
  if (acao === 'atualizar') {
    const userId = String(body.user_id ?? '')
    if (!userId) return json({ error: 'user_id obrigatório.' }, 422)

    const patch: Record<string, unknown> = {}
    if (typeof body.papel === 'string') {
      if (!PAPEIS.includes(body.papel)) return json({ error: 'Papel inválido.' }, 422)
      patch.papel = body.papel
    }
    if (typeof body.ativo === 'boolean') patch.ativo = body.ativo
    if (Object.keys(patch).length === 0) return json({ error: 'Nada para atualizar.' }, 422)

    // evita o admin se auto-rebaixar/desativar e ficar sem acesso
    if (userId === solicitante.id && (patch.papel && patch.papel !== 'admin' || patch.ativo === false)) {
      return json({ error: 'Você não pode alterar o próprio acesso de admin.' }, 409)
    }

    const { data, error } = await admin
      .from('crm_perfis')
      .update(patch)
      .eq('user_id', userId)
      .select('user_id, nome, email, papel, ativo')
      .single()
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true, usuario: data })
  }

  return json({ error: 'Ação desconhecida.' }, 400)
})
