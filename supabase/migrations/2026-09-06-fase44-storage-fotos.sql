-- =====================================================
-- Fase 4.4: Fotos con Supabase Storage
-- Bucket privado 'fotos-reparaciones' + RLS:
-- - Lectura: solo usuarios autenticados (signed URLs)
-- - Escritura: solo usuarios autenticados
-- - Borrado: nadie (historial es append-only)
-- =====================================================

-- 1. CREAR BUCKET PRIVADO
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-reparaciones',
  'fotos-reparaciones',
  false,                                -- privado: requiere signed URLs
  5 * 1024 * 1024,                      -- 5 MB max por archivo original (se comprime en cliente)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. RLS: usuarios autenticados pueden leer (necesario para signed URLs)
create policy "authenticated_select_fotos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'fotos-reparaciones');

-- 3. RLS: usuarios autenticados pueden subir
create policy "authenticated_insert_fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos-reparaciones');

-- 4. RLS: nadie puede borrar (historial append-only)
-- (No creamos policy de update/delete para authenticated sobre este bucket)

-- =====================================================
-- NOTAS:
-- - El bucket es PRIVADO: las URLs no son publicas.
-- - El path usado sera: <orden_id>/<timestamp>-<uuid>.webp
--   (orden_id como carpeta permite generar signed URLs
--   en lote con createSignedUrls([path1, path2, ...])).
-- - Los mime types permitidos limitan lo que se puede
--   subir, pero la compression en cliente convierte todo
--   a image/webp antes del upload.
-- - file_size_limit de 5MB es el archivo ORIGINAL (antes
--   de comprimir). El comprimido sale ~150-300KB WebP.
-- =====================================================
