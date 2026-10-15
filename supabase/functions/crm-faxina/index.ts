// Edge Function: crm-faxina
// Faxina seletiva dos anexos: apaga os DOCUMENTOS de solicitações que foram
// RECUSADAS há mais de N dias (padrão 90). Recibos e docs de solicitações
// pagas/ativas NÃO são tocados. Órfãos já são limpos na exclusão.
//
// Chamada por agendamento (pg_cron + pg_net), protegida por um secret.
//
// Deploy:  supabase functions deploy crm-faxina --no-verify-jwt
// Secrets: CRM_FAXINA_SECRET (obrigatório), CRM_FAXINA_DIAS (opcional, 90)

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DIAS = Number(Deno.env.get('CRM_FAXINA_DIAS') ?? '90')
const SECRET = Deno.env.get('CRM_FAXINA_SECRET') ?? ''
const BUCKET = 'crm-anexos'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // autorização: só roda com o secret correto (evita disparo indevido)
  const enviado = req.headers.get('x-faxina-secret') ?? ''
  if (!SECRET || enviado !== SECRET) {
    return json({ error: 'Não autorizado.' }, 401)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

  // data-limite: recusadas com data de autorização anterior a isso
  const limite = new Date(Date.now() - DIAS * 86400000).toISOString().slice(0, 10)

  // documentos de solicitações recusadas há mais de N dias
  const { data: alvos, error } = await admin
    .from('crm_anexos')
    .select('id, path, crm_solicitacoes!inner(autorizacao, data_autorizacao)')
    .eq('tipo', 'documento')
    .eq('crm_solicitacoes.autorizacao', 'nao')
    .lte('crm_solicitacoes.data_autorizacao', limite)

  if (error) {
    console.error('Erro ao buscar alvos:', error)
    return json({ error: error.message }, 500)
  }

  const lista = (alvos ?? []) as { id: string; path: string }[]
  const paths = lista.map((a) => a.path)
  const ids = lista.map((a) => a.id)

  if (paths.length) {
    const rem = await admin.storage.from(BUCKET).remove(paths)
    if (rem.error) console.error('Erro ao remover do Storage:', rem.error)
    const del = await admin.from('crm_anexos').delete().in('id', ids)
    if (del.error) {
      console.error('Erro ao apagar metadados:', del.error)
      return json({ error: del.error.message }, 500)
    }
  }

  console.log(`Faxina: ${paths.length} documento(s) removido(s) (recusadas > ${DIAS} dias).`)
  return json({ ok: true, removidos: paths.length, dias: DIAS })
})
