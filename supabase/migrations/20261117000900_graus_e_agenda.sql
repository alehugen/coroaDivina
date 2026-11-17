-- =====================================================================
-- Graus (QS, CI, CDC, QM) + Agenda do núcleo
--
-- Permissões:
--   • Escalas  → admin, ou Orgã vigente com grau CDC ou QM
--   • Agenda   → admin ou QM
--   • Grau     → admin ou QM (QM não altera o próprio)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Grau do sócio (todo cadastro novo entra como QS)
-- ---------------------------------------------------------------------
create type public.grau as enum ('QS', 'CI', 'CDC', 'QM');

alter table public.profiles add column grau public.grau not null default 'QS';

create or replace function public.is_qm()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'aprovado' and grau = 'QM');
$$;

-- Orgã só gerencia escalas se for CDC ou QM (o grau pode ter sido rebaixado durante o mandato)
create or replace function public.is_gestor()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or (public.is_orga()
          and exists (select 1 from profiles where id = auth.uid() and grau in ('CDC', 'QM')));
$$;

create or replace function public.pode_editar_agenda()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_qm();
$$;

-- QM precisa ver todos os sócios para definir o grau
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_gestor() or public.is_qm());

-- Guard: além de papel/status/e-mail, o grau só muda por admin ou por QM (em outra pessoa)
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

  if new.grau is distinct from old.grau and not (public.is_qm() and new.id <> auth.uid()) then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  return new;
end $$;

-- Definir grau (admin ou QM). QM tem só leitura em profiles; a escrita passa por aqui.
create or replace function public.definir_grau(p_profile_id uuid, p_grau public.grau)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_qm()) then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  if p_profile_id = auth.uid() and not public.is_admin() then
    raise exception 'GRAU_PROPRIO' using errcode = '42501';
  end if;
  update profiles set grau = p_grau where id = p_profile_id;
  if not found then
    raise exception 'SOCIO_INVALIDO';
  end if;
end $$;

revoke execute on function public.definir_grau(uuid, public.grau) from anon, public;
grant execute on function public.definir_grau(uuid, public.grau) to authenticated;
grant execute on function public.is_qm(), public.pode_editar_agenda() to authenticated;

-- Mandato de Orgã só para CDC ou QM
create or replace function public.tg_mandato_grau()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = new.profile_id and grau in ('CDC', 'QM')) then
    raise exception 'ORGA_SEM_GRAU';
  end if;
  return new;
end $$;

create trigger orga_mandatos_grau before insert or update of profile_id on public.orga_mandatos
  for each row execute function public.tg_mandato_grau();

-- minha_conta passa a devolver o grau (muda o retorno → drop + create)
drop function if exists public.minha_conta();
create function public.minha_conta()
returns table (
  id uuid, nome text, email text, telefone text,
  role public.user_role, status public.user_status, is_orga boolean,
  receber_lembretes boolean, exclusao_solicitada_em timestamptz,
  grau public.grau
) language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.email, p.telefone, p.role, p.status, public.is_orga(),
         p.receber_lembretes, p.exclusao_solicitada_em, p.grau
  from profiles p where p.id = auth.uid();
$$;
revoke execute on function public.minha_conta() from anon, public;
grant execute on function public.minha_conta() to authenticated;

-- ---------------------------------------------------------------------
-- 2) Agenda do núcleo
-- ---------------------------------------------------------------------
create table public.eventos (
  id         uuid primary key default gen_random_uuid(),
  data       date not null,
  hora       time,
  titulo     text not null check (char_length(trim(titulo)) between 2 and 160),
  detalhe    text not null default '' check (char_length(detalhe) <= 500),
  -- destaque da linha, como na tabela de hoje (amarelo = sessão/atividade; verde = livre)
  cor        text not null default 'nenhuma' check (cor in ('nenhuma', 'amarela', 'verde')),
  criado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index eventos_data_idx on public.eventos (data);
create index eventos_criado_por_idx on public.eventos (criado_por);
create trigger eventos_updated_at before update on public.eventos
  for each row execute function public.tg_set_updated_at();

alter table public.eventos enable row level security;

create policy eventos_select on public.eventos for select to authenticated
  using (public.is_aprovado());
create policy eventos_insert on public.eventos for insert to authenticated
  with check (public.pode_editar_agenda());
create policy eventos_update on public.eventos for update to authenticated
  using (public.pode_editar_agenda()) with check (public.pode_editar_agenda());
create policy eventos_delete on public.eventos for delete to authenticated
  using (public.pode_editar_agenda());

revoke all on public.eventos from anon;
grant select, insert, update, delete on public.eventos to authenticated;
