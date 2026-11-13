import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Cron diário (vercel.json) que faz uma leitura leve no Supabase para
 * evitar que o projeto gratuito seja pausado após 7 dias sem atividade.
 * A Vercel envia `Authorization: Bearer <CRON_SECRET>` quando a env existe.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false })
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return res.status(500).json({ ok: false, error: 'env ausente' })

  const r = await fetch(`${url}/rest/v1/rpc/ping`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status })
}
