-- =====================================================================
-- Lembretes na véspera + pedido de exclusão de conta (aprovado pelo admin)
-- =====================================================================

alter table public.profiles
  add column receber_lembretes boolean not null default true,
  add column exclusao_solicitada_em timestamptz;

-- Novos tipos de notificação
alter table public.notificacoes drop constraint if exists notificacoes_tipo_check;
alter table public.notificacoes add constraint notificacoes_tipo_check
  check (tipo in ('novo_cadastro', 'cadastro_aprovado', 'cancelamento', 'lembrete', 'exclusao_solicitada'));

-- minha_conta passa a devolver as preferências (muda o retorno → drop + create)
drop function if exists public.minha_conta();
create function public.minha_conta()
returns table (
  id uuid, nome text, email text, telefone text,
  role public.user_role, status public.user_status, is_orga boolean,
  receber_lembretes boolean, exclusao_solicitada_em timestamptz
) language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.email, p.telefone, p.role, p.status, public.is_orga(),
         p.receber_lembretes, p.exclusao_solicitada_em
  from profiles p where p.id = auth.uid();
$$;
grant execute on function public.minha_conta() to authenticated;

-- ---------------------------------------------------------------------
-- Pedido de exclusão (o sócio pede; o admin aprova pela Edge Function excluir-conta)
-- ---------------------------------------------------------------------
create or replace function public.solicitar_exclusao()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_p profiles%rowtype;
begin
  select * into v_p from profiles where id = auth.uid();
  if not found then raise exception 'SEM_PERMISSAO' using errcode = '42501'; end if;
  if v_p.exclusao_solicitada_em is not null then return; end if;

  update profiles set exclusao_solicitada_em = now() where id = v_p.id;
  insert into notificacoes (tipo, payload) values ('exclusao_solicitada',
    jsonb_build_object('profile_id', v_p.id, 'nome', v_p.nome, 'email', v_p.email));
end $$;

create or replace function public.cancelar_solicitacao_exclusao(p_profile_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_alvo uuid := coalesce(p_profile_id, auth.uid());
begin
  -- o próprio sócio desiste, ou o admin recusa o pedido
  if v_alvo <> auth.uid() and not public.is_admin() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  update profiles set exclusao_solicitada_em = null where id = v_alvo;
end $$;

revoke execute on function public.solicitar_exclusao() from public, anon;
revoke execute on function public.cancelar_solicitacao_exclusao(uuid) from public, anon;
grant execute on function public.solicitar_exclusao() to authenticated;
grant execute on function public.cancelar_solicitacao_exclusao(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Lembretes: uma notificação por pessoa com tudo que ela faz no dia seguinte.
-- O Database Webhook de notificacoes envia o e-mail (Edge Function enviar-notificacao).
-- ---------------------------------------------------------------------
create or replace function public.gerar_lembretes(p_data date default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_data date := coalesce(p_data, (now() at time zone 'America/Sao_Paulo')::date + 1);
  v_qtd  int;
begin
  insert into notificacoes (tipo, payload)
  select 'lembrete', jsonb_build_object(
    'profile_id', p.id,
    'nome', p.nome,
    'email', p.email,
    'data', v_data,
    'itens', jsonb_agg(jsonb_build_object(
      'funcao', f.nome, 'papel', i.papel, 'area', a.nome, 'escala', e.titulo, 'escala_id', e.id
    ) order by a.ordem, f.ordem)
  )
  from inscricoes i
  join profiles p    on p.id = i.profile_id
  join dia_funcoes f on f.id = i.dia_funcao_id
  join areas a       on a.id = f.area_id
  join escala_dias d on d.id = f.dia_id
  join escalas e     on e.id = d.escala_id
  where d.data = v_data
    and f.ativa
    and e.status in ('aberta', 'fechada')
    and p.status = 'aprovado'
    and p.receber_lembretes
    and not exists (
      select 1 from notificacoes n
      where n.tipo = 'lembrete'
        and n.payload ->> 'profile_id' = p.id::text
        and n.payload ->> 'data' = v_data::text
    )
  group by p.id, p.nome, p.email;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;

revoke execute on function public.gerar_lembretes(date) from public, anon, authenticated;

-- Agenda diária às 21:00 UTC (18:00 em Brasília). Só onde o pg_cron existe (Supabase).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.unschedule(jobid) from cron.job where jobname = 'lembretes-vespera';
    perform cron.schedule('lembretes-vespera', '0 21 * * *', 'select public.gerar_lembretes()');
  end if;
end $$;
