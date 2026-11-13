-- =====================================================================
-- Revisão geral: segurança, datas no fuso de Brasília, concorrência,
-- reenvio de e-mails, índices e limpeza de objetos sem uso.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) CRÍTICO — views somente leitura.
-- v_escala_resumo era "auto-updatable" (uma tabela no FROM) e rodava como o dono
-- (ignora RLS): qualquer sócio conseguia DELETE nela e apagava escalas em cascata.
-- ---------------------------------------------------------------------
revoke insert, update, delete, truncate on public.v_escala_resumo, public.v_inscricoes, public.v_orgas
  from anon, authenticated;

-- Recria com GROUP BY: deixa de ser atualizável mesmo que alguém conceda escrita no futuro
create or replace view public.v_escala_resumo as
select
  e.id as escala_id,
  (select count(*) from escala_dias d where d.escala_id = e.id)::int as dias,
  coalesce((
    select sum(f.vagas_resp + f.vagas_aux)
    from dia_funcoes f join escala_dias d on d.id = f.dia_id
    where d.escala_id = e.id and f.ativa
  ), 0)::int as vagas,
  (
    select count(*)
    from inscricoes i
    join dia_funcoes f on f.id = i.dia_funcao_id
    join escala_dias d on d.id = f.dia_id
    where d.escala_id = e.id and f.ativa
  )::int as ocupadas
from public.escalas e
where public.is_aprovado()
group by e.id;

revoke insert, update, delete, truncate on public.v_escala_resumo from anon, authenticated;
grant select on public.v_escala_resumo, public.v_inscricoes, public.v_orgas to authenticated;
revoke all on public.v_escala_resumo, public.v_inscricoes, public.v_orgas from anon;

-- ---------------------------------------------------------------------
-- 2) "Hoje" no fuso de Brasília (o servidor roda em UTC: após as 21h
-- o current_date já é amanhã e bloqueava cancelar/inscrever o próprio dia).
-- ---------------------------------------------------------------------
create or replace function public.hoje_br()
returns date language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.is_orga()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from orga_mandatos m
    join profiles p on p.id = m.profile_id
    where m.profile_id = auth.uid()
      and p.status = 'aprovado'
      and public.hoje_br() between m.inicio and m.fim
  );
$$;

-- ---------------------------------------------------------------------
-- 3) Notificações: tentativas + reenvio; anti-spam; dedup de lembrete
-- ---------------------------------------------------------------------
alter table public.notificacoes add column if not exists tentativas int not null default 0;

create index if not exists notificacoes_pendentes_idx
  on public.notificacoes (created_at) where enviada_em is null;

-- Lembrete: no máximo um por pessoa por dia (também protege contra execuções simultâneas)
create unique index if not exists notificacoes_lembrete_unico_idx
  on public.notificacoes ((payload ->> 'profile_id'), (payload ->> 'data')) where tipo = 'lembrete';

-- Anti-spam de cancelamento: índice para a checagem "já avisou há pouco?"
create index if not exists notificacoes_cancelamento_idx
  on public.notificacoes ((payload ->> 'profile_id'), created_at) where tipo = 'cancelamento';

/**
 * Reenvia notificações que falharam (ex.: Gmail recusou por excesso de conexões).
 * Truque: apaga e reinsere a linha — o INSERT dispara o Database Webhook de novo.
 * Até 3 tentativas, só das últimas 48h. Agendado a cada 15 min (abaixo).
 */
create or replace function public.reenviar_notificacoes()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_qtd int;
begin
  with falhas as (
    delete from notificacoes
    where enviada_em is null
      and tentativas < 3
      and created_at < now() - interval '10 minutes'
      and created_at > now() - interval '48 hours'
    returning tipo, payload, tentativas, created_at
  )
  insert into notificacoes (tipo, payload, tentativas, created_at)
  select tipo, payload, tentativas + 1, created_at from falhas;
  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;
revoke execute on function public.reenviar_notificacoes() from public, anon, authenticated;

-- Limpeza: notificações enviadas há mais de 180 dias
create or replace function public.limpar_notificacoes()
returns int language plpgsql security definer set search_path = public as $$
declare v_qtd int;
begin
  delete from notificacoes where created_at < now() - interval '180 days';
  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;
revoke execute on function public.limpar_notificacoes() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) inscrever / cancelar — data de Brasília, trava de linha, anti-spam
-- ---------------------------------------------------------------------
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

  -- Trava a função: inscrições concorrentes na mesma função ficam em fila
  select * into v_funcao from dia_funcoes where id = p_dia_funcao_id for update;
  if not found then raise exception 'FUNCAO_INEXISTENTE'; end if;

  select d.data, e.status into v_data, v_status
  from escala_dias d join escalas e on e.id = d.escala_id
  where d.id = v_funcao.dia_id;

  if not v_gestor then
    if v_status <> 'aberta'       then raise exception 'ESCALA_FECHADA'; end if;
    if not v_funcao.ativa         then raise exception 'FUNCAO_INATIVA'; end if;
    if v_data < public.hoje_br()  then raise exception 'DATA_PASSADA'; end if;
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

create or replace function public.cancelar_inscricao(p_inscricao_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_insc   inscricoes%rowtype;
  v_gestor boolean := public.is_gestor();
  v_info   record;
begin
  -- Trava a linha: dois cliques simultâneos não geram dois avisos
  select * into v_insc from inscricoes where id = p_inscricao_id for update;
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
    if v_info.status <> 'aberta'         then raise exception 'ESCALA_FECHADA'; end if;
    if v_info.data < public.hoje_br()    then raise exception 'DATA_PASSADA';   end if;
  end if;

  delete from inscricoes where id = p_inscricao_id;

  -- Avisa a Orgã só quando o próprio sócio sai, com limite anti-spam
  -- (no máximo 10 avisos de cancelamento por pessoa a cada 24h)
  if v_insc.profile_id = auth.uid()
     and (select count(*) from notificacoes
          where tipo = 'cancelamento'
            and payload ->> 'profile_id' = v_insc.profile_id::text
            and created_at > now() - interval '24 hours') < 10 then
    insert into notificacoes (tipo, payload) values ('cancelamento', jsonb_build_object(
      'profile_id', v_insc.profile_id,
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
-- 5) Pedido de exclusão: trava + no máximo 1 aviso aos admins a cada 24h
-- ---------------------------------------------------------------------
create or replace function public.solicitar_exclusao()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_p profiles%rowtype;
begin
  select * into v_p from profiles where id = auth.uid() for update;
  if not found then raise exception 'SEM_PERMISSAO' using errcode = '42501'; end if;
  if v_p.exclusao_solicitada_em is not null then return; end if;

  update profiles set exclusao_solicitada_em = now() where id = v_p.id;

  if not exists (
    select 1 from notificacoes
    where tipo = 'exclusao_solicitada'
      and payload ->> 'profile_id' = v_p.id::text
      and created_at > now() - interval '24 hours'
  ) then
    insert into notificacoes (tipo, payload) values ('exclusao_solicitada',
      jsonb_build_object('profile_id', v_p.id, 'nome', v_p.nome, 'email', v_p.email));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 6) Lembretes: data de Brasília, só funções ativas, sem duplicar (índice único)
-- ---------------------------------------------------------------------
create or replace function public.gerar_lembretes(p_data date default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_data date := coalesce(p_data, public.hoje_br() + 1);
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
  group by p.id, p.nome, p.email
  on conflict ((payload ->> 'profile_id'), (payload ->> 'data')) where tipo = 'lembrete' do nothing;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;
revoke execute on function public.gerar_lembretes(date) from public, anon, authenticated;

-- "Minhas escalas" coerente com a grade e os lembretes: só funções ativas
create or replace function public.minhas_inscricoes()
returns table (
  id uuid, papel public.papel_vaga, funcao text, area text, area_cor text,
  data date, escala_id uuid, escala text, escala_status public.escala_status
)
language sql stable security definer set search_path = public as $$
  select i.id, i.papel, f.nome, a.nome, a.cor, d.data, e.id, e.titulo, e.status
  from inscricoes i
  join dia_funcoes f on f.id = i.dia_funcao_id
  join areas a       on a.id = f.area_id
  join escala_dias d on d.id = f.dia_id
  join escalas e     on e.id = d.escala_id
  where i.profile_id = auth.uid()
    and e.status <> 'arquivada'
    and f.ativa
  order by d.data, a.ordem, f.ordem;
$$;

-- ---------------------------------------------------------------------
-- 7) Desativar/rejeitar libera as vagas FUTURAS da pessoa
-- (conta inativa não entra no app, então não poderia sair das funções)
-- ---------------------------------------------------------------------
create or replace function public.tg_libera_vagas_inativo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'aprovado' and new.status in ('inativo', 'rejeitado') then
    delete from inscricoes i
    using dia_funcoes f, escala_dias d
    where i.profile_id = new.id
      and f.id = i.dia_funcao_id
      and d.id = f.dia_id
      and d.data >= public.hoje_br();
  end if;
  return new;
end $$;

drop trigger if exists profiles_libera_vagas_inativo on public.profiles;
create trigger profiles_libera_vagas_inativo after update of status on public.profiles
  for each row execute function public.tg_libera_vagas_inativo();

-- ---------------------------------------------------------------------
-- 8) Último admin: trava para evitar corrida entre dois admins
-- ---------------------------------------------------------------------
create or replace function public.tg_protege_ultimo_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_perdeu_admin boolean;
begin
  if old.role <> 'admin' or old.status <> 'aprovado' then
    return coalesce(new, old);
  end if;

  v_perdeu_admin := tg_op = 'DELETE' or new.role <> 'admin' or new.status <> 'aprovado';
  if not v_perdeu_admin then
    return coalesce(new, old);
  end if;

  -- Serializa mudanças em admins dentro da transação
  perform pg_advisory_xact_lock(hashtext('escalas:admins'));

  if not exists (
    select 1 from profiles
    where role = 'admin' and status = 'aprovado' and id <> old.id
  ) then
    raise exception 'ULTIMO_ADMIN';
  end if;

  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------------
-- 9) Integridade: dia não muda de escala; cadastro com nome fora do padrão
-- ---------------------------------------------------------------------
create or replace function public.tg_escala_dias_imutavel()
returns trigger language plpgsql as $$
begin
  if new.escala_id is distinct from old.escala_id then
    raise exception 'DIA_NAO_MUDA_DE_ESCALA';
  end if;
  return new;
end $$;

drop trigger if exists escala_dias_imutavel on public.escala_dias;
create trigger escala_dias_imutavel before update of escala_id on public.escala_dias
  for each row execute function public.tg_escala_dias_imutavel();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text := left(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), 120);
begin
  if char_length(v_nome) < 2 then
    v_nome := left(split_part(new.email, '@', 1), 120);
  end if;
  if char_length(v_nome) < 2 then
    v_nome := 'Sócio';
  end if;

  insert into profiles (id, nome, email, telefone, status, aprovado_em)
  values (new.id, v_nome, new.email, coalesce(new.raw_user_meta_data ->> 'telefone', ''), 'aprovado', now());
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 10) Índices em FKs / filtros frequentes
-- ---------------------------------------------------------------------
create index if not exists orga_mandatos_profile_idx on public.orga_mandatos (profile_id);
create index if not exists dia_funcoes_area_idx      on public.dia_funcoes (area_id);
create index if not exists dia_funcoes_modelo_idx    on public.dia_funcoes (funcao_modelo_id);
create index if not exists inscricoes_created_by_idx on public.inscricoes (created_by);
create index if not exists profiles_aprovado_por_idx on public.profiles (aprovado_por);
create index if not exists funcao_modelos_area_idx   on public.funcao_modelos (area_id);

-- ---------------------------------------------------------------------
-- 11) Exclusão de perfil só pela Edge Function excluir-conta
-- (apagar só o profile deixaria um login "órfão" sem cadastro no app)
-- ---------------------------------------------------------------------
drop policy if exists profiles_delete_admin on public.profiles;

-- ---------------------------------------------------------------------
-- 12) Limpeza de objetos sem uso (cadastro não passa mais por aprovação)
-- ---------------------------------------------------------------------
drop function if exists public.tg_notifica_novo_cadastro();

-- ---------------------------------------------------------------------
-- 13) Agendamentos (só onde o pg_cron existe)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.unschedule(jobid) from cron.job where jobname in ('reenviar-notificacoes', 'limpar-notificacoes');
    perform cron.schedule('reenviar-notificacoes', '*/15 * * * *', 'select public.reenviar_notificacoes()');
    perform cron.schedule('limpar-notificacoes', '0 6 * * 0', 'select public.limpar_notificacoes()');
  end if;
end $$;
