# ⚠️ IMPORTANT: Vérifier le nom du rôle dans Supabase!

## 🔍 ACTION REQUISE AVANT DE TESTER

Vous devez vérifier que le rôle existe dans votre base de données!

### 1. Ouvrir Supabase SQL Editor

```sql
SELECT * FROM roles;
```

### 2. Vérifier le nom exact du rôle prestataire

**Options possibles:**
- `entreprise` (ce que j'ai utilisé dans le code)
- `prestataire` (nom courant)
- Autre?

### 3. Si le rôle s'appelle "prestataire" (et non "entreprise")

**Modifier le fichier `app/Studio-Arooskena/page.tsx` ligne 52:**

```tsx
// AVANT (si le rôle n'existe pas):
.eq('name', 'entreprise')

// APRÈS (si le rôle s'appelle "prestataire"):
.eq('name', 'prestataire')
```

---

## 🛠️ SI LE RÔLE N'EXISTE PAS DU TOUT

Créez-le dans Supabase:

```sql
INSERT INTO roles (name, label) 
VALUES ('entreprise', 'Prestataire/Entreprise');
```

**OU** si vous préférez utiliser "prestataire":

```sql
INSERT INTO roles (name, label) 
VALUES ('prestataire', 'Prestataire');
```

---

## ✅ VÉRIFICATION RAPIDE

```sql
-- Cette requête doit retourner au moins 3 lignes:
SELECT id, name, label FROM roles;

-- Résultat attendu:
-- 1 | admin       | Administrateur
-- 2 | marie       | Marié(e)
-- 3 | entreprise  | Prestataire      ← Vérifier ce nom!
--   OU
-- 3 | prestataire | Prestataire      ← Ou celui-ci?
```

---

## 🎯 APRÈS VÉRIFICATION

1. Si le rôle existe avec le nom "entreprise" → **Vous êtes prêt!**
2. Si le rôle existe avec le nom "prestataire" → **Modifier le code**
3. Si le rôle n'existe pas → **Le créer en SQL**

---

**⚠️ FAITES CETTE VÉRIFICATION AVANT DE TESTER L'INSCRIPTION!**
