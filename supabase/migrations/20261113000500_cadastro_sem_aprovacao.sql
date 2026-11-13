-- Cadastro sem aprovação: quem se cadastra já entra aprovado.
-- (App interno, público mais idoso: menos passos.) O admin continua podendo
-- desativar alguém pelo painel de Sócios.

alter table public.profiles alter column status set default 'aprovado';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nome, email, telefone, status, aprovado_em)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'telefone', ''),
    'aprovado',
    now()
  );
  return new;
end $$;

-- Sem aprovação, não há por que avisar os admins a cada cadastro
drop trigger if exists profiles_notifica_cadastro on public.profiles;

-- Libera quem ficou pendente (recebem o e-mail de boas-vindas)
update public.profiles
set status = 'aprovado'
where status = 'pendente';
