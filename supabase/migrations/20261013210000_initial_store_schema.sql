create schema if not exists private;

create type public.app_role as enum ('customer', 'operator', 'admin');
create type public.order_status as enum (
  'new',
  'confirmed',
  'assembling',
  'packed',
  'shipped',
  'completed',
  'cancelled'
);
create type public.payment_status as enum (
  'pending',
  'authorized',
  'paid',
  'failed',
  'partially_refunded',
  'refunded',
  'cancelled'
);
create type public.order_comment_visibility as enum ('internal', 'customer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (
    display_name is null or char_length(display_name) between 1 and 120
  ),
  phone text check (phone is null or char_length(phone) <= 32),
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_not_own_parent check (parent_id is distinct from id)
);

create index categories_parent_id_idx on public.categories (parent_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (char_length(btrim(sku)) between 1 and 80),
  article text not null check (char_length(btrim(article)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 240),
  description text,
  brand_id uuid not null references public.brands (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  price numeric(12, 2) not null check (price >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_brand_article_unique unique (brand_id, article)
);

create index products_brand_id_idx on public.products (brand_id);
create index products_category_id_idx on public.products (category_id);
create index products_active_created_at_idx
  on public.products (created_at desc)
  where is_active;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (char_length(btrim(storage_path)) between 1 and 1024),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_product_storage_path_unique
    unique (product_id, storage_path)
);

create index product_images_product_sort_idx
  on public.product_images (product_id, sort_order, id);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null check (char_length(btrim(make)) between 1 and 120),
  model text not null check (char_length(btrim(model)) between 1 and 120),
  generation text check (generation is null or char_length(generation) <= 120),
  year_from smallint check (year_from is null or year_from between 1886 and 2200),
  year_to smallint check (year_to is null or year_to between 1886 and 2200),
  engine text check (engine is null or char_length(engine) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_year_range_check
    check (year_from is null or year_to is null or year_from <= year_to),
  constraint vehicles_identity_unique
    unique nulls not distinct (make, model, generation, year_from, year_to, engine)
);

create index vehicles_make_model_idx on public.vehicles (make, model);

create table public.product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint product_compatibility_product_vehicle_unique
    unique (product_id, vehicle_id)
);

create index product_compatibility_vehicle_id_idx
  on public.product_compatibility (vehicle_id);

create table public.product_cross_references (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete restrict,
  article text not null check (char_length(btrim(article)) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint product_cross_references_brand_article_unique
    unique (brand_id, article)
);

create index product_cross_references_product_id_idx
  on public.product_cross_references (product_id);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_cart_product_unique unique (cart_id, product_id)
);

create index cart_items_product_id_idx on public.cart_items (product_id);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipient_name text not null check (
    char_length(btrim(recipient_name)) between 1 and 160
  ),
  phone text not null check (char_length(btrim(phone)) between 1 and 32),
  country_code text not null default 'RU'
    check (country_code ~ '^[A-Z]{2}$'),
  region text check (region is null or char_length(region) <= 160),
  city text not null check (char_length(btrim(city)) between 1 and 160),
  postal_code text check (postal_code is null or char_length(postal_code) <= 32),
  address_line1 text not null check (
    char_length(btrim(address_line1)) between 1 and 240
  ),
  address_line2 text check (address_line2 is null or char_length(address_line2) <= 240),
  delivery_instructions text check (
    delivery_instructions is null or char_length(delivery_instructions) <= 1000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_created_at_idx
  on public.addresses (user_id, created_at desc);

create table public.inventory (
  product_id uuid primary key references public.products (id) on delete restrict,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (
    quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand
  ),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    check (char_length(btrim(order_number)) between 1 and 40),
  customer_id uuid references auth.users (id) on delete set null,
  status public.order_status not null default 'new',
  payment_status public.payment_status not null default 'pending',
  currency text not null default 'RUB' check (currency ~ '^[A-Z]{3}$'),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total_amount numeric(12, 2) not null check (
    total_amount >= 0 and total_amount = subtotal + delivery_fee - discount
  ),
  contact_name text not null check (char_length(btrim(contact_name)) between 1 and 160),
  contact_phone text not null check (char_length(btrim(contact_phone)) between 1 and 32),
  shipping_country_code text not null default 'RU'
    check (shipping_country_code ~ '^[A-Z]{2}$'),
  shipping_region text,
  shipping_city text not null check (char_length(btrim(shipping_city)) between 1 and 160),
  shipping_postal_code text,
  shipping_address_line1 text not null check (
    char_length(btrim(shipping_address_line1)) between 1 and 240
  ),
  shipping_address_line2 text,
  customer_comment text check (
    customer_comment is null or char_length(customer_comment) <= 2000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_discount_not_above_subtotal
    check (discount <= subtotal + delivery_fee)
);

create index orders_customer_created_at_idx
  on public.orders (customer_id, created_at desc);
create index orders_status_created_at_idx
  on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  product_id uuid references public.products (id) on delete set null,
  sku_snapshot text not null check (char_length(sku_snapshot) between 1 and 80),
  name_snapshot text not null check (char_length(name_snapshot) between 1 and 240),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 100000),
  line_total numeric(17, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  previous_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint order_status_history_transition_check
    check (previous_status is distinct from new_status)
);

create index order_status_history_order_created_idx
  on public.order_status_history (order_id, created_at desc);

create table public.order_comments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  author_id uuid references public.profiles (id) on delete set null,
  visibility public.order_comment_visibility not null,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index order_comments_order_created_idx
  on public.order_comments (order_id, created_at);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  provider text not null check (char_length(btrim(provider)) between 1 and 80),
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'RUB' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_payment_id_unique
    unique (provider, provider_payment_id)
);

create index payments_order_created_idx
  on public.payments (order_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger brands_set_updated_at
before update on public.brands
for each row execute function private.set_updated_at();
create trigger categories_set_updated_at
before update on public.categories
for each row execute function private.set_updated_at();
create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function private.set_updated_at();
create trigger carts_set_updated_at
before update on public.carts
for each row execute function private.set_updated_at();
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function private.set_updated_at();
create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function private.set_updated_at();
create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function private.set_updated_at();
create trigger orders_set_updated_at
before update on public.orders
for each row execute function private.set_updated_at();
create trigger payments_set_updated_at
before update on public.payments
for each row execute function private.set_updated_at();

create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 120)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

insert into public.profiles (id, display_name)
select
  users.id,
  left(nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''), 120)
from auth.users as users
on conflict (id) do nothing;

create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('operator', 'admin')
  );
$$;

revoke all on function private.is_staff() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.vehicles enable row level security;
alter table public.product_compatibility enable row level security;
alter table public.product_cross_references enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_comments enable row level security;
alter table public.payments enable row level security;

revoke all on table
  public.profiles,
  public.brands,
  public.categories,
  public.products,
  public.product_images,
  public.vehicles,
  public.product_compatibility,
  public.product_cross_references,
  public.carts,
  public.cart_items,
  public.addresses,
  public.inventory,
  public.orders,
  public.order_items,
  public.order_status_history,
  public.order_comments,
  public.payments
from anon, authenticated;

grant select on
  public.brands,
  public.categories,
  public.products,
  public.product_images,
  public.vehicles,
  public.product_compatibility,
  public.product_cross_references
to anon, authenticated;

grant insert, update, delete on
  public.brands,
  public.categories,
  public.products,
  public.product_images,
  public.vehicles,
  public.product_compatibility,
  public.product_cross_references
to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;

grant select, insert, update, delete on public.carts, public.cart_items, public.addresses
to authenticated;

grant select on
  public.inventory,
  public.orders,
  public.order_items,
  public.order_status_history,
  public.order_comments,
  public.payments
to authenticated;

create policy "Users and staff can read profiles"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_staff()));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Published brands are public"
on public.brands for select to anon, authenticated
using (is_published or (select private.is_staff()));

create policy "Staff can manage brands"
on public.brands for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Published categories are public"
on public.categories for select to anon, authenticated
using (is_published or (select private.is_staff()));

create policy "Staff can manage categories"
on public.categories for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Active products in published catalog are public"
on public.products for select to anon, authenticated
using (
  (
    is_active
    and exists (
      select 1 from public.brands
      where brands.id = products.brand_id and brands.is_published
    )
    and exists (
      select 1 from public.categories
      where categories.id = products.category_id and categories.is_published
    )
  )
  or (select private.is_staff())
);

create policy "Staff can manage products"
on public.products for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Images of public products are public"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    join public.categories on categories.id = products.category_id
    where products.id = product_images.product_id
      and products.is_active
      and brands.is_published
      and categories.is_published
  )
  or (select private.is_staff())
);

create policy "Staff can manage product images"
on public.product_images for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Vehicles are publicly readable"
on public.vehicles for select to anon, authenticated
using (true);

create policy "Staff can manage vehicles"
on public.vehicles for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Compatibility of public products is public"
on public.product_compatibility for select to anon, authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    join public.categories on categories.id = products.category_id
    where products.id = product_compatibility.product_id
      and products.is_active
      and brands.is_published
      and categories.is_published
  )
  or (select private.is_staff())
);

create policy "Staff can manage product compatibility"
on public.product_compatibility for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Cross references of public products are public"
on public.product_cross_references for select to anon, authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    join public.categories on categories.id = products.category_id
    where products.id = product_cross_references.product_id
      and products.is_active
      and brands.is_published
      and categories.is_published
  )
  or (select private.is_staff())
);

create policy "Staff can manage product cross references"
on public.product_cross_references for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "Users can read their own carts"
on public.carts for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their own carts"
on public.carts for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own carts"
on public.carts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own carts"
on public.carts for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Users can read their own cart items"
on public.cart_items for select to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

create policy "Users can add active products to their own carts"
on public.cart_items for insert to authenticated
with check (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.products
    where products.id = cart_items.product_id and products.is_active
  )
);

create policy "Users can update their own cart items"
on public.cart_items for update to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.products
    where products.id = cart_items.product_id and products.is_active
  )
);

create policy "Users can delete their own cart items"
on public.cart_items for delete to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

create policy "Users can read their own addresses"
on public.addresses for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their own addresses"
on public.addresses for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own addresses"
on public.addresses for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own addresses"
on public.addresses for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Staff can read inventory"
on public.inventory for select to authenticated
using ((select private.is_staff()));

create policy "Customers and staff can read permitted orders"
on public.orders for select to authenticated
using (
  customer_id = (select auth.uid())
  or (select private.is_staff())
);

create policy "Customers and staff can read permitted order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (
        orders.customer_id = (select auth.uid())
        or (select private.is_staff())
      )
  )
);

create policy "Customers and staff can read permitted order history"
on public.order_status_history for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_status_history.order_id
      and (
        orders.customer_id = (select auth.uid())
        or (select private.is_staff())
      )
  )
);

create policy "Customers see public order comments and staff see all"
on public.order_comments for select to authenticated
using (
  (select private.is_staff())
  or (
    visibility = 'customer'
    and exists (
      select 1 from public.orders
      where orders.id = order_comments.order_id
        and orders.customer_id = (select auth.uid())
    )
  )
);

create policy "Staff can read payments"
on public.payments for select to authenticated
using ((select private.is_staff()));
