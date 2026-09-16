-- Store user-uploaded profile images in a public bucket.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Public avatar images are readable"
on storage.objects for select
using (bucket_id = 'avatars');
