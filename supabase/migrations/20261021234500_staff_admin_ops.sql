-- Операции сотрудника для админки: статус заказа, комментарий, остаток.
-- Клиентский GRANT на orders/inventory/order_comments не расширяем.
-- Витрина узнаёт только «в наличии / нет», без количества.

create or replace function public.list_product_stock(p_product_ids uuid[])
returns table (product_id uuid, in_stock boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    products.id,
    coalesce((inventory.quantity_on_hand - inventory.quantity_reserved) > 0, false)
  from public.products
  join public.brands on brands.id = products.brand_id
  join public.categories on categories.id = products.category_id
  left join public.inventory on inventory.product_id = products.id
  where products.id = any (coalesce(p_product_ids, '{}'::uuid[]))
    and products.is_active
    and brands.is_published
    and categories.is_published;
$$;

revoke all on function public.list_product_stock(uuid[]) from public;
grant execute on function public.list_product_stock(uuid[]) to anon, authenticated;

create or replace function public.staff_set_inventory(
  p_product_id uuid,
  p_quantity_on_hand integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reserved integer;
begin
  if not private.is_staff() then
    raise exception 'NOT_STAFF';
  end if;

  if p_quantity_on_hand is null or p_quantity_on_hand < 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  select quantity_reserved
  into v_reserved
  from public.inventory
  where product_id = p_product_id
  for update;

  if v_reserved is not null and p_quantity_on_hand < v_reserved then
    raise exception 'RESERVED_ABOVE_STOCK';
  end if;

  insert into public.inventory (product_id, quantity_on_hand, quantity_reserved)
  values (p_product_id, p_quantity_on_hand, coalesce(v_reserved, 0))
  on conflict (product_id) do update
  set quantity_on_hand = excluded.quantity_on_hand;
end;
$$;

revoke all on function public.staff_set_inventory(uuid, integer) from public, anon;
grant execute on function public.staff_set_inventory(uuid, integer) to authenticated;

create or replace function public.staff_set_order_status(
  p_order_id uuid,
  p_new_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_user_id is null or not private.is_staff() then
    raise exception 'NOT_STAFF';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = p_new_status then
    raise exception 'SAME_STATUS';
  end if;

  update public.orders
  set status = p_new_status
  where id = p_order_id;

  insert into public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by
  )
  values (
    p_order_id,
    v_order.status,
    p_new_status,
    v_user_id
  );
end;
$$;

revoke all on function public.staff_set_order_status(uuid, public.order_status)
from public, anon;
grant execute on function public.staff_set_order_status(uuid, public.order_status)
to authenticated;

create or replace function public.staff_add_order_comment(
  p_order_id uuid,
  p_body text,
  p_visibility public.order_comment_visibility
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_comment_id uuid;
begin
  if v_user_id is null or not private.is_staff() then
    raise exception 'NOT_STAFF';
  end if;

  p_body := nullif(btrim(p_body), '');

  if p_body is null then
    raise exception 'EMPTY_COMMENT';
  end if;

  if char_length(p_body) > 5000 then
    raise exception 'COMMENT_TOO_LONG';
  end if;

  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  insert into public.order_comments (
    order_id,
    author_id,
    visibility,
    body
  )
  values (
    p_order_id,
    v_user_id,
    p_visibility,
    p_body
  )
  returning id into v_comment_id;

  return v_comment_id;
end;
$$;

revoke all on function public.staff_add_order_comment(uuid, text, public.order_comment_visibility)
from public, anon;
grant execute on function public.staff_add_order_comment(uuid, text, public.order_comment_visibility)
to authenticated;

drop policy if exists "Staff can upload product image files" on storage.objects;
drop policy if exists "Staff can update product image files" on storage.objects;
drop policy if exists "Staff can delete product image files" on storage.objects;

create policy "Staff can upload product image files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select private.is_staff())
);

create policy "Staff can update product image files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_staff())
)
with check (
  bucket_id = 'product-images'
  and (select private.is_staff())
);

create policy "Staff can delete product image files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_staff())
);
