# ✅ CONFORMITÉ AVEC LE SCHEMA DATABASE

> **Important:** Tous les formulaires doivent respecter exactement le schema.sql

---

## 📋 ÉTAPE 1: INSCRIPTION STUDIO AROOSKENA

### Champs du formulaire (CORRIGES):

```tsx
// ✅ Conforme au schema.sql
{
  first_name: '',  // → profiles.first_name
  last_name: '',   // → profiles.last_name
  email: '',       // → users.email
  phone: '',       // → users.phone
  password: ''     // → auth.users
}
```

### Tables utilisées:

**1. Table `auth.users` (Supabase Auth)**
```sql
id          | uuid (PK)
email       | text
-- password géré par Supabase Auth
```

**2. Table `users`**
```sql
id          | uuid (PK)
auth_user_id| uuid (FK → auth.users)
email       | text UNIQUE      ← Du formulaire
phone       | text UNIQUE      ← Du formulaire
role_id     | uuid (FK)        ← "entreprise" (automatique)
is_active   | boolean          ← true (automatique)
created_at  | timestamp        ← now() (automatique)
updated_at  | timestamp        ← now() (automatique)
```

**3. Table `profiles`**
```sql
id         | uuid (PK)
user_id    | uuid (FK → users)
first_name | text             ← Du formulaire
last_name  | text             ← Du formulaire
slug       | text UNIQUE      ← Généré automatiquement
avatar     | text             ← NULL (peut être ajouté plus tard)
created_at | timestamp        ← now() (automatique)
updated_at | timestamp        ← now() (automatique)
```

---

## ❌ CE QUI N'EST PAS DANS LE SCHEMA

### Champs RETIRÉS du formulaire:

```tsx
// ❌ RETIRÉ - N'existe pas dans users ou profiles
company_name: '' 
```

**Pourquoi retiré?**
- La table `users` n'a PAS de colonne `company_name`
- La table `profiles` n'a PAS de colonne `company_name`

**Où va le nom de l'entreprise?**
- Dans `prestataires.nom_entreprise` (si prestataire)
- Dans `lieux_reception.nom_lieu` (si lieu)
- **Collecté à l'ÉTAPE 2** (setup), pas à l'inscription!

---

## 📋 ÉTAPE 2A: SETUP PRESTATAIRE

### Table `prestataires`:

```sql
id               | uuid (PK)
user_id          | uuid (FK → users)
nom_entreprise   | text            ← ICI le nom entreprise!
description      | text
categorie_id     | uuid (FK)
subcategorie_id  | uuid (FK)
telephone_fixe   | text
whatsapp         | text
email            | text
website          | text
prix_min         | numeric
prix_max         | numeric
subscription_id  | uuid (FK)
is_verified      | boolean
is_featured      | boolean
created_at       | timestamp
updated_at       | timestamp
```

**Collecté dans:** `/prestataires/setup` (étape 1 du setup)

---

## 📋 ÉTAPE 2B: SETUP LIEU DE RÉCEPTION

### Table `lieux_reception`:

```sql
id                | uuid (PK)
user_id           | uuid (FK → users)
nom_lieu          | text            ← ICI le nom lieu!
description       | text
type_lieu_id      | uuid (FK)
capacite_min      | integer
capacite_max      | integer
prix_min          | numeric
prix_max          | numeric
prix_par_personne | numeric
telephone_fixe    | text
whatsapp          | text
email             | text
website           | text
subscription_id   | uuid (FK)
is_verified       | boolean
is_featured       | boolean
created_at        | timestamp
updated_at        | timestamp
```

**Collecté dans:** `/receptions/setup` (étape 1 du setup)

---

## ✅ NOUVEAU FORMULAIRE CONFORME

### Studio-Arooskena (Inscription)

```
┌────────────────────────────────┐
│  Créer votre compte            │
│                                │
│  [Prénom]      [Nom]           │
│  ✅ profiles   ✅ profiles     │
│                                │
│  [Email professionnel]         │
│  ✅ users.email                │
│                                │
│  [Téléphone]                   │
│  ✅ users.phone                │
│                                │
│  [Mot de passe]                │
│  ✅ auth.users                 │
│                                │
│  ☑️ J'accepte les CGV          │
│                                │
│  [Rejoindre le Studio →]       │
└────────────────────────────────┘
```

**Résultat:**
- ✅ Compte `users` créé (rôle: entreprise)
- ✅ Profil `profiles` créé
- ❌ Pas de `company_name` (n'existe pas dans schema!)

---

## 🔄 ÉTAPES SUIVANTES

### Après inscription:

```
1. Inscription → users + profiles créés
         ↓
2. Onboarding → Choix Prestataire OU Lieu
         ↓
3. Setup → Collecte nom_entreprise OU nom_lieu
         ↓
4. Annuaire créé et publié
```

### Formulaire Setup Prestataire (étape 1):

```
┌────────────────────────────────┐
│  Informations de base          │
│                                │
│  [Nom de l'entreprise]         │
│  → prestataires.nom_entreprise │
│                                │
│  [Description]                 │
│  → prestataires.description    │
│                                │
│  [Catégorie]                   │
│  → prestataires.categorie_id   │
│                                │
│  [...autres champs...]         │
└────────────────────────────────┘
```

---

## 🔍 VÉRIFICATION SCHEMA COMPLIANCE

### Checklist pour tout formulaire:

- [ ] Chaque champ correspond à une colonne dans une table
- [ ] Pas de champs "inventés" qui n'existent pas en BDD
- [ ] Les FK (foreign keys) pointent vers des tables existantes
- [ ] Les types correspondent (text, numeric, boolean, etc.)
- [ ] Les contraintes sont respectées (UNIQUE, NOT NULL)

---

## 📊 MAPPING COMPLET

### Formulaire → Base de données

```
Studio-Arooskena (Inscription):
├─ first_name    → profiles.first_name ✅
├─ last_name     → profiles.last_name ✅
├─ email         → users.email ✅
├─ phone         → users.phone ✅
├─ password      → auth.users (Supabase) ✅
└─ role_id       → users.role_id (automatique: "entreprise") ✅

Prestataires Setup (Étape 1):
├─ nom_entreprise → prestataires.nom_entreprise ✅
├─ description    → prestataires.description ✅
└─ [...]

Lieux Setup (Étape 1):
├─ nom_lieu      → lieux_reception.nom_lieu ✅
├─ description   → lieux_reception.description ✅
└─ [...]
```

---

## ⚠️ RÈGLE IMPORTANTE

### Ne JAMAIS ajouter de champs qui n'existent pas dans le schema!

**Si besoin d'un nouveau champ:**

1. **D'abord:** Ajouter la colonne dans `schema.sql`
```sql
ALTER TABLE users 
ADD COLUMN company_name text;
```

2. **Ensuite:** L'utiliser dans le formulaire
```tsx
company_name: ''
```

**Ordre:** Schema PUIS Code, pas l'inverse!

---

## ✅ RÉSUMÉ DE LA CORRECTION

### Ce qui a été RETIRÉ:

```tsx
// ❌ AVANT (Incorrect)
{
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  company_name: '' ← N'existe pas dans users!
}
```

### Ce qui est MAINTENANT:

```tsx
// ✅ APRÈS (Conforme au schema)
{
  first_name: '',  // profiles.first_name
  last_name: '',   // profiles.last_name
  email: '',       // users.email
  phone: '',       // users.phone
  password: ''     // auth.users
}
```

### Où va le nom de l'entreprise?

```
Étape 2 → Setup Prestataire
→ prestataires.nom_entreprise

OU

Étape 2 → Setup Lieu
→ lieux_reception.nom_lieu
```

---

**✅ Le formulaire est maintenant 100% conforme au schema.sql!**
