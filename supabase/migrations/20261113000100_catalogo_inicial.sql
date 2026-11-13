-- Catálogo inicial, extraído da planilha "Escala do Preparo - Nov 2026".
-- Vagas: 1 responsável + (total - 1) auxiliares. Ajustável pelo painel.

insert into public.areas (nome, cor, ordem) values
  ('Cozinha & Alimentos',   '#80b918', 1),
  ('Banheiros & Zeladoria', '#dddf00', 2);

with a as (select id, nome from public.areas)
insert into public.funcao_modelos (area_id, nome, ordem, vagas_resp_padrao, vagas_aux_padrao)
select a.id, f.nome, f.ordem, f.resp, f.aux
from (values
  ('Cozinha & Alimentos', 'Café da Manhã',               1, 1, 3),
  ('Cozinha & Alimentos', 'Almoço',                      2, 1, 5),
  ('Cozinha & Alimentos', 'Limpeza Almoço',              3, 1, 3),
  ('Cozinha & Alimentos', 'Lanche da Tarde',             4, 1, 3),
  ('Cozinha & Alimentos', 'Jantar',                      5, 1, 4),
  ('Cozinha & Alimentos', 'Limpeza do Jantar',           6, 1, 2),
  ('Cozinha & Alimentos', 'Tira-Gosto',                  7, 1, 0),
  ('Cozinha & Alimentos', 'Lanche Pós-Sessão',           8, 1, 6),
  ('Cozinha & Alimentos', 'Limpeza Lanche Pós-Sessão',   9, 1, 5),
  ('Cozinha & Alimentos', 'Lanche Fornalha (manhã)',    10, 1, 1),
  ('Cozinha & Alimentos', 'Lanche Fornalha (tarde)',    11, 1, 1),
  ('Cozinha & Alimentos', 'Lanche Fornalha (noite)',    12, 1, 1),
  ('Cozinha & Alimentos', 'Lanche Fornalha (madrugada)',13, 1, 1),
  ('Banheiros & Zeladoria', 'Banheiro Feminino & Criançário', 1, 1, 3),
  ('Banheiros & Zeladoria', 'Banheiro Masculino & PMR',       2, 1, 3),
  ('Banheiros & Zeladoria', 'Templo & Dependências',          3, 1, 3)
) as f(area, nome, ordem, resp, aux)
join a on a.nome = f.area;
