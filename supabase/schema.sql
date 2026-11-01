-- DocPocket schema. Run once in Supabase Dashboard > SQL Editor.
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check(char_length(display_name)<=80),
  display_name_en text check(char_length(display_name_en)<=80),
  dob date, address text check(char_length(address)<=300),
  phone text check(char_length(phone)<=24), contact_email text check(char_length(contact_email)<=120),
  id_number text check(id_number is null or id_number ~ '^[0-9]{13}$'),      -- ID number you type in Settings > แก้ไขข้อมูลบัตร (never verified by the app)
  member_no text check(member_no is null or member_no ~ '^[0-9]{12}$'),
  card_issued_on date, card_expires_on date,
  avatar_path text, consent_at timestamptz, consent_version text, created_at timestamptz default now(),
  home jsonb check(home is null or pg_column_size(home) < 32768));   -- your own banner texts + announcements for the Home screen
create table public.documents(
  id uuid primary key, user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check(char_length(title) between 1 and 60),
  category text check(category is null or char_length(category)<=40),         -- your own label, e.g. สัญญา
  holder_name text check(holder_name is null or char_length(holder_name)<=80),   -- your own notes about the document;
  doc_number  text check(doc_number  is null or char_length(doc_number)<=40),    -- never verified, never drawn on the image
  issued_on date, expires_on date,
  note text check(note is null or char_length(note)<=300),
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.document_images(
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  side text not null check(side in('front','back')),
  path text not null unique, mime text not null check(mime in('image/jpeg','image/png','image/webp')),
  size int not null check(size between 1 and 104857600),
  rotation int not null default 0 check(rotation in(0,90,180,270)),
  crop jsonb check(crop is null or (jsonb_typeof(crop)='object' and crop ?& array['x','y','w','h'])), -- normalised crop rectangle; display-only, the original file is untouched
  updated_at timestamptz default now(),
  unique(document_id,side),
  check(path = user_id::text||'/'||document_id::text||'/'||side));
create table public.activity(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check(kind in('uploaded','viewed','replaced','deleted','profile_updated','login','copy_saved')),
  detail text check(char_length(detail)<=120), created_at timestamptz default now());
create index on public.activity(user_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_images enable row level security;
alter table public.activity enable row level security;
-- profiles
create policy p_sel on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy p_ins on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy p_upd on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
-- documents (max 20 per user)
create policy d_sel on public.documents for select to authenticated using(user_id=(select auth.uid()));
create policy d_ins on public.documents for insert to authenticated with check(user_id=(select auth.uid()) and (select count(*) from public.documents where user_id=(select auth.uid()))<20);
create policy d_upd on public.documents for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy d_del on public.documents for delete to authenticated using(user_id=(select auth.uid()));
-- images: owner only, and the parent document must also be the owner's
create policy i_sel on public.document_images for select to authenticated using(user_id=(select auth.uid()));
create policy i_ins on public.document_images for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.documents d where d.id=document_id and d.user_id=(select auth.uid())));
create policy i_upd on public.document_images for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy i_del on public.document_images for delete to authenticated using(user_id=(select auth.uid()));
-- activity: append + read own; no edits
create policy a_sel on public.activity for select to authenticated using(user_id=(select auth.uid()));
create policy a_ins on public.activity for insert to authenticated with check(user_id=(select auth.uid()));
-- profile row + consent record at sign-up (consent value is client-asserted; keep your own audit trail if required)
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,consent_at,consent_version) values(new.id,(new.raw_user_meta_data->>'consent_at')::timestamptz,new.raw_user_meta_data->>'consent_version'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- PRIVATE bucket with server-side limits. Paths: <user-id>/<doc-id>/<side>[.thumb] and <user-id>/avatar
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('documents','documents',false,104857600,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy o_sel on storage.objects for select to authenticated using(bucket_id='documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy o_ins on storage.objects for insert to authenticated with check(bucket_id='documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy o_upd on storage.objects for update to authenticated using(bucket_id='documents' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy o_del on storage.objects for delete to authenticated using(bucket_id='documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- self-service account deletion (the app removes the user's files first, then calls this)
create function public.delete_my_account() returns void language plpgsql security definer set search_path='' as $$
begin delete from auth.users where id=auth.uid(); end $$;
revoke all on function public.delete_my_account() from public,anon;
grant execute on function public.delete_my_account() to authenticated;
