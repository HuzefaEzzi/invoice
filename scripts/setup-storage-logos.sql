-- Company logos storage: RLS policies for bucket "company-logos".
-- Run this in Supabase SQL Editor after setup-database.sql.
--
-- First create the bucket in Dashboard: Storage -> New bucket -> name "company-logos",
-- Public = ON, File size limit 2MB, Allowed MIME types: image/jpeg, image/png, image/gif, image/webp.
-- Path structure in bucket: {user_id}/{company_id}/logo.{ext}

-- RLS: allow authenticated users to upload/update/delete only under their user_id folder.
-- Use auth.jwt()->>'sub' per Supabase docs (matches session user id).
-- Upsert requires SELECT + UPDATE in addition to INSERT.

DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
CREATE POLICY "Users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  );

DROP POLICY IF EXISTS "Users can select own company logos" ON storage.objects;
CREATE POLICY "Users can select own company logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  );

DROP POLICY IF EXISTS "Users can update own company logos" ON storage.objects;
CREATE POLICY "Users can update own company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  );

DROP POLICY IF EXISTS "Users can delete own company logos" ON storage.objects;
CREATE POLICY "Users can delete own company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  );

-- Public bucket allows unauthenticated reads via URL; these policies control authenticated access.
