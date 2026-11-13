-- Toda escala é visível para todos os sócios ativos, em qualquer status.
-- O que muda por perfil são as AÇÕES (garantidas pelas policies de escrita e pelas RPCs):
--   * inscrever/cancelar: só com status 'aberta' (exceto admin/Orgã) — RPCs inscrever/cancelar_inscricao
--   * criar/editar/abrir/fechar/excluir: só admin/Orgã — policies *_write

drop policy if exists escalas_select on public.escalas;
create policy escalas_select on public.escalas for select to authenticated
  using (public.is_aprovado());

create or replace view public.v_inscricoes as
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
where public.is_aprovado();

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
where public.is_aprovado();
