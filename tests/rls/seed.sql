-- Фикстуры функциональных RLS-тестов. Метки и UUID совпадают с tests/rls/helpers.ts.
-- Не создаёт auth.users и не содержит паролей.
-- Каталог можно вставить без пользователей.
-- Корзины, адреса, роли сотрудников и заказы вставляются, только если
-- в auth.users уже есть четыре учётки с указанными UUID.
-- Этот файл сейчас не выполнять.

insert into public.brands (id, name, slug, is_published)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'rls-test-brand-pub',
    'rls-test-brand-pub',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'rls-test-brand-hid',
    'rls-test-brand-hid',
    false
  )
on conflict (id) do nothing;

insert into public.categories (
  id, parent_id, name, slug, description, sort_order, is_published
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    null,
    'rls-test-cat-pub',
    'rls-test-cat-pub',
    'rls-test published category',
    1,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    null,
    'rls-test-cat-hid',
    'rls-test-cat-hid',
    'rls-test hidden category',
    2,
    false
  )
on conflict (id) do nothing;

insert into public.products (
  id, sku, article, slug, name, description, brand_id, category_id, price, is_active
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'RLS-TEST-SKU-PUB',
    'RLS-TEST-ART-PUB',
    'rls-test-product-pub',
    'rls-test-product-pub',
    'rls-test public product',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    100.00,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'RLS-TEST-SKU-OFF',
    'RLS-TEST-ART-OFF',
    'rls-test-product-off',
    'rls-test-product-off',
    'rls-test inactive product',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    110.00,
    false
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'RLS-TEST-SKU-BRAND-HID',
    'RLS-TEST-ART-BRAND-HID',
    'rls-test-product-brand-hid',
    'rls-test-product-brand-hid',
    'rls-test active product hidden brand',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    120.00,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    'RLS-TEST-SKU-CAT-HID',
    'RLS-TEST-ART-CAT-HID',
    'rls-test-product-cat-hid',
    'rls-test-product-cat-hid',
    'rls-test active product hidden category',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    130.00,
    true
  )
on conflict (id) do nothing;

insert into public.product_images (
  id, product_id, storage_path, alt_text, sort_order
)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'rls-test/products/pub.webp',
    'rls-test-image-pub',
    0
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'rls-test/products/off.webp',
    'rls-test-image-off',
    0
  )
on conflict (id) do nothing;

insert into public.vehicles (
  id, make, model, generation, year_from, year_to, engine
)
values (
  '40000000-0000-4000-8000-000000000001',
  'rls-test-make',
  'rls-test-model',
  'rls-test-gen',
  2018,
  2024,
  'rls-test-engine'
)
on conflict (id) do nothing;

insert into public.product_compatibility (id, product_id, vehicle_id)
values
  (
    '41000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

insert into public.product_cross_references (id, product_id, brand_id, article)
values
  (
    '42000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'RLS-TEST-XREF-PUB'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'RLS-TEST-XREF-OFF'
  )
on conflict (id) do nothing;

insert into public.inventory (product_id, quantity_on_hand, quantity_reserved)
values (
  '30000000-0000-4000-8000-000000000001',
  10,
  1
)
on conflict (product_id) do nothing;

update public.profiles
set role = 'operator'
where id = '33333333-3333-4333-8333-333333333333'
  and exists (
    select 1
    from auth.users
    where id = '33333333-3333-4333-8333-333333333333'
  );

update public.profiles
set role = 'admin'
where id = '44444444-4444-4444-8444-444444444444'
  and exists (
    select 1
    from auth.users
    where id = '44444444-4444-4444-8444-444444444444'
  );

insert into public.carts (id, user_id)
select
  '50000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111'
where exists (
  select 1 from auth.users where id = '11111111-1111-4111-8111-111111111111'
)
on conflict (id) do nothing;

insert into public.carts (id, user_id)
select
  '50000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222'
where exists (
  select 1 from auth.users where id = '22222222-2222-4222-8222-222222222222'
)
on conflict (id) do nothing;

insert into public.cart_items (id, cart_id, product_id, quantity)
select
  '51000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  2
where exists (
  select 1 from public.carts where id = '50000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.cart_items (id, cart_id, product_id, quantity)
select
  '51000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000001',
  3
where exists (
  select 1 from public.carts where id = '50000000-0000-4000-8000-000000000002'
)
on conflict (id) do nothing;

insert into public.addresses (
  id,
  user_id,
  recipient_name,
  phone,
  country_code,
  region,
  city,
  postal_code,
  address_line1,
  address_line2,
  delivery_instructions
)
select
  '60000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'rls-test-recipient-a',
  '+79990000001',
  'RU',
  'rls-test-region-a',
  'rls-test-city-a',
  '101000',
  'rls-test-address-a-1',
  null,
  'rls-test-delivery-a'
where exists (
  select 1 from auth.users where id = '11111111-1111-4111-8111-111111111111'
)
on conflict (id) do nothing;

insert into public.addresses (
  id,
  user_id,
  recipient_name,
  phone,
  country_code,
  region,
  city,
  postal_code,
  address_line1,
  address_line2,
  delivery_instructions
)
select
  '60000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222',
  'rls-test-recipient-b',
  '+79990000002',
  'RU',
  'rls-test-region-b',
  'rls-test-city-b',
  '102000',
  'rls-test-address-b-1',
  null,
  'rls-test-delivery-b'
where exists (
  select 1 from auth.users where id = '22222222-2222-4222-8222-222222222222'
)
on conflict (id) do nothing;

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
select
  '70000000-0000-4000-8000-000000000001',
  'RLS-TEST-ORD-A',
  '11111111-1111-4111-8111-111111111111',
  'new',
  'pending',
  'RUB',
  200.00,
  50.00,
  0.00,
  250.00,
  'rls-test-contact-a',
  '+79990000001',
  'RU',
  'rls-test-region-a',
  'rls-test-city-a',
  '101000',
  'rls-test-address-a-1',
  null,
  'rls-test-order-comment-a'
where exists (
  select 1 from auth.users where id = '11111111-1111-4111-8111-111111111111'
)
on conflict (id) do nothing;

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
select
  '70000000-0000-4000-8000-000000000002',
  'RLS-TEST-ORD-B',
  '22222222-2222-4222-8222-222222222222',
  'confirmed',
  'pending',
  'RUB',
  300.00,
  0.00,
  0.00,
  300.00,
  'rls-test-contact-b',
  '+79990000002',
  'RU',
  'rls-test-region-b',
  'rls-test-city-b',
  '102000',
  'rls-test-address-b-1',
  null,
  'rls-test-order-comment-b'
where exists (
  select 1 from auth.users where id = '22222222-2222-4222-8222-222222222222'
)
on conflict (id) do nothing;

insert into public.order_items (
  id, order_id, product_id, sku_snapshot, name_snapshot, unit_price, quantity
)
select
  '71000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'RLS-TEST-SKU-PUB',
  'rls-test-product-pub',
  100.00,
  2
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.order_items (
  id, order_id, product_id, sku_snapshot, name_snapshot, unit_price, quantity
)
select
  '71000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000001',
  'RLS-TEST-SKU-PUB',
  'rls-test-product-pub',
  100.00,
  3
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000002'
)
on conflict (id) do nothing;

insert into public.order_status_history (
  id, order_id, previous_status, new_status, changed_by
)
select
  '72000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  null,
  'new',
  '11111111-1111-4111-8111-111111111111'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000001'
)
  and exists (
    select 1 from public.profiles where id = '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do nothing;

insert into public.order_status_history (
  id, order_id, previous_status, new_status, changed_by
)
select
  '72000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000002',
  'new',
  'confirmed',
  '33333333-3333-4333-8333-333333333333'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000002'
)
  and exists (
    select 1 from public.profiles where id = '33333333-3333-4333-8333-333333333333'
  )
on conflict (id) do nothing;

insert into public.order_comments (
  id, order_id, author_id, visibility, body
)
select
  '73000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'customer',
  'rls-test-comment-a-customer'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000001'
)
  and exists (
    select 1 from public.profiles where id = '33333333-3333-4333-8333-333333333333'
  )
on conflict (id) do nothing;

insert into public.order_comments (
  id, order_id, author_id, visibility, body
)
select
  '73000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'internal',
  'rls-test-comment-a-internal'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000001'
)
  and exists (
    select 1 from public.profiles where id = '33333333-3333-4333-8333-333333333333'
  )
on conflict (id) do nothing;

insert into public.order_comments (
  id, order_id, author_id, visibility, body
)
select
  '73000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'customer',
  'rls-test-comment-b-customer'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000002'
)
  and exists (
    select 1 from public.profiles where id = '33333333-3333-4333-8333-333333333333'
  )
on conflict (id) do nothing;

insert into public.payments (
  id, order_id, provider, provider_payment_id, status, amount, currency
)
select
  '74000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  'rls-test-provider',
  'rls-test-pay-a',
  'pending',
  250.00,
  'RUB'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.payments (
  id, order_id, provider, provider_payment_id, status, amount, currency
)
select
  '74000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000002',
  'rls-test-provider',
  'rls-test-pay-b',
  'pending',
  300.00,
  'RUB'
where exists (
  select 1 from public.orders where id = '70000000-0000-4000-8000-000000000002'
)
on conflict (id) do nothing;
