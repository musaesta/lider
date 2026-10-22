-- Локальный и будущий облачный bucket для фото товаров.
-- Публичное чтение файлов. Запись сотрудниками появится вместе с админкой.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product image files" on storage.objects;

create policy "Public can read product image files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');
