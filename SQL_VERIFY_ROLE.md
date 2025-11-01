# 🔍 SQL: Vérifier les rôles utilisateurs

> Guide rapide pour vérifier que les rôles sont correctement attribués

---

## ✅ VÉRIFICATIONS RAPIDES

### 1. Vérifier qu'un utilisateur a le bon rôle

```sql
-- Remplacer par l'email de test
SELECT 
  u.email,
  r.name as role_name,
  r.label as role_label,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'test@studio.dj';
```

**Résultat attendu:**
```
email: test@studio.dj
role_name: entreprise
role_label: Entreprise
```

---

### 2. Voir TOUS les utilisateurs avec leur rôle

```sql
SELECT 
  u.email,
  r.name as role_name,
  u.created_at::date as inscription
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC
LIMIT 10;
```

**Utile pour:** Voir les dernières inscriptions et leurs rôles

---

### 3. Compter les utilisateurs par rôle

```sql
SELECT 
  r.name as role_name,
  COUNT(u.id) as nb_users
FROM roles r
LEFT JOIN users u ON u.role_id = r.id
GROUP BY r.name, r.id
ORDER BY nb_users DESC;
```

**Résultat exemple:**
```
role_name    | nb_users
-------------|----------
marie        | 45
entreprise   | 12
admin        | 2
```

---

### 4. Trouver les utilisateurs sans rôle

```sql
SELECT 
  u.email,
  u.created_at
FROM users u
WHERE u.role_id IS NULL;
```

**Devrait être vide!** Si des utilisateurs apparaissent, ils ont un problème.

---

### 5. Vérifier qu'un utilisateur peut accéder au Studio

```sql
-- Vérifier le rôle ET les données complètes
SELECT 
  u.email,
  r.name as role_name,
  p.first_name,
  p.last_name,
  u.phone,
  CASE 
    WHEN r.name = 'entreprise' THEN '✅ Peut créer annuaire'
    WHEN r.name = 'marie' THEN '❌ Doit passer par Studio'
    WHEN r.name = 'admin' THEN '✅ Accès admin'
    ELSE '⚠️ Rôle inconnu'
  END as status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'test@studio.dj';
```

---

## 🔧 CORRECTIONS SI NÉCESSAIRE

### Forcer un utilisateur au rôle "entreprise"

```sql
-- 1. Récupérer l'ID du rôle entreprise
SELECT id FROM roles WHERE name = 'entreprise';
-- Exemple résultat: f3b2d1a8-...

-- 2. Mettre à jour l'utilisateur
UPDATE users 
SET role_id = 'f3b2d1a8-...'  -- ← Remplacer par l'ID du step 1
WHERE email = 'utilisateur@email.com';
```

**OU en une seule requête:**

```sql
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'entreprise')
WHERE email = 'utilisateur@email.com';
```

---

### Créer le rôle "entreprise" s'il n'existe pas

```sql
-- Vérifier d'abord
SELECT * FROM roles WHERE name = 'entreprise';

-- Si vide, créer:
INSERT INTO roles (name, label) 
VALUES ('entreprise', 'Entreprise');
```

---

## 📊 VÉRIFIER LA COHÉRENCE

### Utilisateurs avec profil mais sans rôle

```sql
SELECT 
  u.email,
  p.first_name,
  p.last_name,
  u.role_id
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.role_id IS NULL;
```

---

### Utilisateurs du Studio sans annuaire

```sql
-- Entreprises qui n'ont pas encore créé d'annuaire
SELECT 
  u.email,
  p.first_name || ' ' || p.last_name as nom_complet,
  u.created_at::date as inscription
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN profiles p ON p.user_id = u.id
LEFT JOIN prestataires pr ON pr.user_id = u.id
LEFT JOIN lieux_reception lr ON lr.user_id = u.id
WHERE r.name = 'entreprise'
  AND pr.id IS NULL
  AND lr.id IS NULL
ORDER BY u.created_at DESC;
```

**Utile pour:** Relancer les utilisateurs qui ont commencé l'inscription mais n'ont pas fini

---

## 🎯 TESTS APRÈS FIX

### Test 1: Vérifier un nouvel utilisateur Studio

```sql
-- Après inscription sur /Studio-Arooskena
SELECT 
  u.email,
  r.name as role_name,
  p.first_name,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'nouveau@test.dj'
ORDER BY u.created_at DESC
LIMIT 1;
```

**Attendu:** `role_name = entreprise`

---

### Test 2: Vérifier la migration d'un utilisateur existant

```sql
-- AVANT l'inscription Studio (rôle marie)
SELECT r.name FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'existe@test.dj';
-- Résultat: marie

-- Utilisateur s'inscrit sur /Studio-Arooskena

-- APRÈS l'inscription Studio
SELECT r.name FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'existe@test.dj';
-- Résultat attendu: entreprise ✅
```

---

## 🚨 ALERTES

### Détecter les rôles incohérents

```sql
-- Utilisateurs avec annuaire prestataire mais pas rôle entreprise
SELECT 
  u.email,
  r.name as role_actuel,
  pr.nom_entreprise
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN prestataires pr ON pr.user_id = u.id
WHERE r.name != 'entreprise';
```

**Devrait être vide après le fix!**

---

## 📋 CHECKLIST POST-FIX

- [ ] Tous les nouveaux utilisateurs Studio ont rôle "entreprise"
- [ ] Les migrations marie → entreprise fonctionnent
- [ ] Aucun utilisateur avec annuaire mais mauvais rôle
- [ ] Aucun utilisateur sans rôle
- [ ] Le rôle "entreprise" existe dans la table roles

---

**🔍 Utilisez ces requêtes pour vérifier que tout fonctionne correctement!**
