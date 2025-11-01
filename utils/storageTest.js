'use client';

import { supabase } from '@/lib/supabaseClient';

/**
 * Fonction de test pour diagnostiquer les problèmes de storage Supabase
 */
export const testStoragePermissions = async () => {
  console.log('🔍 === TEST DE DIAGNOSTIC STORAGE SUPABASE ===');
  
  try {
    // 1. Vérifier la connexion Supabase
    console.log('1️⃣ Test de connexion Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError);
      return { success: false, error: 'Problème d\'authentification' };
    }
    
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return { success: false, error: 'Utilisateur non connecté' };
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // 2. Lister les buckets disponibles
    console.log('2️⃣ Vérification des buckets disponibles...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
      return { success: false, error: `Erreur buckets: ${bucketsError.message}` };
    }
    
    console.log('📋 Buckets disponibles:', buckets.map(b => ({
      name: b.name,
      public: b.public,
      created_at: b.created_at
    })));
    
    // 3. Vérifier le bucket spécifique
    const targetBucket = 'lieu_reception_images';
    const bucketExists = buckets.find(bucket => bucket.name === targetBucket);
    
    if (!bucketExists) {
      console.error(`❌ Le bucket "${targetBucket}" n'existe pas`);
      return { 
        success: false, 
        error: `Bucket "${targetBucket}" introuvable`,
        availableBuckets: buckets.map(b => b.name)
      };
    }
    
    console.log(`✅ Bucket "${targetBucket}" trouvé:`, {
      public: bucketExists.public,
      created_at: bucketExists.created_at
    });
    
    // 4. Test d'upload avec un fichier test
    console.log('3️⃣ Test d\'upload...');
    
    // Créer un fichier blob de test
    const testContent = 'Test image upload';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}_${user.id}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Erreur d\'upload:', uploadError);
      return { 
        success: false, 
        error: `Erreur upload: ${uploadError.message}`,
        details: uploadError
      };
    }
    
    console.log('✅ Upload réussi:', uploadData);
    
    // 5. Test de récupération de l'URL publique
    console.log('4️⃣ Test de récupération URL publique...');
    const { data: { publicUrl } } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(testFileName);
    
    console.log('✅ URL publique générée:', publicUrl);
    
    // 6. Test de suppression du fichier test
    console.log('5️⃣ Nettoyage du fichier test...');
    const { error: deleteError } = await supabase.storage
      .from(targetBucket)
      .remove([testFileName]);
    
    if (deleteError) {
      console.warn('⚠️ Impossible de supprimer le fichier test:', deleteError);
    } else {
      console.log('✅ Fichier test supprimé');
    }
    
    // 7. Vérifier les politiques RLS
    console.log('6️⃣ Vérification des permissions...');
    const { data: files, error: listError } = await supabase.storage
      .from(targetBucket)
      .list('', {
        limit: 1
      });
    
    if (listError) {
      console.warn('⚠️ Impossible de lister les fichiers (peut être normal):', listError);
    } else {
      console.log('✅ Permissions de lecture OK');
    }
    
    console.log('🎉 === TOUS LES TESTS RÉUSSIS ===');
    return { 
      success: true, 
      message: 'Storage configuré correctement',
      bucketInfo: bucketExists,
      testFile: testFileName,
      publicUrl
    };
    
  } catch (error) {
    console.error('💥 Erreur inattendue lors du test:', error);
    return { 
      success: false, 
      error: `Erreur inattendue: ${error.message}`,
      stack: error.stack
    };
  }
};

/**
 * Fonction pour tester spécifiquement l'upload d'images
 */
export const testImageUpload = async (file) => {
  console.log('🖼️ === TEST UPLOAD IMAGE ===');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log(`📤 Upload de l'image: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lieu_reception_images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError);
      return { success: false, error: uploadError };
    }
    
    console.log('✅ Image uploadée avec succès:', uploadData);
    
    // Récupérer l'URL
    const { data: { publicUrl } } = supabase.storage
      .from('lieu_reception_images')
      .getPublicUrl(fileName);
    
    console.log('✅ URL publique:', publicUrl);
    
    return { 
      success: true, 
      fileName, 
      publicUrl, 
      uploadData 
    };
    
  } catch (error) {
    console.error('💥 Erreur test image:', error);
    return { success: false, error: error.message };
  }
};

export default testStoragePermissions;
