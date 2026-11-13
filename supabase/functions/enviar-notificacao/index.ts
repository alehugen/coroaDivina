// Supabase Edge Function (Deno).
// Disparada por um Database Webhook em INSERT na tabela public.notificacoes.
// Envia o e-mail por SMTP (Gmail) e marca a notificação como enviada.
//
// Secrets necessários (supabase secrets set ...):
//   SMTP_USER  — conta Gmail remetente
//   SMTP_PASS  — senha de app do Gmail (16 letras)
//   APP_URL    — ex.: https://escalas-coroa.vercel.app
//   WEBHOOK_SECRET — mesmo valor configurado no header do Database Webhook
// Opcionais: SMTP_HOST (padrão smtp.gmail.com), EMAIL_FROM_NAME (padrão "Escalas Coroa Divina")
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados pela plataforma.
//
// Importante: Edge Functions bloqueiam as portas 25 e 587 — por isso SMTP em 465 (SSL).

import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

type ItemLembrete = { funcao: string; papel: string; area: string; escala: string; escala_id: string }

type Notificacao = {
  id: string
  tipo: 'cadastro_aprovado' | 'cancelamento' | 'lembrete' | 'exclusao_solicitada'
  // deno-lint-ignore no-explicit-any
  payload: Record<string, any>
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const diaDaSemana = (iso: string) => DIAS[new Date(`${iso}T12:00:00`).getDay()]
const rotuloPapel = (p: string) => (p === 'responsavel' ? 'Responsável' : 'Auxiliar')

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)
const APP_URL = Deno.env.get('APP_URL') ?? ''
const SMTP_USER = Deno.env.get('SMTP_USER')!
const FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') ?? 'Escalas Coroa Divina'

const smtp = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: Deno.env.get('SMTP_PASS')! },
})

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
    case 'cadastro_aprovado':
      return {
        to: [p.email],
        subject: 'Seu acesso ao app de escalas está liberado',
        html: layout(
          `Olá, ${esc(p.nome)}!`,
          `<p>Seu acesso ao app de escalas está liberado. Você já pode escolher suas funções.</p>
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
    case 'lembrete': {
      const itens = p.itens as ItemLembrete[]
      const linhas = itens
        .map(
          (i) => `<li style="margin-bottom:6px"><strong>${esc(i.funcao)}</strong> — ${rotuloPapel(i.papel)}
                  <br><span style="color:#5a6b5d;font-size:13px">${esc(i.area)} · ${esc(i.escala)}</span></li>`,
        )
        .join('')
      return {
        to: [p.email],
        subject: `Lembrete: amanhã (${diaDaSemana(p.data)}, ${dataBR(p.data).slice(0, 5)}) você está na escala`,
        html: layout(
          `Olá, ${esc(String(p.nome).split(' ')[0])}!`,
          `<p>Passando para lembrar que <strong>amanhã, ${diaDaSemana(p.data)} (${dataBR(p.data)})</strong>, você está escalado(a) em:</p>
           <ul style="padding-left:20px">${linhas}</ul>
           <p><a href="${new Set(itens.map((i) => i.escala_id)).size === 1
                 ? `${APP_URL}/escalas/${esc(itens[0]!.escala_id)}?dia=${esc(p.data)}`
                 : `${APP_URL}/minhas-escalas`}"
                 style="display:inline-block;background:#007f5f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
                 Ver a escala</a></p>
           <p style="color:#5a6b5d;font-size:13px">Não vai conseguir? Entre no app e saia da função para liberar a vaga.
              Para não receber lembretes, desligue em “Meu perfil”.</p>`,
        ),
      }
    }
    case 'exclusao_solicitada':
      return {
        to: await emailsAdmins(),
        subject: `Pedido de exclusão de conta: ${p.nome}`,
        html: layout(
          'Pedido de exclusão de conta',
          `<p><strong>${esc(p.nome)}</strong> (${esc(p.email)}) pediu para excluir a conta permanentemente.</p>
           <p>Aprove ou recuse em <a href="${APP_URL}/admin/socios">Administração → Sócios</a>.</p>`,
        ),
      }
    default:
      throw new Error(`tipo de notificação desconhecido: ${n.tipo}`)
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('unauthorized', { status: 401 })
  }

  let n: Notificacao | undefined
  try {
    n = ((await req.json()) as { record?: Notificacao }).record
  } catch {
    return new Response('corpo inválido', { status: 400 })
  }
  if (!n?.id) return new Response('sem registro', { status: 400 })

  try {
    const { to, subject, html } = await montar(n)
    if (!to.length) throw new Error('sem destinatários')

    // Vários destinatários (admins/Orgãs) vão em cópia oculta para não expor e-mails.
    await smtp.sendMail({
      from: { name: FROM_NAME, address: SMTP_USER },
      ...(to.length === 1 ? { to } : { to: SMTP_USER, bcc: to }),
      subject,
      html,
    })

    await supabase.from('notificacoes').update({ enviada_em: new Date().toISOString() }).eq('id', n.id)
    return new Response('ok')
  } catch (e) {
    // Fica pendente: o job "reenviar-notificacoes" tenta de novo (até 3x)
    await supabase.from('notificacoes').update({ erro: String(e) }).eq('id', n.id)
    return new Response(String(e), { status: 500 })
  }
})
