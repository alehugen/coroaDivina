// Supabase Edge Function (Deno) — exclusão PERMANENTE de uma conta, só por admin.
// Apaga o usuário do Auth; o banco remove em cascata o perfil, inscrições e mandatos.
//
// Chamada pelo app: supabase.functions.invoke('excluir-conta', { body: { profileId } })
// Deploy: npx supabase functions deploy excluir-conta   (com verificação de JWT, o padrão)
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY já são injetados pela plataforma.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const responder = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder(405, { error: 'método não permitido' })

  const url = Deno.env.get('SUPABASE_URL')!
  const authHeader = req.headers.get('Authorization') ?? ''

  // Quem está chamando?
  const comoUsuario = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
  } = await comoUsuario.auth.getUser()
  if (!user) return responder(401, { error: 'SEM_PERMISSAO' })

  const servico = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: chamador } = await servico.from('profiles').select('role, status').eq('id', user.id).single()
  if (chamador?.role !== 'admin' || chamador?.status !== 'aprovado') {
    return responder(403, { error: 'SEM_PERMISSAO' })
  }

  const { profileId } = (await req.json().catch(() => ({}))) as { profileId?: string }
  if (!profileId || !/^[0-9a-f-]{36}$/i.test(profileId)) return responder(400, { error: 'Informe o sócio.' })
  if (profileId === user.id) return responder(400, { error: 'EXCLUIR_A_SI_MESMO' })

  const { data: alvo } = await servico.from('profiles').select('role').eq('id', profileId).single()
  if (!alvo) return responder(404, { error: 'Sócio não encontrado.' })
  if (alvo.role === 'admin') return responder(400, { error: 'EXCLUIR_ADMIN' })

  const { error } = await servico.auth.admin.deleteUser(profileId)
  if (error) return responder(400, { error: error.message })

  return responder(200, { ok: true })
})
