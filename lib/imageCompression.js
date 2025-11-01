/**
 * Fonction de compression d'images
 * @param {File} file - Le fichier image à compresser
 * @param {number} maxSizeMB - Taille maximale en Mo (default: 5MB)
 * @param {number} quality - Qualité de compression (0-1, default: 0.8)
 * @returns {Promise<File>} - Le fichier compressé
 */
export async function compressImage(file, maxSizeMB = 5, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.match('image.*')) {
      reject(new Error('Le fichier n\'est pas une image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculer les nouvelles dimensions pour respecter la taille maximale
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        let width = img.width;
        let height = img.height;

        // Réduire les dimensions si le fichier est trop volumineux
        const canvasSize = Math.sqrt((width * height * maxSizeBytes) / (file.size / quality));
        if (canvasSize < width) {
          height = (height * canvasSize) / width;
          width = canvasSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image sur le canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec la qualité spécifiée
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Échec de la compression de l\'image'));
              return;
            }

            // Créer un nouveau fichier avec le blob compressé
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Échec du chargement de l\'image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Fonction pour compresser plusieurs images
 * @param {FileList|File[]} files - Liste des fichiers à compresser
 * @param {number} maxSizeMB - Taille maximale en Mo (default: 5MB)
 * @param {number} quality - Qualité de compression (0-1, default: 0.8)
 * @returns {Promise<File[]>} - Les fichiers compressés
 */
export async function compressMultipleImages(files, maxSizeMB = 5, quality = 0.8) {
  const fileArray = Array.from(files);
  
  try {
    console.log(`🔄 Compression de ${fileArray.length} images...`);
    
    const compressedFiles = await Promise.all(
      fileArray.map(async (file, index) => {
        try {
          console.log(`🔄 Compression image ${index + 1}/${fileArray.length}: ${file.name}`);
          const compressed = await compressImage(file, maxSizeMB, quality);
          console.log(`✅ Image ${index + 1} compressée: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB)`);
          return compressed;
        } catch (error) {
          console.error(`❌ Erreur compression image ${file.name}:`, error);
          throw new Error(`Échec compression de ${file.name}: ${error.message}`);
        }
      })
    );
    
    console.log(`✅ Toutes les images compressées avec succès`);
    return compressedFiles;
  } catch (error) {
    console.error('❌ Erreur globale compression images:', error);
    throw error;
  }
}