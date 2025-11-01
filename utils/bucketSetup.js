'use client';

import { supabase } from '@/lib/supabaseClient';

/**
 * Fonction pour vérifier et configurer le bucket de stockage des images
 */
export const setupImageBucket = async () => {
  console.log('🔧 === CONFIGURATION DU BUCKET IMAGES ===');
  
  try {
    const bucketName = 'lieu_reception_images';
    
    // 1. Vérifier si le bucket existe
    console.log('1️⃣ Vérification de l\'existence du bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erreur lors de la récupération des buckets:', listError);
      throw new Error(`Impossible de lister les buckets: ${listError.message}`);
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === bucketName);
    
    if (existingBucket) {
      console.log('✅ Le bucket existe déjà:', existingBucket);
      return { success: true, message: 'Bucket déjà configuré', bucket: existingBucket };
    }
    
    // 2. Créer le bucket s'il n'existe pas
    console.log('2️⃣ Création du bucket...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (createError) {
      console.error('❌ Erreur lors de la création du bucket:', createError);
      throw new Error(`Impossible de créer le bucket: ${createError.message}`);
    }
    
    console.log('✅ Bucket créé avec succès:', newBucket);
    
    // 3. Configurer les politiques RLS (Row Level Security)
    console.log('3️⃣ Configuration des politiques de sécurité...');
    
    // Note: Les politiques RLS doivent être configurées via l'interface Supabase ou SQL
    // Car l'API JavaScript ne permet pas de créer des politiques
    
    console.log('⚠️ IMPORTANT: Vous devez configurer les politiques RLS manuellement dans Supabase:');
    console.log(`
    -- Politique pour permettre l'upload (INSERT)
    CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = '${bucketName}');
    
    -- Politique pour permettre la lecture (SELECT)  
    CREATE POLICY "Allow public to view images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = '${bucketName}');
    
    -- Politique pour permettre la suppression (DELETE)
    CREATE POLICY "Allow users to delete their own images" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = '${bucketName}');
    `);
    
    return { 
      success: true, 
      message: 'Bucket créé - Configurez les politiques RLS', 
      bucket: newBucket,
      needsRLSSetup: true
    };
    
  } catch (error) {
    console.error('💥 Erreur lors de la configuration du bucket:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack
    };
  }
};

/**
 * Fonction pour vérifier les politiques RLS
 */
export const checkBucketPolicies = async () => {
  console.log('🔍 === VÉRIFICATION DES POLITIQUES RLS ===');
  
  try {
    const bucketName = 'lieu_reception_images';
    
    // Test d'upload pour vérifier les permissions
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testFile);
    
    if (error) {
      console.error('❌ Erreur de politique RLS:', error);
      return {
        success: false,
        error: 'Politiques RLS non configurées ou incorrectes',
        details: error
      };
    }
    
    // Nettoyer le fichier test
    await supabase.storage.from(bucketName).remove([testFileName]);
    
    console.log('✅ Politiques RLS configurées correctement');
    return { success: true, message: 'Politiques RLS OK' };
    
  } catch (error) {
    console.error('💥 Erreur lors de la vérification des politiques:', error);
    return { success: false, error: error.message };
  }
};

export default setupImageBucket;
