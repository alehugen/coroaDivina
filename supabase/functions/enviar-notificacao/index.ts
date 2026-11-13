// Supabase Edge Function (Deno).
// Disparada por um Database Webhook em INSERT na tabela public.notificacoes.
// Envia o e-mail via Resend e marca a notificação como enviada.
//
// Secrets necessários (supabase secrets set ...):
//   RESEND_API_KEY, EMAIL_FROM (ex.: "Escalas Coroa Divina <escalas@seudominio.com>"),
//   APP_URL (ex.: https://escalas-coroa.vercel.app), WEBHOOK_SECRET
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados pela plataforma.

import { createClient } from 'npm:@supabase/supabase-js@2'

type Notificacao = {
  id: string
  tipo: 'novo_cadastro' | 'cadastro_aprovado' | 'cancelamento'
  payload: Record<string, string>
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)
const APP_URL = Deno.env.get('APP_URL') ?? ''

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const dataBR = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const layout = (titulo: string, corpo: string) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#17201a">
    <div style="background:#007f5f;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
      <strong>Escalas | N. Coroa Divina</strong>
    </div>
    <div style="border:1px solid #d9e0d0;border-top:0;padding:20px;border-radius:0 0 8px 8px">
      <h2 style="margin-top:0;color:#007f5f">${titulo}</h2>
      ${corpo}
    </div>
  </div>`

async function emailsAdmins(): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin')
    .eq('status', 'aprovado')
  return (data ?? []).map((p) => p.email)
}

async function emailsOrgas(dataRef: string): Promise<string[]> {
  const { data } = await supabase
    .from('orga_mandatos')
    .select('profiles!inner(email, status)')
    .lte('inicio', dataRef)
    .gte('fim', dataRef)
  const emails = (data ?? [])
    .map((m) => (m.profiles as unknown as { email: string; status: string }))
    .filter((p) => p.status === 'aprovado')
    .map((p) => p.email)
  return emails.length ? emails : emailsAdmins()
}

async function montar(n: Notificacao): Promise<{ to: string[]; subject: string; html: string }> {
  const p = n.payload
  switch (n.tipo) {
    case 'novo_cadastro':
      return {
        to: await emailsAdmins(),
        subject: `Novo cadastro aguardando aprovação: ${p.nome}`,
        html: layout(
          'Novo cadastro',
          `<p><strong>${esc(p.nome)}</strong> (${esc(p.email)}) se cadastrou e aguarda aprovação.</p>
           <p><a href="${APP_URL}/admin/socios">Abrir painel de sócios</a></p>`,
        ),
      }
    case 'cadastro_aprovado':
      return {
        to: [p.email],
        subject: 'Seu cadastro foi aprovado',
        html: layout(
          `Bem-vindo(a), ${esc(p.nome)}!`,
          `<p>Seu cadastro no app de escalas foi aprovado. Você já pode escolher suas funções.</p>
           <p><a href="${APP_URL}/escalas">Ver escalas abertas</a></p>`,
        ),
      }
    case 'cancelamento': {
      const papel = p.papel === 'responsavel' ? 'Responsável' : 'Auxiliar'
      return {
        to: await emailsOrgas(p.data),
        subject: `Cancelamento: ${p.socio} – ${p.funcao} (${dataBR(p.data)})`,
        html: layout(
          'Inscrição cancelada',
          `<p><strong>${esc(p.socio)}</strong> cancelou a inscrição:</p>
           <ul>
             <li><strong>Escala:</strong> ${esc(p.escala)}</li>
             <li><strong>Dia:</strong> ${dataBR(p.data)}</li>
             <li><strong>Função:</strong> ${esc(p.funcao)} (${papel})</li>
           </ul>
           <p><a href="${APP_URL}/escalas/${esc(p.escala_id)}">Abrir escala</a></p>`,
        ),
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('unauthorized', { status: 401 })
  }

  const body = await req.json()
  const n = body.record as Notificacao
  if (!n?.id) return new Response('sem registro', { status: 400 })

  try {
    const { to, subject, html } = await montar(n)
    if (!to.length) throw new Error('sem destinatários')

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM'), to, subject, html }),
    })
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`)

    await supabase.from('notificacoes').update({ enviada_em: new Date().toISOString() }).eq('id', n.id)
    return new Response('ok')
  } catch (e) {
    await supabase.from('notificacoes').update({ erro: String(e) }).eq('id', n.id)
    return new Response(String(e), { status: 500 })
  }
})
