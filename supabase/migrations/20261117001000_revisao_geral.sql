-- =====================================================================
-- Revisão geral: integridade de profiles, e-mail sincronizado com o Auth,
-- limpeza de dados pessoais, fluxo de aprovação removido.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Pedido de exclusão só pelas RPCs (antes o sócio podia gravar a data
--    direto e o aviso aos admins nunca saía). created_at é imutável.
--    As RPCs marcam a transação com escalas.rpc = 'on'.
-- ---------------------------------------------------------------------
create or replace function public.tg_profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_at is distinct from old.created_at then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;

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

  if new.exclusao_solicitada_em is distinct from old.exclusao_solicitada_em
     and coalesce(current_setting('escalas.rpc', true), '') <> 'on' then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function public.solicitar_exclusao()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_p profiles%rowtype;
begin
  select * into v_p from profiles where id = auth.uid() for update;
  if not found then raise exception 'SEM_PERMISSAO' using errcode = '42501'; end if;
  if v_p.exclusao_solicitada_em is not null then return; end if;

  perform set_config('escalas.rpc', 'on', true);
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

create or replace function public.cancelar_solicitacao_exclusao(p_profile_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_alvo uuid := coalesce(p_profile_id, auth.uid());
begin
  -- o próprio sócio desiste, ou o admin recusa o pedido
  if v_alvo <> auth.uid() and not public.is_admin() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  perform set_config('escalas.rpc', 'on', true);
  update profiles set exclusao_solicitada_em = null where id = v_alvo;
end $$;

-- ---------------------------------------------------------------------
-- 2) E-mail do profile acompanha o Auth (troca de e-mail pelo link de confirmação)
-- ---------------------------------------------------------------------
create or replace function public.sync_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_email on auth.users;
create trigger on_auth_user_email after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_email();

-- ---------------------------------------------------------------------
-- 3) "is_orga" da conta = Orgã que de fato gerencia (CDC/QM)
-- ---------------------------------------------------------------------
create or replace function public.minha_conta()
returns table (
  id uuid, nome text, email text, telefone text,
  role public.user_role, status public.user_status, is_orga boolean,
  receber_lembretes boolean, exclusao_solicitada_em timestamptz,
  grau public.grau
) language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.email, p.telefone, p.role, p.status,
         public.is_orga() and p.grau in ('CDC', 'QM'),
         p.receber_lembretes, p.exclusao_solicitada_em, p.grau
  from profiles p where p.id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 4) inscrever: trava o perfil do alvo (desativação simultânea não deixa vaga presa)
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
  perform 1 from profiles where id = v_alvo and status = 'aprovado' for share;
  if not found then
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

-- ---------------------------------------------------------------------
-- 5) Conta excluída: apaga também os e-mails pendentes/enviados com dados dela (LGPD)
-- ---------------------------------------------------------------------
create or replace function public.tg_limpa_notif_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from notificacoes where payload ->> 'profile_id' = old.id::text;
  return old;
end $$;

drop trigger if exists profiles_limpa_notif on public.profiles;
create trigger profiles_limpa_notif after delete on public.profiles
  for each row execute function public.tg_limpa_notif_perfil();

-- ---------------------------------------------------------------------
-- 6) Fluxo de aprovação removido: só existem contas ativas e inativas.
--    (o enum mantém os valores antigos; a constraint impede usá-los)
-- ---------------------------------------------------------------------
update public.profiles set status = 'inativo' where status in ('pendente', 'rejeitado');
alter table public.profiles drop constraint if exists profiles_status_vivo;
alter table public.profiles add constraint profiles_status_vivo check (status in ('aprovado', 'inativo'));

delete from public.notificacoes where tipo = 'novo_cadastro';
alter table public.notificacoes drop constraint if exists notificacoes_tipo_check;
alter table public.notificacoes add constraint notificacoes_tipo_check
  check (tipo in ('cadastro_aprovado', 'cancelamento', 'lembrete', 'exclusao_solicitada'));

-- ---------------------------------------------------------------------
-- 7) Pequenas garantias
-- ---------------------------------------------------------------------
-- autor do evento é sempre quem criou (não dá para forjar nem trocar depois)
create or replace function public.tg_evento_autor()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    new.criado_por := old.criado_por;
  elsif auth.uid() is not null then
    new.criado_por := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists eventos_autor on public.eventos;
create trigger eventos_autor before insert or update on public.eventos
  for each row execute function public.tg_evento_autor();

-- telefone com tamanho razoável (vem do metadata do cadastro ou do perfil)
update public.profiles set telefone = left(telefone, 30) where char_length(telefone) > 30;
alter table public.profiles drop constraint if exists profiles_telefone_tamanho;
alter table public.profiles add constraint profiles_telefone_tamanho check (char_length(telefone) <= 30);
