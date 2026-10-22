-- Оформление заказа от имени вошедшего покупателя.
-- Клиенту по-прежнему нет GRANT insert на orders: пишет только эта функция.
-- Не трогает склад и не создаёт платёж.

create or replace function public.place_order(
  p_address_id uuid,
  p_customer_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_address public.addresses%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12, 2);
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_customer_comment is not null then
    p_customer_comment := nullif(btrim(p_customer_comment), '');
  end if;

  if p_customer_comment is not null and char_length(p_customer_comment) > 2000 then
    raise exception 'COMMENT_TOO_LONG';
  end if;

  select *
  into v_address
  from public.addresses
  where id = p_address_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'ADDRESS_NOT_FOUND';
  end if;

  select id
  into v_cart_id
  from public.carts
  where user_id = v_user_id
  for update;

  if v_cart_id is null then
    raise exception 'EMPTY_CART';
  end if;

  perform 1
  from public.cart_items
  where cart_id = v_cart_id
  for update;

  if not exists (
    select 1 from public.cart_items where cart_id = v_cart_id
  ) then
    raise exception 'EMPTY_CART';
  end if;

  if exists (
    select 1
    from public.cart_items as items
    left join public.products as products on products.id = items.product_id
    left join public.brands as brands on brands.id = products.brand_id
    left join public.categories as categories on categories.id = products.category_id
    where items.cart_id = v_cart_id
      and (
        products.id is null
        or products.is_active is not true
        or brands.is_published is not true
        or categories.is_published is not true
      )
  ) then
    raise exception 'UNAVAILABLE_PRODUCTS';
  end if;

  select coalesce(sum(products.price * items.quantity), 0)
  into v_subtotal
  from public.cart_items as items
  join public.products as products on products.id = items.product_id
  where items.cart_id = v_cart_id;

  v_order_id := gen_random_uuid();
  v_order_number :=
    'LDR-'
    || to_char(timezone('utc', now()), 'YYYYMMDD')
    || '-'
    || upper(substr(replace(v_order_id::text, '-', ''), 1, 6));

  insert into public.orders (
    id,
    order_number,
    customer_id,
    status,
    payment_status,
    currency,
    subtotal,
    delivery_fee,
    discount,
    total_amount,
    contact_name,
    contact_phone,
    shipping_country_code,
    shipping_region,
    shipping_city,
    shipping_postal_code,
    shipping_address_line1,
    shipping_address_line2,
    customer_comment
  )
  values (
    v_order_id,
    v_order_number,
    v_user_id,
    'new',
    'pending',
    'RUB',
    v_subtotal,
    0,
    0,
    v_subtotal,
    v_address.recipient_name,
    v_address.phone,
    v_address.country_code,
    v_address.region,
    v_address.city,
    v_address.postal_code,
    v_address.address_line1,
    v_address.address_line2,
    p_customer_comment
  );

  insert into public.order_items (
    order_id,
    product_id,
    sku_snapshot,
    name_snapshot,
    unit_price,
    quantity
  )
  select
    v_order_id,
    products.id,
    products.sku,
    products.name,
    products.price,
    items.quantity
  from public.cart_items as items
  join public.products as products on products.id = items.product_id
  where items.cart_id = v_cart_id;

  insert into public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by
  )
  values (
    v_order_id,
    null,
    'new',
    v_user_id
  );

  delete from public.cart_items
  where cart_id = v_cart_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, text) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;
