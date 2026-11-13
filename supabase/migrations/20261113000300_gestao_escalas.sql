-- =====================================================================
-- Gestão de escalas: criação, duplicação, dias e regras de vagas
-- =====================================================================

-- ---------------------------------------------------------------------
-- Período da escala = menor e maior data dos seus dias (mantido por trigger)
-- ---------------------------------------------------------------------
create or replace function public.tg_escala_dias_periodo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_escala uuid := coalesce(new.escala_id, old.escala_id);
  v_ini date;
  v_fim date;
begin
  -- Se a própria escala está sendo excluída (cascade), não há o que recalcular
  if not exists (select 1 from escalas where id = v_escala) then
    return null;
  end if;

  select min(data), max(data) into v_ini, v_fim from escala_dias where escala_id = v_escala;
  if v_ini is null then
    raise exception 'ESCALA_SEM_DIAS';
  end if;

  update escalas set data_inicio = v_ini, data_fim = v_fim
  where id = v_escala and (data_inicio, data_fim) is distinct from (v_ini, v_fim);
  return null;
end $$;

create trigger escala_dias_periodo
  after insert or delete or update of data on public.escala_dias
  for each row execute function public.tg_escala_dias_periodo();

-- ---------------------------------------------------------------------
-- Não permite reduzir vagas abaixo do número de inscritos
-- ---------------------------------------------------------------------
create or replace function public.tg_dia_funcoes_vagas()
returns trigger language plpgsql as $$
declare
  v_resp int;
  v_aux  int;
begin
  select count(*) filter (where papel = 'responsavel'),
         count(*) filter (where papel = 'auxiliar')
  into v_resp, v_aux
  from public.inscricoes where dia_funcao_id = new.id;

  if new.vagas_resp < v_resp or new.vagas_aux < v_aux then
    raise exception 'VAGAS_MENOR_QUE_INSCRITOS';
  end if;
  return new;
end $$;

create trigger dia_funcoes_vagas
  before update of vagas_resp, vagas_aux on public.dia_funcoes
  for each row execute function public.tg_dia_funcoes_vagas();

-- ---------------------------------------------------------------------
-- Helpers / RPCs (somente gestores: admin ou Orgã vigente)
-- ---------------------------------------------------------------------

-- Copia funções do catálogo para um dia
create or replace function public._popular_dia(p_dia_id uuid, p_funcao_modelo_ids uuid[])
returns void language sql security definer set search_path = public as $$
  insert into dia_funcoes (dia_id, area_id, funcao_modelo_id, nome, ordem, vagas_resp, vagas_aux)
  select p_dia_id, f.area_id, f.id, f.nome, f.ordem, f.vagas_resp_padrao, f.vagas_aux_padrao
  from funcao_modelos f
  where f.id = any(p_funcao_modelo_ids);
$$;
revoke execute on function public._popular_dia(uuid, uuid[]) from public, anon, authenticated;

create or replace function public.criar_escala(
  p_titulo text,
  p_descricao text,
  p_datas date[],
  p_funcao_modelo_ids uuid[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid;
  v_data date;
  v_dia  uuid;
begin
  if not public.is_gestor() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  if coalesce(array_length(p_datas, 1), 0) = 0 then
    raise exception 'SEM_DIAS';
  end if;
  if coalesce(trim(p_titulo), '') = '' then
    raise exception 'SEM_TITULO';
  end if;

  insert into escalas (titulo, descricao, data_inicio, data_fim, created_by)
  select trim(p_titulo), nullif(trim(p_descricao), ''), min(d), max(d), auth.uid()
  from unnest(p_datas) d
  returning id into v_id;

  for v_data in select distinct d from unnest(p_datas) d order by 1 loop
    insert into escala_dias (escala_id, data) values (v_id, v_data) returning id into v_dia;
    perform public._popular_dia(v_dia, p_funcao_modelo_ids);
  end loop;

  return v_id;
end $$;

create or replace function public.adicionar_dia(
  p_escala_id uuid,
  p_data date,
  p_funcao_modelo_ids uuid[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_dia uuid;
begin
  if not public.is_gestor() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  begin
    insert into escala_dias (escala_id, data) values (p_escala_id, p_data) returning id into v_dia;
  exception when unique_violation then
    raise exception 'DIA_JA_EXISTE';
  end;
  perform public._popular_dia(v_dia, p_funcao_modelo_ids);
  return v_dia;
end $$;

-- Duplica dias e funções (sem inscrições) deslocando as datas para o novo início
create or replace function public.duplicar_escala(
  p_origem_id uuid,
  p_titulo text,
  p_novo_inicio date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_origem escalas%rowtype;
  v_offset int;
  v_id     uuid;
begin
  if not public.is_gestor() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;

  select * into v_origem from escalas where id = p_origem_id;
  if not found then raise exception 'ESCALA_INEXISTENTE'; end if;

  v_offset := p_novo_inicio - v_origem.data_inicio;

  insert into escalas (titulo, descricao, data_inicio, data_fim, created_by)
  values (
    coalesce(nullif(trim(p_titulo), ''), v_origem.titulo || ' (cópia)'),
    v_origem.descricao,
    v_origem.data_inicio + v_offset,
    v_origem.data_fim + v_offset,
    auth.uid()
  )
  returning id into v_id;

  insert into escala_dias (escala_id, data, observacoes)
  select v_id, d.data + v_offset, d.observacoes
  from escala_dias d where d.escala_id = p_origem_id;

  insert into dia_funcoes (dia_id, area_id, funcao_modelo_id, nome, ordem, vagas_resp, vagas_aux, ativa)
  select nd.id, f.area_id, f.funcao_modelo_id, f.nome, f.ordem, f.vagas_resp, f.vagas_aux, f.ativa
  from escala_dias od
  join dia_funcoes f  on f.dia_id = od.id
  join escala_dias nd on nd.escala_id = v_id and nd.data = od.data + v_offset
  where od.escala_id = p_origem_id;

  return v_id;
end $$;

revoke execute on function public.criar_escala(text, text, date[], uuid[]) from public, anon;
revoke execute on function public.adicionar_dia(uuid, date, uuid[]) from public, anon;
revoke execute on function public.duplicar_escala(uuid, text, date) from public, anon;
grant execute on function public.criar_escala(text, text, date[], uuid[]) to authenticated;
grant execute on function public.adicionar_dia(uuid, date, uuid[]) to authenticated;
grant execute on function public.duplicar_escala(uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------
-- Resumo de ocupação por escala (lista de escalas)
-- ---------------------------------------------------------------------
create view public.v_escala_resumo as
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
where public.is_gestor() or (public.is_aprovado() and e.status in ('aberta', 'fechada'));

grant select on public.v_escala_resumo to authenticated;
