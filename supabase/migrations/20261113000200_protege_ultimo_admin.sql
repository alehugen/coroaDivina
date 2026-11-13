-- Impede que o último admin aprovado perca o acesso (por rebaixamento,
-- desativação ou remoção), o que deixaria o app sem ninguém para administrar.

create or replace function public.tg_protege_ultimo_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_perdeu_admin boolean;
begin
  if old.role <> 'admin' or old.status <> 'aprovado' then
    return coalesce(new, old);
  end if;

  v_perdeu_admin := tg_op = 'DELETE' or new.role <> 'admin' or new.status <> 'aprovado';

  if v_perdeu_admin and not exists (
    select 1 from profiles
    where role = 'admin' and status = 'aprovado' and id <> old.id
  ) then
    raise exception 'ULTIMO_ADMIN';
  end if;

  return coalesce(new, old);
end $$;

create trigger profiles_protege_ultimo_admin
  before update of role, status or delete on public.profiles
  for each row execute function public.tg_protege_ultimo_admin();
