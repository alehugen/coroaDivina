# Escalas | N. Coroa Divina

App de escalas de trabalho do Núcleo Coroa Divina (UDV): cadastro de sócios com aprovação,
escalas por dia/área/função com vagas de **Responsável** e **Auxiliar**, inscrição em tempo real
e painel de administração.

**Stack:** Vue 3 · TypeScript · Pinia · Vue Router · Tailwind 4 · shadcn-vue (Reka UI) · Phosphor Icons · Supabase · Vercel · Gmail (SMTP)

## Perfis

| Perfil | Como obtém | Pode |
|---|---|---|
| **Sócio** | Cadastro (entra na hora) | Ver escalas abertas, se inscrever em vagas livres, ver a equipe, cancelar |
| **Orgã** | Mandato (início/fim) cadastrado pelo admin | Tudo do sócio + gerenciar escalas enquanto o mandato estiver vigente |
| **Admin** | Definido por outro admin | Tudo + aprovar sócios, permissões e mandatos de Orgã |

## Estrutura (DDD)

```
src/
  app/            router (guards por perfil), layouts
  components/ui/  componentes shadcn-vue (gerados pela CLI; `npx shadcn-vue@latest add <nome>` —
                  depois confira o diff de src/shared/styles/main.css: a CLI às vezes reinsere tokens/fontes padrão)
  shared/         componentes compostos do app (ui/), tema/tokens, supabase client, utilitários
  modules/
    identity/     cadastro, login, sessão        domain / application / infrastructure / presentation
    members/      sócios, permissões, mandatos
    catalog/      áreas e modelos de função
    schedules/    escalas, dias, funções, inscrições
supabase/
  migrations/     schema, RLS, RPCs (inscrever / cancelar_inscricao), catálogo inicial
  functions/      enviar-notificacao (e-mails via Gmail/SMTP), excluir-conta
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
4. **Authentication → Providers → Email**: **desligue** *Confirm email*. O cadastro não exige
   confirmação de e-mail nem aprovação (público mais idoso, app interno): a pessoa se cadastra e já entra.
   O admin pode desativar contas indevidas em *Administração → Sócios*.
5. Primeiro admin: cadastre-se pelo app e rode no SQL Editor:
   ```sql
   update profiles set role = 'admin', status = 'aprovado' where email = 'seu@email.com';
   ```

### 2. E-mails via Gmail (SMTP)

Uma conta Gmail dedicada ao app envia tanto os e-mails do Auth quanto os do app
(limite ~500/dia). Para trocar por domínio próprio no futuro (Resend etc.), basta mudar
host/usuário/senha nos dois lugares abaixo.

1. Na conta Gmail: ative a **verificação em 2 etapas** e gere uma **senha de app**
   em https://myaccount.google.com/apppasswords.
2. **SMTP do Supabase Auth** (confirmação de cadastro e recuperação de senha) —
   *Authentication → Emails → SMTP Settings*:
   - Host `smtp.gmail.com` · Port `465` · Username = Gmail · Password = senha de app
   - Sender email = Gmail · Sender name `Escalas Coroa Divina`
3. **E-mails do app** (novo cadastro → admins, aprovação → sócio, cancelamento → Orgã):
   ```bash
   npx supabase secrets set SMTP_USER=<gmail> SMTP_PASS=<senha-de-app> \
     APP_URL=https://<seu-app>.vercel.app WEBHOOK_SECRET=<uma-string-aleatoria>
   npx supabase functions deploy enviar-notificacao --no-verify-jwt
   ```
   (Edge Functions bloqueiam as portas 25/587; a função usa 465.)
4. *Database → Webhooks → Create*: tabela `notificacoes`, evento **Insert**, tipo
   *Supabase Edge Function* → `enviar-notificacao`, header `x-webhook-secret: <mesma string>`.
5. **Exclusão permanente de contas** (o sócio pede em "Meu perfil", o admin aprova em Sócios):
   ```bash
   npx supabase functions deploy excluir-conta
   ```
   (com verificação de JWT — a função confere que quem chama é admin.)
6. **Lembretes na véspera**: a migration `..._lembretes_e_exclusao.sql` agenda no **pg_cron** o job
   `lembretes-vespera` (todo dia 21:00 UTC = 18:00 de Brasília), que gera uma notificação por pessoa
   escalada no dia seguinte; o webhook acima envia o e-mail. Conferir em *Integrations → Cron*.
   Teste manual no SQL Editor: `select public.gerar_lembretes('2026-11-20');`
7. **Outros jobs (pg_cron)**: `reenviar-notificacoes` (a cada 15 min, reenvia e-mails que falharam,
   até 3 tentativas) e `limpar-notificacoes` (semanal, apaga registros com mais de 180 dias).
   No webhook de `notificacoes`, use **timeout de 5000 ms** (o padrão de 1 s pode cortar o envio).
   Para ver falhas: `select tipo, tentativas, erro, created_at from notificacoes where enviada_em is null;`

> Datas de "hoje" no banco usam o fuso de Brasília (`public.hoje_br()`), não o UTC do servidor.

### App no celular (PWA)

O app é instalável (ícone na tela inicial, abre em tela cheia). Android/Chrome mostram o convite
"Instalar"; no iPhone o app ensina o caminho Safari → Compartilhar → Adicionar à Tela de Início.
Ícones gerados a partir de `public/icon.svg` com `npm run icons`.

### 3. Templates de e-mail do Auth (português)

Em *Authentication → Emails → Templates*, cole o HTML de `supabase/templates/` e ajuste o assunto:

| Template no Supabase | Arquivo | Assunto |
|---|---|---|
| Reset password | `recuperar-senha.html` | Redefinir senha – Escalas Coroa Divina |
| Change email address | `alterar-email.html` | Confirme seu novo e-mail – Escalas Coroa Divina |

O Supabase só libera a edição dos templates depois que o SMTP próprio (passo 2) estiver ativo.

### 4. Vercel

1. Importe o repositório (framework: Vite).
2. Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `CRON_SECRET`.
3. O `vercel.json` já configura o fallback de SPA e o cron diário `/api/keepalive`.
