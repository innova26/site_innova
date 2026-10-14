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

// Gera uma senha provisória legível (sem caracteres ambíguos).
function gerarSenha(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const num = '23456789'
  const low = 'abcdefghijkmnpqrstuvwxyz'
  const todos = abc + num + low
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  let s =
    abc[bytes[0] % abc.length] +
    num[bytes[1] % num.length] +
    low[bytes[2] % low.length]
  for (let i = 3; i < bytes.length; i++) s += todos[bytes[i] % todos.length]
  return s
}

// Envia o acesso (e-mail + senha provisória) pelo Resend. Não usa link de
// uso único, que o Microsoft/Exchange costuma pré-abrir e invalidar.
async function enviarAcesso(email: string, nome: string, senha: string, loginUrl: string) {
  if (!RESEND_API_KEY) return false
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px">
      <h2>Seu acesso ao CRM da Innova</h2>
      <p>Olá${nome ? ', ' + nome.split(' ')[0] : ''}! Sua conta de acesso ao Controle de CRM foi criada.</p>
      <p>Entre com estes dados:</p>
      <table cellpadding="0" style="border-collapse:collapse;font-size:15px">
        <tr><td style="padding:4px 10px"><strong>Endereço</strong></td><td style="padding:4px 10px"><a href="${loginUrl}">${loginUrl}</a></td></tr>
        <tr><td style="padding:4px 10px"><strong>E-mail</strong></td><td style="padding:4px 10px">${email}</td></tr>
        <tr><td style="padding:4px 10px"><strong>Senha provisória</strong></td><td style="padding:4px 10px"><code style="font-size:16px">${senha}</code></td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:20px">Guarde esta senha em local seguro. Se você não esperava este acesso, ignore este e-mail.</p>
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
    if (!resp.ok) console.error('Resend acesso falhou:', resp.status, await resp.text())
    return resp.ok
  } catch (e) {
    console.error('Erro ao enviar acesso:', e)
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

    // Cria o usuário com uma senha provisória e já confirma o e-mail,
    // para a pessoa entrar direto em /admin — sem link de uso único.
    const senha = gerarSenha()
    let userId: string | null = null
    let jaExistia = false

    const cr = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    })

    if (cr.data?.user) {
      userId = cr.data.user.id
    } else {
      // Já existe: localiza o usuário e redefine a senha provisória.
      const msg = (cr.error?.message || '').toLowerCase()
      const existe =
        (cr.error as { code?: string } | null)?.code === 'email_exists' ||
        msg.includes('already') ||
        msg.includes('registered') ||
        msg.includes('exists')
      if (!existe) {
        return json({ error: 'Não foi possível cadastrar: ' + (cr.error?.message ?? '') }, 400)
      }
      jaExistia = true
      // generateLink devolve o usuário existente (ignoramos o link).
      const look = await admin.auth.admin.generateLink({ type: 'recovery', email })
      const existente = look.data?.user
      if (look.error || !existente) {
        return json({ error: 'Usuário já existe, mas não foi localizado: ' + (look.error?.message ?? '') }, 400)
      }
      userId = existente.id
      const upd = await admin.auth.admin.updateUserById(userId, {
        password: senha,
        email_confirm: true,
      })
      if (upd.error) {
        return json({ error: 'Não foi possível redefinir a senha: ' + upd.error.message }, 400)
      }
    }

    const { error: errPerfil } = await admin.from('crm_perfis').upsert({
      user_id: userId,
      nome,
      email,
      papel,
      ativo: true,
    })
    if (errPerfil) return json({ error: errPerfil.message }, 500)

    const enviado = await enviarAcesso(email, nome, senha, REDIRECT)

    return json({
      ok: true,
      enviado,
      jaExistia,
      usuario: { user_id: userId, nome, email, papel, ativo: true },
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

  // --- redefinir senha (gera nova provisória e envia por e-mail) ---
  if (acao === 'redefinir_senha') {
    const userId = String(body.user_id ?? '')
    if (!userId) return json({ error: 'user_id obrigatório.' }, 422)

    const { data: alvo } = await admin
      .from('crm_perfis')
      .select('email, nome')
      .eq('user_id', userId)
      .maybeSingle()
    if (!alvo?.email) return json({ error: 'Usuário sem e-mail no perfil.' }, 400)

    const senha = gerarSenha()
    const upd = await admin.auth.admin.updateUserById(userId, {
      password: senha,
      email_confirm: true,
    })
    if (upd.error) return json({ error: upd.error.message }, 500)

    const enviado = await enviarAcesso(alvo.email, alvo.nome ?? '', senha, REDIRECT)
    return json({ ok: true, enviado })
  }

  // --- remover usuário (apaga o login e o perfil) ---
  if (acao === 'remover') {
    const userId = String(body.user_id ?? '')
    if (!userId) return json({ error: 'user_id obrigatório.' }, 422)
    if (userId === solicitante.id) {
      return json({ error: 'Você não pode remover o próprio usuário.' }, 409)
    }

    const del = await admin.auth.admin.deleteUser(userId)
    if (del.error) return json({ error: del.error.message }, 500)
    // o perfil cai por cascata (FK on delete cascade); garante mesmo assim
    await admin.from('crm_perfis').delete().eq('user_id', userId)
    return json({ ok: true })
  }

  return json({ error: 'Ação desconhecida.' }, 400)
})
