# 🚨 Guide de Résolution - Problème d'Upload d'Images

## 🔍 **Diagnostic du Problème**

Le problème d'enregistrement des images peut avoir plusieurs causes. Suivez ce guide étape par étape.

## 📋 **Étapes de Diagnostic**

### **1. Vérification du Bucket**

1. **Allez sur la page Setup des Réceptions** (`/receptions/setup`)
2. **Naviguez jusqu'à l'étape 5 (Images)**
3. **Cliquez sur le bouton "🔍 Test Storage"**
4. **Vérifiez la console** (F12 → Console)

### **2. Résultats Possibles**

#### ✅ **Si le test réussit**
- Le bucket existe et fonctionne
- Le problème peut être dans le code ou les permissions

#### ❌ **Si le test échoue**
- Bucket inexistant → Utilisez "🔧 Config Bucket"
- Problème de permissions → Configurez les politiques RLS

## 🔧 **Solutions par Type d'Erreur**

### **Erreur: "Bucket n'existe pas"**

1. **Cliquez sur "🔧 Config Bucket"** dans l'interface
2. **OU créez manuellement dans Supabase:**
   - Allez dans Storage → Buckets
   - Créez un bucket nommé `lieu_reception_images`
   - Cochez "Public bucket"

### **Erreur: "Permissions insuffisantes"**

**Configurez les politiques RLS dans Supabase:**

1. **Allez dans Authentication → Policies**
2. **Créez ces politiques pour `storage.objects`:**

```sql
-- Politique 1: Permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lieu_reception_images');

-- Politique 2: Permettre la lecture publique
CREATE POLICY "Allow public to view images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'lieu_reception_images');

-- Politique 3: Permettre la suppression aux propriétaires
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'lieu_reception_images');
```

### **Erreur: "Fichier trop volumineux"**

- **Limite actuelle:** 10MB par image
- **Solution:** Les images sont automatiquement compressées
- **Vérifiez** que le fichier fait moins de 50MB avant compression

### **Erreur: "Format non supporté"**

**Formats acceptés:**
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ WebP (.webp)

## 🛠️ **Configuration Manuelle Supabase**

### **1. Créer le Bucket**

```sql
-- Dans l'éditeur SQL de Supabase
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lieu_reception_images',
  'lieu_reception_images', 
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);
```

### **2. Configurer les Politiques**

```sql
-- Activer RLS sur storage.objects (si pas déjà fait)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Politique d'upload
CREATE POLICY "lieu_reception_images_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lieu_reception_images');

-- Politique de lecture
CREATE POLICY "lieu_reception_images_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'lieu_reception_images');

-- Politique de suppression
CREATE POLICY "lieu_reception_images_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'lieu_reception_images');
```

## 🔍 **Vérification Finale**

### **Test Manuel**

1. **Ouvrez la console** (F12)
2. **Exécutez ce code:**

```javascript
// Test rapide d'upload
const testFile = new Blob(['test'], { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('lieu_reception_images')
  .upload(`test_${Date.now()}.txt`, testFile);

console.log('Résultat:', { data, error });
```

### **Vérification des Variables d'Environnement**

Assurez-vous que ces variables sont définies dans `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anonyme
```

## 📞 **Support Supplémentaire**

Si le problème persiste après ces étapes:

1. **Vérifiez les logs Supabase** dans le dashboard
2. **Testez avec un autre navigateur**
3. **Vérifiez la connexion réseau**
4. **Contactez le support Supabase** si nécessaire

## ✅ **Checklist de Vérification**

- [ ] Bucket `lieu_reception_images` existe
- [ ] Bucket est public
- [ ] Politiques RLS configurées
- [ ] Variables d'environnement correctes
- [ ] Utilisateur authentifié
- [ ] Fichiers dans les formats acceptés
- [ ] Taille des fichiers < 10MB

---

**Une fois toutes ces étapes complétées, l'upload d'images devrait fonctionner parfaitement !** 🎉
