# 🔧 FIX: Rôle "entreprise" non attribué lors de l'inscription

> **Problème:** Le rôle "entreprise" n'était pas attribué si l'utilisateur existait déjà  
> **Date:** Octobre 2025  
> **Status:** ✅ Corrigé

---

## ❌ LE PROBLÈME

Lors de l'inscription sur `/Studio-Arooskena`, certains utilisateurs n'obtenaient pas le rôle "entreprise".

### Scénario du bug:

```
1. Utilisateur s'inscrit normalement sur /sign-up
   → Rôle: "marie" attribué

2. Plus tard, il veut devenir prestataire
   → Va sur /Studio-Arooskena
   → Remplit le formulaire

3. Le code détectait que l'utilisateur existe déjà
   → Récupérait juste son user_id
   → ❌ Ne mettait PAS À JOUR le rôle!

4. Résultat: utilisateur garde le rôle "marie"
   → ❌ Ne peut pas accéder à /Studio-Arooskena/onboarding
   → ❌ Ne peut pas créer d'annuaire
```

---

## 🔍 CODE BUGUÉ

```tsx
// ❌ AVANT (Incorrect)
if (existingUser) {
  user_id = existingUser.id  // ← Juste récupérer l'ID
  // Pas de mise à jour du rôle!
} else {
  // Créer user avec rôle entreprise
  const { data: userData } = await supabase
    .from('users')
    .insert([{ 
      role_id: entreprise_role_id  // ← Rôle OK ici
    }])
}
```

**Problème:** Si l'utilisateur existe déjà, on ne change pas son rôle!

---

## ✅ LA SOLUTION

### Mise à jour du rôle si l'utilisateur existe:

```tsx
// ✅ APRÈS (Corrigé)
if (existingUser) {
  // ✅ Mettre à jour le rôle vers "entreprise"
  console.log('✅ Utilisateur existant trouvé, mise à jour du rôle')
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      role_id: entreprise_role_id,  // ← Mise à jour du rôle!
      phone: phone || existingUser.phone
    })
    .eq('id', existingUser.id)

  if (updateError) {
    console.error('❌ Erreur mise à jour rôle:', updateError)
    alert(`Erreur lors de la mise à jour du rôle`)
    return
  }

  console.log('✅ Rôle mis à jour vers entreprise')
  user_id = existingUser.id
}
```

---

## 📊 CAS D'USAGE

### Cas 1: Nouvel utilisateur (Inscription directe Studio)

```
1. Utilisateur va sur /Studio-Arooskena
2. Remplit formulaire inscription
3. Email pas dans users
4. ✅ INSERT avec role_id = entreprise
5. ✅ Rôle attribué correctement
```

### Cas 2: Utilisateur existant (Migration marie → entreprise)

```
1. Utilisateur inscrit avant sur /sign-up (rôle: marie)
2. Va sur /Studio-Arooskena
3. Remplit formulaire
4. Email trouvé dans users
5. ✅ UPDATE role_id = entreprise
6. ✅ Rôle changé de "marie" → "entreprise"
7. ✅ Peut maintenant créer annuaire
```

---

## 🎯 POURQUOI CE BUG ARRIVAIT?

### Flux initial prévu:

```
Studio-Arooskena → Nouveau compte entreprise
```

**Mais en réalité:**

```
/sign-up → Compte marie
     ↓
Utilisateur décide de devenir prestataire
     ↓
/Studio-Arooskena → ❌ Compte existait déjà!
```

**Le code ne gérait pas la "migration" de rôle!**

---

## 🔐 VÉRIFICATIONS AJOUTÉES

### Console logs pour debugging:

```tsx
// Cas utilisateur existant
console.log('✅ Utilisateur existant trouvé, mise à jour du rôle')
// ...
console.log('✅ Rôle mis à jour vers entreprise')

// Cas nouvel utilisateur
console.log('✅ Création nouveau utilisateur avec rôle entreprise')
// ...
console.log('✅ Utilisateur créé avec rôle entreprise')
```

### Gestion d'erreur:

```tsx
if (updateError) {
  console.error('❌ Erreur mise à jour rôle:', updateError)
  alert(`Erreur lors de la mise à jour du rôle : ${updateError.message}`)
  setLoading(false)
  return  // ← Stopper le processus si erreur
}
```

---

## 🧪 COMMENT TESTER

### Test 1: Nouvel utilisateur

```bash
1. npm run dev
2. http://localhost:3000
3. Clic "Espace Prestataires"
4. Inscription avec email non existant:
   - Email: neuf@test.dj
   - [...]
5. Console devrait afficher:
   "✅ Création nouveau utilisateur avec rôle entreprise"
   "✅ Utilisateur créé avec rôle entreprise"
6. Vérifier BDD:

SELECT u.email, r.name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'neuf@test.dj';

-- Résultat: role_name = "entreprise" ✅
```

### Test 2: Utilisateur existant (Migration)

```bash
1. D'abord, créer un compte marie:
   - Aller sur /sign-up
   - Email: existe@test.dj
   - Soumettre
   → Rôle: "marie"

2. Vérifier BDD:
SELECT u.email, r.name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'existe@test.dj';
-- Résultat: "marie" ✅

3. Maintenant, aller sur Studio:
   - /Studio-Arooskena
   - Utiliser MÊME email: existe@test.dj
   - Soumettre

4. Console devrait afficher:
   "✅ Utilisateur existant trouvé, mise à jour du rôle"
   "✅ Rôle mis à jour vers entreprise"

5. Vérifier BDD:
SELECT u.email, r.name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'existe@test.dj';
-- Résultat: "entreprise" ✅ (changé!)
```

---

## 📁 FICHIERS MODIFIÉS

```
✅ app/Studio-Arooskena/page.tsx
   - Ligne 67-69: Ajout sélection phone
   - Ligne 75-94: Ajout UPDATE du rôle si utilisateur existe
   - Ligne 97-117: Ajout logs pour création
   - Gestion d'erreur améliorée
```

---

## ✅ AVANT/APRÈS

### AVANT:

```tsx
if (existingUser) {
  user_id = existingUser.id  // ❌ Pas de mise à jour
}
```

**Problème:** Rôle reste "marie"

### APRÈS:

```tsx
if (existingUser) {
  // ✅ Mise à jour du rôle
  await supabase.from('users').update({ 
    role_id: entreprise_role_id 
  }).eq('id', existingUser.id)
  
  user_id = existingUser.id
}
```

**Résultat:** Rôle devient "entreprise"

---

## 🎯 IMPACT

### Avant le fix:

- ❌ Utilisateurs existants ne pouvaient pas devenir prestataires
- ❌ Accès refusé à /Studio-Arooskena/onboarding
- ❌ Impossibilité de créer annuaire
- ❌ Confusion utilisateur

### Après le fix:

- ✅ Nouveaux utilisateurs → rôle entreprise
- ✅ Utilisateurs existants → migration automatique
- ✅ Accès autorisé à l'onboarding
- ✅ Création d'annuaire possible
- ✅ Logs clairs pour debugging

---

## 📊 LOGS CONSOLE ATTENDUS

### Cas nouveau utilisateur:

```
🔄 Fetching role entreprise...
✅ Création nouveau utilisateur avec rôle entreprise
✅ Utilisateur créé avec rôle entreprise
🎉 Bienvenue dans le Studio Arooskena !
```

### Cas utilisateur existant:

```
🔄 Fetching role entreprise...
✅ Utilisateur existant trouvé, mise à jour du rôle vers entreprise
✅ Rôle mis à jour vers entreprise
🎉 Bienvenue dans le Studio Arooskena !
```

---

## ⚠️ POINTS D'ATTENTION

### 1. Vérifier que le rôle "entreprise" existe:

```sql
SELECT * FROM roles WHERE name = 'entreprise';
```

Si absent, le créer:
```sql
INSERT INTO roles (name, label) 
VALUES ('entreprise', 'Entreprise');
```

### 2. Migration anciens utilisateurs:

Si vous avez déjà des utilisateurs qui ont essayé de s'inscrire au Studio sans succès, ils peuvent maintenant réessayer!

Le système détectera qu'ils existent et mettra à jour leur rôle automatiquement.

---

## 🎉 RÉSUMÉ

### Problème résolu:

- ✅ Rôle "entreprise" maintenant attribué dans TOUS les cas
- ✅ Nouveaux utilisateurs → INSERT avec bon rôle
- ✅ Utilisateurs existants → UPDATE du rôle
- ✅ Logs détaillés pour debug
- ✅ Gestion d'erreur complète

### Fichiers modifiés:

```
✅ app/Studio-Arooskena/page.tsx
✅ FIX_ROLE_ENTREPRISE.md (ce fichier)
```

---

**✅ Le rôle "entreprise" est maintenant correctement attribué!**

**Testez l'inscription maintenant et vérifiez les logs console!** 🚀
