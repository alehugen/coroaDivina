-- Inscrições do usuário logado, com os dados de função/dia/escala (tela "Minhas escalas")
create or replace function public.minhas_inscricoes()
returns table (
  id uuid,
  papel public.papel_vaga,
  funcao text,
  area text,
  area_cor text,
  data date,
  escala_id uuid,
  escala text,
  escala_status public.escala_status
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
  order by d.data, a.ordem, f.ordem;
$$;

revoke execute on function public.minhas_inscricoes() from public, anon;
grant execute on function public.minhas_inscricoes() to authenticated;
