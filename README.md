# Escalas | N. Coroa Divina

App de escalas de trabalho do Núcleo Coroa Divina (UDV): cadastro de sócios com aprovação,
escalas por dia/área/função com vagas de **Responsável** e **Auxiliar**, inscrição em tempo real
e painel de administração.

**Stack:** Vue 3 · TypeScript · Pinia · Vue Router · Tailwind 4 · Supabase · Vercel · Resend

## Perfis

| Perfil | Como obtém | Pode |
|---|---|---|
| **Sócio** | Cadastro + aprovação de um admin | Ver escalas abertas, se inscrever em vagas livres, ver a equipe, cancelar |
| **Orgã** | Mandato (início/fim) cadastrado pelo admin | Tudo do sócio + gerenciar escalas enquanto o mandato estiver vigente |
| **Admin** | Definido por outro admin | Tudo + aprovar sócios, permissões e mandatos de Orgã |

## Estrutura (DDD)

```
src/
  app/            router (guards por perfil), layouts
  shared/         design system (ui/), estilos/tokens, supabase client, utilitários
  modules/
    identity/     cadastro, login, sessão        domain / application / infrastructure / presentation
    members/      sócios, permissões, mandatos
    catalog/      áreas e modelos de função
    schedules/    escalas, dias, funções, inscrições
supabase/
  migrations/     schema, RLS, RPCs (inscrever / cancelar_inscricao), catálogo inicial
  functions/      enviar-notificacao (e-mails via Resend)
api/keepalive.ts  cron da Vercel para o Supabase gratuito não pausar
```

Regras de vaga são garantidas **no banco** (RPC `inscrever` com `FOR UPDATE`), então duas pessoas
clicando na última vaga ao mesmo tempo não estouram o limite.

## Desenvolvimento

```bash
cp .env.example .env.local   # preencha URL e anon key do Supabase
npm install
npm run dev
npm test                     # testes de domínio
npm run build                # typecheck + build
```

## Configuração (uma vez)

### 1. Supabase

1. Crie um projeto em https://supabase.com (plano Free).
2. Aplique as migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   ```
3. **Authentication → URL Configuration**: `Site URL` = URL da Vercel; adicione
   `http://localhost:5173/**` e `https://<seu-app>.vercel.app/**` em *Redirect URLs*.
4. **Authentication → Providers → Email**: mantenha *Confirm email* ligado.
5. Primeiro admin: cadastre-se pelo app e rode no SQL Editor:
   ```sql
   update profiles set role = 'admin', status = 'aprovado' where email = 'seu@email.com';
   ```

### 2. Resend (e-mails)

1. Crie conta em https://resend.com e **verifique um domínio** (sem domínio, o Resend só envia
   para o e-mail do dono da conta).
2. **SMTP do Supabase Auth** (confirmação de cadastro e recuperação de senha) —
   *Authentication → Emails → SMTP Settings*:
   - Host `smtp.resend.com` · Port `465` · User `resend` · Password = API key do Resend
   - Sender: `escalas@seudominio.com`
3. **E-mails do app** (novo cadastro → admins, aprovação → sócio, cancelamento → Orgã):
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxx \
     EMAIL_FROM="Escalas Coroa Divina <escalas@seudominio.com>" \
     APP_URL=https://<seu-app>.vercel.app \
     WEBHOOK_SECRET=<uma-string-aleatoria>
   npx supabase functions deploy enviar-notificacao --no-verify-jwt
   ```
4. *Database → Webhooks → Create*: tabela `notificacoes`, evento **Insert**, tipo
   *Supabase Edge Function* → `enviar-notificacao`, header `x-webhook-secret: <mesma string>`.

### 3. Vercel

1. Importe o repositório (framework: Vite).
2. Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `CRON_SECRET`.
3. O `vercel.json` já configura o fallback de SPA e o cron diário `/api/keepalive`.
