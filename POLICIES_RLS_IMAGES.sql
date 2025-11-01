-- ========================================
-- POLITIQUES RLS POUR LE BUCKET lieu_reception_images
-- ========================================
-- Copiez et exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to upload lieu reception images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view lieu reception images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete lieu reception images" ON storage.objects;

-- 2. Créer les nouvelles politiques

-- Politique pour UPLOAD (INSERT)
CREATE POLICY "Allow authenticated users to upload lieu reception images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lieu_reception_images');

-- Politique pour LECTURE (SELECT)
CREATE POLICY "Allow public to view lieu reception images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lieu_reception_images');

-- Politique pour SUPPRESSION (DELETE)
CREATE POLICY "Allow users to delete lieu reception images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lieu_reception_images');

-- 3. Vérifier que RLS est activé sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VÉRIFICATION
-- ========================================
-- Pour vérifier que les politiques sont créées, exécutez :
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%lieu_reception_images%';

-- ========================================
-- Si vous avez des erreurs, assurez-vous que:
-- 1. Le bucket 'lieu_reception_images' existe
-- 2. Il est configuré comme PUBLIC
-- 3. Vous êtes connecté en tant qu'administrateur
-- ========================================
