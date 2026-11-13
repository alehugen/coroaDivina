-- =====================================================================
-- Escalas | N. Coroa Divina — schema inicial
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.user_role     as enum ('admin', 'socio');
create type public.user_status   as enum ('pendente', 'aprovado', 'rejeitado', 'inativo');
create type public.escala_status as enum ('rascunho', 'aberta', 'fechada', 'arquivada');
create type public.papel_vaga    as enum ('responsavel', 'auxiliar');

-- ---------------------------------------------------------------------
-- Utilitário: updated_at
-- ---------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Perfis (sócios)
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  nome         text not null check (char_length(trim(nome)) between 2 and 120),
  email        text not null,
  telefone     text not null default '',
  role         public.user_role   not null default 'socio',
  status       public.user_status not null default 'pendente',
  aprovado_por uuid references public.profiles (id) on delete set null,
  aprovado_em  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index profiles_status_idx on public.profiles (status);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Mandatos de Orgã (cargo rotativo, definido pelo admin)
create table public.orga_mandatos (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  inicio     date not null,
  fim        date not null,
  created_at timestamptz not null default now(),
  check (fim >= inicio)
);
create index orga_mandatos_periodo_idx on public.orga_mandatos (inicio, fim);

-- ---------------------------------------------------------------------
-- Helpers de autorização (security definer para não recursar no RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_aprovado()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'aprovado');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'aprovado' and role = 'admin'
  );
$$;

create or replace function public.is_orga()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from orga_mandatos m
    join profiles p on p.id = m.profile_id
    where m.profile_id = auth.uid()
      and p.status = 'aprovado'
      and current_date between m.inicio and m.fim
  );
$$;

-- Admin ou Orgã vigente: pode gerenciar escalas
create or replace function public.is_gestor()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_orga();
$$;

-- Cria o profile a partir do signup (nome/telefone vêm do user_metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nome, email, telefone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'telefone', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que um sócio altere o próprio papel/status/email
create or replace function public.tg_profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    if new.status is distinct from old.status and new.status = 'aprovado' then
      new.aprovado_por := auth.uid();
      new.aprovado_em  := now();
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.email is distinct from old.email
     or new.aprovado_por is distinct from old.aprovado_por
     or new.aprovado_em is distinct from old.aprovado_em then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.tg_profiles_guard();

-- ---------------------------------------------------------------------
-- Catálogo: áreas e modelos de função
-- ---------------------------------------------------------------------
create table public.areas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  cor        text not null default '#80b918' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  ordem      int  not null default 0,
  created_at timestamptz not null default now()
);

create table public.funcao_modelos (
  id                uuid primary key default gen_random_uuid(),
  area_id           uuid not null references public.areas (id) on delete cascade,
  nome              text not null,
  ordem             int  not null default 0,
  vagas_resp_padrao int  not null default 1 check (vagas_resp_padrao >= 0),
  vagas_aux_padrao  int  not null default 3 check (vagas_aux_padrao >= 0),
  ativo             boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (area_id, nome)
);

-- ---------------------------------------------------------------------
-- Escalas
-- ---------------------------------------------------------------------
create table public.escalas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  data_inicio date not null,
  data_fim    date not null,
  status      public.escala_status not null default 'rascunho',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (data_fim >= data_inicio)
);
create trigger escalas_updated_at before update on public.escalas
  for each row execute function public.tg_set_updated_at();

create table public.escala_dias (
  id          uuid primary key default gen_random_uuid(),
  escala_id   uuid not null references public.escalas (id) on delete cascade,
  data        date not null,
  observacoes text,
  unique (escala_id, data)
);

create table public.dia_funcoes (
  id               uuid primary key default gen_random_uuid(),
  dia_id           uuid not null references public.escala_dias (id) on delete cascade,
  area_id          uuid not null references public.areas (id),
  funcao_modelo_id uuid references public.funcao_modelos (id) on delete set null,
  nome             text not null,
  ordem            int  not null default 0,
  vagas_resp       int  not null default 1 check (vagas_resp >= 0),
  vagas_aux        int  not null default 3 check (vagas_aux >= 0),
  ativa            boolean not null default true
);
create index dia_funcoes_dia_idx on public.dia_funcoes (dia_id);

create table public.inscricoes (
  id            uuid primary key default gen_random_uuid(),
  dia_funcao_id uuid not null references public.dia_funcoes (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  papel         public.papel_vaga not null,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (dia_funcao_id, profile_id)
);
create index inscricoes_profile_idx on public.inscricoes (profile_id);

-- ---------------------------------------------------------------------
-- Notificações (outbox) — um Database Webhook dispara a Edge Function
-- `enviar-notificacao` a cada INSERT, que envia o e-mail via Resend.
-- ---------------------------------------------------------------------
create table public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('novo_cadastro', 'cadastro_aprovado', 'cancelamento')),
  payload    jsonb not null default '{}',
  enviada_em timestamptz,
  erro       text,
  created_at timestamptz not null default now()
);

-- Avisa os admins quando alguém se cadastra
create or replace function public.tg_notifica_novo_cadastro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notificacoes (tipo, payload)
  values ('novo_cadastro', jsonb_build_object('profile_id', new.id, 'nome', new.nome, 'email', new.email));
  return new;
end $$;

create trigger profiles_notifica_cadastro after insert on public.profiles
  for each row execute function public.tg_notifica_novo_cadastro();

-- Avisa o sócio quando o cadastro é aprovado
create or replace function public.tg_notifica_aprovacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprovado' and old.status is distinct from 'aprovado' then
    insert into notificacoes (tipo, payload)
    values ('cadastro_aprovado', jsonb_build_object('profile_id', new.id, 'nome', new.nome, 'email', new.email));
  end if;
  return new;
end $$;

create trigger profiles_notifica_aprovacao after update of status on public.profiles
  for each row execute function public.tg_notifica_aprovacao();

-- ---------------------------------------------------------------------
-- Views públicas (só nomes — telefone/e-mail ficam restritos)
-- Views sem security_invoker rodam como owner, de propósito.
-- ---------------------------------------------------------------------
create view public.v_inscricoes as
select
  i.id,
  i.dia_funcao_id,
  df.dia_id,
  d.escala_id,
  i.profile_id,
  p.nome,
  i.papel,
  i.created_at
from public.inscricoes i
join public.profiles p     on p.id  = i.profile_id
join public.dia_funcoes df on df.id = i.dia_funcao_id
join public.escala_dias d  on d.id  = df.dia_id
join public.escalas e      on e.id  = d.escala_id
where public.is_gestor() or (public.is_aprovado() and e.status in ('aberta', 'fechada'));

create view public.v_orgas as
select m.id, m.profile_id, p.nome, m.inicio, m.fim
from public.orga_mandatos m
join public.profiles p on p.id = m.profile_id
where public.is_aprovado();

-- ---------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------

-- Usado pelo cron de keep-alive (não expõe dados)
create or replace function public.ping()
returns text language sql stable as $$ select 'pong'::text $$;

-- Conta do usuário logado + flags de permissão
create or replace function public.minha_conta()
returns table (
  id uuid, nome text, email text, telefone text,
  role public.user_role, status public.user_status, is_orga boolean
) language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.email, p.telefone, p.role, p.status, public.is_orga()
  from profiles p where p.id = auth.uid();
$$;

-- Inscrição com controle de vagas (à prova de concorrência via FOR UPDATE).
-- p_profile_id permite que admin/Orgã inscreva outra pessoa.
create or replace function public.inscrever(
  p_dia_funcao_id uuid,
  p_papel public.papel_vaga,
  p_profile_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_alvo    uuid := coalesce(p_profile_id, auth.uid());
  v_gestor  boolean := public.is_gestor();
  v_funcao  dia_funcoes%rowtype;
  v_data    date;
  v_status  escala_status;
  v_limite  int;
  v_ocupado int;
  v_id      uuid;
begin
  if not public.is_aprovado() then
    raise exception 'NAO_APROVADO' using errcode = '42501';
  end if;
  if v_alvo <> auth.uid() and not v_gestor then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  if not exists (select 1 from profiles where id = v_alvo and status = 'aprovado') then
    raise exception 'SOCIO_INVALIDO';
  end if;

  select * into v_funcao from dia_funcoes where id = p_dia_funcao_id for update;
  if not found then raise exception 'FUNCAO_INEXISTENTE'; end if;

  select d.data, e.status into v_data, v_status
  from escala_dias d join escalas e on e.id = d.escala_id
  where d.id = v_funcao.dia_id;

  if not v_gestor then
    if v_status <> 'aberta'  then raise exception 'ESCALA_FECHADA'; end if;
    if not v_funcao.ativa    then raise exception 'FUNCAO_INATIVA'; end if;
    if v_data < current_date then raise exception 'DATA_PASSADA'; end if;
  end if;

  v_limite := case p_papel when 'responsavel' then v_funcao.vagas_resp else v_funcao.vagas_aux end;
  select count(*) into v_ocupado
  from inscricoes where dia_funcao_id = p_dia_funcao_id and papel = p_papel;

  if v_ocupado >= v_limite then
    raise exception 'SEM_VAGA';
  end if;

  begin
    insert into inscricoes (dia_funcao_id, profile_id, papel, created_by)
    values (p_dia_funcao_id, v_alvo, p_papel, auth.uid())
    returning id into v_id;
  exception when unique_violation then
    raise exception 'JA_INSCRITO';
  end;

  return v_id;
end $$;

-- Cancelamento. Quando o próprio sócio cancela, a Orgã é avisada por e-mail.
create or replace function public.cancelar_inscricao(p_inscricao_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_insc   inscricoes%rowtype;
  v_gestor boolean := public.is_gestor();
  v_info   record;
begin
  select * into v_insc from inscricoes where id = p_inscricao_id;
  if not found then raise exception 'INSCRICAO_INEXISTENTE'; end if;

  if v_insc.profile_id <> auth.uid() and not v_gestor then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;

  select p.nome as socio, df.nome as funcao, d.data, e.id as escala_id, e.titulo, e.status
  into v_info
  from dia_funcoes df
  join escala_dias d on d.id = df.dia_id
  join escalas e     on e.id = d.escala_id
  join profiles p    on p.id = v_insc.profile_id
  where df.id = v_insc.dia_funcao_id;

  if not v_gestor then
    if v_info.status <> 'aberta'   then raise exception 'ESCALA_FECHADA'; end if;
    if v_info.data < current_date  then raise exception 'DATA_PASSADA';   end if;
  end if;

  delete from inscricoes where id = p_inscricao_id;

  if v_insc.profile_id = auth.uid() then
    insert into notificacoes (tipo, payload) values ('cancelamento', jsonb_build_object(
      'socio', v_info.socio,
      'funcao', v_info.funcao,
      'papel', v_insc.papel,
      'data', v_info.data,
      'escala_id', v_info.escala_id,
      'escala', v_info.titulo
    ));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.orga_mandatos  enable row level security;
alter table public.areas          enable row level security;
alter table public.funcao_modelos enable row level security;
alter table public.escalas        enable row level security;
alter table public.escala_dias    enable row level security;
alter table public.dia_funcoes    enable row level security;
alter table public.inscricoes     enable row level security;
alter table public.notificacoes   enable row level security; -- sem policies: só service_role

-- profiles: cada um vê o seu; gestores veem todos; admin altera/remove
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_gestor());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using (public.is_admin());

-- mandatos: leitura por aprovados (via v_orgas), escrita só admin
create policy mandatos_select on public.orga_mandatos for select to authenticated
  using (public.is_aprovado());
create policy mandatos_write on public.orga_mandatos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- catálogo
create policy areas_select on public.areas for select to authenticated using (public.is_aprovado());
create policy areas_write  on public.areas for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());
create policy funcoes_select on public.funcao_modelos for select to authenticated using (public.is_aprovado());
create policy funcoes_write  on public.funcao_modelos for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());

-- escalas: sócio vê abertas/fechadas; gestor vê e edita tudo
create policy escalas_select on public.escalas for select to authenticated
  using (public.is_gestor() or (public.is_aprovado() and status in ('aberta', 'fechada')));
create policy escalas_write on public.escalas for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());

create policy dias_select on public.escala_dias for select to authenticated
  using (exists (select 1 from public.escalas e where e.id = escala_id));
create policy dias_write on public.escala_dias for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());

create policy dia_funcoes_select on public.dia_funcoes for select to authenticated
  using (exists (select 1 from public.escala_dias d where d.id = dia_id));
create policy dia_funcoes_write on public.dia_funcoes for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());

-- inscrições: leitura por aprovados (necessário p/ Realtime);
-- escrita apenas pelas RPCs inscrever/cancelar_inscricao
create policy inscricoes_select on public.inscricoes for select to authenticated
  using (public.is_aprovado());

-- ---------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------
revoke all on public.notificacoes from anon, authenticated;
grant select on public.v_inscricoes, public.v_orgas to authenticated;
revoke execute on function public.inscrever(uuid, public.papel_vaga, uuid) from anon, public;
revoke execute on function public.cancelar_inscricao(uuid) from anon, public;
grant execute on function public.inscrever(uuid, public.papel_vaga, uuid) to authenticated;
grant execute on function public.cancelar_inscricao(uuid) to authenticated;
grant execute on function public.ping() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Realtime: grade atualiza ao vivo quando alguém se inscreve/cancela
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.inscricoes;
