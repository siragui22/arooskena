# Mise à jour du système d'images - Storage Supabase

## Vue d'ensemble

Le système d'images a été mis à jour pour utiliser le storage bucket `prestataires_images` de Supabase au lieu d'URLs externes. Cela permet un meilleur contrôle, une sécurité renforcée et une gestion centralisée des images.

## Modifications apportées

### 🏗️ **Architecture du système**

#### Ancien système :
- URLs externes stockées en base de données
- Pas de contrôle sur les images
- Risque de liens cassés
- Pas de gestion centralisée

#### Nouveau système :
- Upload direct dans Supabase Storage
- Bucket dédié : `prestataires_images`
- URLs publiques générées automatiquement
- Gestion complète du cycle de vie des images

### 📁 **Structure du storage**

```
prestataires_images/
├── {prestataire_id}_{timestamp}.jpg
├── {prestataire_id}_{timestamp}.png
└── {prestataire_id}_{timestamp}.webp
```

#### Convention de nommage :
- Format : `{prestataire_id}_{timestamp}.{extension}`
- Exemple : `123e4567-e89b-12d3-a456-426614174000_1703123456789.jpg`
- Garantit l'unicité des fichiers
- Facilite l'identification du propriétaire

### 🔧 **Fonctionnalités techniques**

#### 1. Upload d'images

```javascript
const handleImageSubmit = async (e) => {
  e.preventDefault();
  
  if (!imageForm.file) {
    alert('Veuillez sélectionner un fichier image');
    return;
  }

  setUploading(true);
  
  try {
    // Générer un nom de fichier unique
    const fileExt = imageForm.file.name.split('.').pop();
    const fileName = `${prestataire.id}_${Date.now()}.${fileExt}`;
    
    // Uploader l'image dans le storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prestataires_images')
      .upload(fileName, imageForm.file);

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique de l'image
    const { data: { publicUrl } } = supabase.storage
      .from('prestataires_images')
      .getPublicUrl(fileName);

    // Insérer l'URL dans la base de données
    await supabase
      .from('prestataire_images')
      .insert({
        prestataire_id: prestataire.id,
        url: publicUrl,
        is_main: imageForm.is_main
      });

    // Réinitialiser le formulaire
    setImageForm({ file: null, is_main: false });
    await loadData(userData.id);
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
  } finally {
    setUploading(false);
  }
};
```

#### 2. Suppression d'images

```javascript
const handleDeleteImage = async (imageId, imageUrl) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
    try {
      // Extraire le nom du fichier de l'URL
      const fileName = imageUrl.split('/').pop();
      
      // Supprimer l'image du storage
      const { error: storageError } = await supabase.storage
        .from('prestataires_images')
        .remove([fileName]);

      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier storage:', storageError);
      }

      // Supprimer l'enregistrement de la base de données
      await supabase
        .from('prestataire_images')
        .delete()
        .eq('id', imageId);

      await loadData(userData.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }
};
```

#### 3. Upload multiple (page de setup)

```javascript
// Upload de plusieurs images en parallèle
const imagePromises = formData.images.map(async (img) => {
  if (!img.file) return null;
  
  // Générer un nom de fichier unique
  const fileExt = img.file.name.split('.').pop();
  const fileName = `${newPrestataire.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  
  // Uploader l'image dans le storage bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('prestataires_images')
    .upload(fileName, img.file);

  if (uploadError) throw uploadError;

  // Récupérer l'URL publique de l'image
  const { data: { publicUrl } } = supabase.storage
    .from('prestataires_images')
    .getPublicUrl(fileName);

  return {
    prestataire_id: newPrestataire.id,
    url: publicUrl,
    is_main: img.is_main
  };
});

const imagesToInsert = (await Promise.all(imagePromises)).filter(img => img !== null);
```

### 🎨 **Interface utilisateur**

#### Formulaire d'upload mis à jour :

1. **Input file** au lieu d'URL :
   ```html
   <input
     type="file"
     required
     accept="image/*"
     onChange={(e) => setImageForm({...imageForm, file: e.target.files[0]})}
     className="input-aroos w-full"
   />
   ```

2. **Validation des formats** :
   - Formats acceptés : JPG, PNG, GIF, WebP
   - Taille maximale : 5MB (à configurer côté serveur)
   - Validation côté client avec `accept="image/*"`

3. **Feedback utilisateur** :
   - Indicateur de chargement pendant l'upload
   - Messages d'erreur en cas d'échec
   - Boutons désactivés pendant l'upload

#### États de l'interface :

```javascript
const [uploading, setUploading] = useState(false);
const [uploadingImages, setUploadingImages] = useState(false);

// Bouton avec état de chargement
<button 
  type="submit" 
  className="btn-aroos"
  disabled={uploading}
>
  {uploading ? '⏳ Upload...' : '➕ Ajouter'}
</button>
```

### 🔒 **Sécurité et permissions**

#### Configuration du bucket `prestataires_images` :

1. **Politique RLS (Row Level Security)** :
   ```sql
   -- Permettre la lecture publique des images
   CREATE POLICY "Images are publicly readable" ON storage.objects
   FOR SELECT USING (bucket_id = 'prestataires_images');

   -- Permettre l'upload aux prestataires authentifiés
   CREATE POLICY "Prestataires can upload images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'prestataires_images' 
     AND auth.role() = 'authenticated'
   );

   -- Permettre la suppression aux propriétaires
   CREATE POLICY "Prestataires can delete their images" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'prestataires_images'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

2. **Validation des fichiers** :
   - Types MIME autorisés
   - Taille maximale
   - Nom de fichier sécurisé

### 📊 **Avantages du nouveau système**

#### 1. **Contrôle total** :
   - Gestion centralisée des images
   - Pas de dépendance externe
   - Contrôle des permissions

#### 2. **Performance** :
   - CDN intégré de Supabase
   - Optimisation automatique
   - Cache intelligent

#### 3. **Sécurité** :
   - Authentification requise
   - Politiques RLS
   - Validation des fichiers

#### 4. **Maintenance** :
   - Pas de liens cassés
   - Gestion automatique des URLs
   - Monitoring intégré

### 🔄 **Migration des données existantes**

Si des images existent avec des URLs externes :

1. **Script de migration** :
   ```javascript
   // Télécharger les images externes
   // Les uploader dans le storage
   // Mettre à jour les URLs en base
   ```

2. **Validation** :
   - Vérifier l'accessibilité des URLs
   - Télécharger et valider les images
   - Mettre à jour les enregistrements

### 🚀 **Fonctionnalités avancées possibles**

1. **Redimensionnement automatique** :
   - Génération de thumbnails
   - Optimisation des tailles
   - Formats WebP automatiques

2. **Compression** :
   - Réduction de la taille des fichiers
   - Qualité adaptative
   - Formats modernes

3. **Analytics** :
   - Statistiques d'utilisation
   - Monitoring des uploads
   - Alertes de quota

4. **Backup** :
   - Sauvegarde automatique
   - Réplication géographique
   - Récupération de données

### 📁 **Fichiers modifiés**

- `app/prestataires/page.jsx` - Gestion des images avec upload
- `app/prestataires/setup/page.jsx` - Setup avec upload multiple
- `IMAGES_STORAGE_UPDATE.md` - Documentation

### 🎯 **Configuration requise**

1. **Bucket Supabase** :
   - Nom : `prestataires_images`
   - Public : true (pour les URLs publiques)
   - RLS : activé avec politiques appropriées

2. **Variables d'environnement** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Permissions** :
   - Authentification requise pour l'upload
   - Lecture publique pour l'affichage
   - Suppression limitée aux propriétaires

## Conclusion

Le nouveau système d'images avec Supabase Storage offre une solution robuste, sécurisée et performante pour la gestion des images des prestataires, avec un contrôle total et une expérience utilisateur optimisée.









