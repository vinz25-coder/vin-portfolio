begin;

drop policy guestbook_images_own_insert on storage.objects;
create policy guestbook_images_own_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'guestbook-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1 from public.guestbook_blocked_users where user_id = (select auth.uid())
  )
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and coalesce((metadata ->> 'size')::bigint, 0) between 1 and 5242880
  and metadata ->> 'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
);

drop policy guestbook_images_own_update on storage.objects;
create policy guestbook_images_own_update
on storage.objects for update to authenticated
using (
  bucket_id = 'guestbook-images'
  and owner_id = (select auth.uid())::text
  and not exists (
    select 1 from public.guestbook_blocked_users where user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'guestbook-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
  and not exists (
    select 1 from public.guestbook_blocked_users where user_id = (select auth.uid())
  )
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and coalesce((metadata ->> 'size')::bigint, 0) between 1 and 5242880
  and metadata ->> 'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
);

drop policy guestbook_images_own_delete on storage.objects;
create policy guestbook_images_own_delete
on storage.objects for delete to authenticated
using (bucket_id = 'guestbook-images' and owner_id = (select auth.uid())::text);

commit;
