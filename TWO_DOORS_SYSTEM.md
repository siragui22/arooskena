# 🚪🚪 SYSTÈME À DEUX PORTES D'INSCRIPTION

> **Concept:** Séparation automatique des rôles selon l'URL d'inscription  
> **Date:** Octobre 2025  
> **Status:** ✅ Implémenté

---

## 🎯 CONCEPT

Au lieu d'une seule page d'inscription avec choix de rôle, **2 URL distinctes** qui assignent automatiquement le bon rôle:

```
┌─────────────────────────────────────────┐
│         AROOSKENA WEBSITE               │
├─────────────────────────────────────────┤
│                                         │
│  🚪 PORTE 1: /sign-up                   │
│  → Rôle: "marie"                        │
│  → Accès: /dashboard-wedding            │
│  → Cible: Futurs mariés, visiteurs      │
│                                         │
│  🚪 PORTE 2: /Studio-Arooskena          │
│  → Rôle: "entreprise"                   │
│  → Accès: /dashboard-prestataire        │
│  → Cible: Prestataires, Lieux           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📋 DÉTAILS DES DEUX PORTES

### 🚪 PORTE 1: Inscription Utilisateurs Classiques

**URL:**
```
/sign-up
```

**Rôle attribué:**
```sql
role_id → "marie"
```

**Redirection après inscription:**
```
/dashboard-wedding
```

**Cible:**
- Futurs mariés
- Visiteurs du site
- Personnes planifiant leur mariage

**Fonctionnalités:**
- Création de mariage
- Gestion du budget
- Liste de tâches
- Recherche de prestataires
- Demandes de devis

---

### 🚪 PORTE 2: Studio Arooskena (Prestataires)

**URL:**
```
/Studio-Arooskena
```

**Rôle attribué:**
```sql
role_id → "entreprise"
```

**Redirection après inscription:**
```
/dashboard-prestataire
```

**Cible:**
- Prestataires de mariage
- Lieux de réception
- Photographes, DJ, Traiteurs, etc.
- Toute entreprise du secteur mariage

**Fonctionnalités:**
- Vitrine professionnelle publique
- Gestion des demandes de devis
- Statistiques et analytics
- Gestion des avis clients
- Upload photos/portfolio
- Tarifs et services

---

## 🎨 DESIGN DES PAGES

### Page /sign-up (Utilisateurs)

**Style:** Simple et épuré
```
┌──────────────────────────────┐
│   Créer un compte            │
│                              │
│   [Prénom]    [Nom]          │
│   [Téléphone]                │
│   [Email]                    │
│   [Mot de passe]             │
│                              │
│   [S'inscrire]               │
└──────────────────────────────┘
```

**Champs:**
- Prénom → `profiles.first_name`
- Nom → `profiles.last_name`
- Email → `users.email`
- Téléphone → `users.phone`
- Mot de passe → `auth.users`

---

### Page /Studio-Arooskena (Prestataires)

**Style:** Professionnel avec split-screen

```
┌─────────────────────────────────────────────────┐
│  🏢 Studio Arooskena    │   Créer votre compte  │
│                         │                       │
│  Votre espace pro       │   [Prénom]   [Nom]    │
│                         │   [Email pro]         │
│  ✅ Vitrine pro         │   [Téléphone]         │
│  ✅ Gestion demandes    │   [Mot de passe]      │
│  ✅ Stats détaillées    │                       │
│                         │                       │
│  (Gradient rose-orange) │   [Rejoindre Studio]  │
└─────────────────────────────────────────────────┘
```

**Champs:**
- Prénom → `profiles.first_name`
- Nom → `profiles.last_name`
- Email professionnel → `users.email`
- Téléphone → `users.phone`
- Mot de passe → `auth.users`

**Note:** Le nom de l'entreprise sera collecté dans le setup (étape 2)!

**Différences visuelles:**
- Icône Briefcase
- Gradient rose-orange sur la gauche
- Liste des avantages du Studio
- Terminologie "professionnelle"

---

## 🔐 LOGIQUE D'ATTRIBUTION DES RÔLES

### Code /sign-up (Rôle "marie")

```tsx
// app/sign-up/page.tsx
const handleSubmit = async (e) => {
  // ...
  
  // ✅ Récupérer l'ID du rôle "marie"
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'marie')  // ← Rôle fixe!
    .single()

  // Insérer user avec role_id "marie"
  await supabase
    .from('users')
    .insert([{ 
      auth_user_id, 
      email, 
      role_id: roleData.id,  // ← "marie"
      is_active: true 
    }])
}
```

---

### Code /Studio-Arooskena (Rôle "entreprise")

```tsx
// app/Studio-Arooskena/page.tsx
const handleSubmit = async (e) => {
  // ...
  
  // ✅ Récupérer l'ID du rôle "entreprise"
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'entreprise')  // ← Rôle fixe!
    .single()

  // Insérer user avec role_id "entreprise"
  await supabase
    .from('users')
    .insert([{ 
      auth_user_id, 
      email, 
      role_id: roleData.id,  // ← "entreprise"
      is_active: true 
    }])
}
```

---

## 🗺️ NAVIGATION DEPUIS LA NAVBAR

### Navbar (Utilisateur non connecté)

**Desktop:**
```
[Logo] [Navigation]    [📋 Espace Prestataires] [Connexion] [Inscription]
                            ↓                        ↓           ↓
                    /Studio-Arooskena          /sign-in     /sign-up
```

**Logique:**
- **Espace Prestataires** → `/Studio-Arooskena` (inscription avec rôle entreprise)
- **Connexion** → `/sign-in` (login général)
- **Inscription** → `/sign-up` (inscription avec rôle marie)

---

## 📊 FLUX UTILISATEURS

### Flux 1: Utilisateur classique (futur marié)

```
1. Visite arooskena.com
2. Clique "Inscription" (navbar)
3. Remplit formulaire /sign-up
4. ✅ Compte créé avec rôle "marie"
5. Redirection vers /dashboard-wedding
6. Peut créer son mariage, chercher prestataires
```

---

### Flux 2: Prestataire

```
1. Visite arooskena.com
2. Clique "Espace Prestataires" (navbar)
3. Accède à /Studio-Arooskena
4. Remplit formulaire prestataire
5. ✅ Compte créé avec rôle "entreprise"
6. Redirection vers /dashboard-prestataire
7. Peut créer sa vitrine, gérer demandes
```

---

## 🔄 REDIRECTION APRÈS CONNEXION

Dans `/sign-in`, la logique de redirection:

```tsx
// Après connexion réussie
if (userRole === 'admin') {
  router.push('/admin')
} else if (userRole === 'entreprise') {
  router.push('/dashboard-prestataire')
} else if (userRole === 'marie') {
  router.push('/dashboard-wedding')
} else {
  router.push('/')
}
```

**Pas besoin de paramètre redirect!** Le rôle détermine tout.

---

## 🗄️ STRUCTURE BASE DE DONNÉES

### Table: roles

```sql
id    | name        | label
------|-------------|----------------
1     | admin       | Administrateur
2     | marie       | Marié(e)
3     | entreprise  | Prestataire
```

### Table: users

```sql
id | auth_user_id | email            | role_id | is_active
---|--------------|------------------|---------|----------
1  | abc123       | user@mail.com    | 2       | true     ← "marie"
2  | def456       | pro@company.com  | 3       | true     ← "entreprise"
```

---

## ✅ AVANTAGES DU SYSTÈME

### 1. **Clarté**
- ✅ Pas de confusion sur quel formulaire utiliser
- ✅ URL explicites
- ✅ Pas de dropdown "Choisir votre rôle"

### 2. **UX Optimale**
- ✅ Formulaires adaptés à chaque type d'utilisateur
- ✅ Terminologie appropriée
- ✅ Champs spécifiques (ex: nom entreprise pour prestataires)

### 3. **Sécurité**
- ✅ Rôle attribué automatiquement (pas de manipulation)
- ✅ Pas de possibilité de s'auto-attribuer "admin"
- ✅ Séparation claire des espaces

### 4. **Marketing**
- ✅ "Studio Arooskena" = branding professionnel
- ✅ Peut avoir 2 stratégies marketing distinctes
- ✅ URL dédiée pour campagnes prestataires

### 5. **Maintenance**
- ✅ Code séparé et clair
- ✅ Facile de modifier un flux sans impacter l'autre
- ✅ Tests simplifiés

---

## 🧪 COMMENT TESTER

### Test 1: Inscription Utilisateur Classique

```bash
1. npm run dev
2. Aller sur http://localhost:3000
3. Cliquer "Inscription" (navbar)
4. Vérifier URL: /sign-up
5. Remplir formulaire
6. Soumettre
7. Vérifier BDD: role_id = "marie"
8. Vérifier redirection: /dashboard-wedding
```

---

### Test 2: Inscription Prestataire

```bash
1. npm run dev
2. Aller sur http://localhost:3000
3. Cliquer "Espace Prestataires" (navbar)
4. Vérifier URL: /Studio-Arooskena
5. Vérifier design: split-screen avec branding
6. Remplir formulaire (inclut nom entreprise)
7. Soumettre
8. Vérifier BDD: role_id = "entreprise"
9. Vérifier redirection: /dashboard-prestataire
```

---

### Test 3: Vérification BDD

```sql
-- Après inscriptions test
SELECT 
  u.email, 
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC
LIMIT 5;

-- Devrait montrer:
-- user@test.com    | marie      | true
-- pro@test.com     | entreprise | true
```

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux fichiers:

```
✅ app/Studio-Arooskena/page.tsx
   ↳ Page inscription prestataires avec rôle "entreprise"

✅ TWO_DOORS_SYSTEM.md
   ↳ Cette documentation
```

### Fichiers modifiés:

```
✅ components/Navbar.jsx
   ↳ "Espace Prestataires" → /Studio-Arooskena

✅ app/sign-up/page.tsx (existant)
   ↳ Assigne rôle "marie"
```

---

## 🎨 PERSONNALISATION FUTURE

### Pour ajouter un 3ème rôle (exemple: "photographe"):

1. **Créer la porte:**
```bash
app/Studio-Photo/page.tsx
```

2. **Modifier le rôle:**
```tsx
const { data: roleData } = await supabase
  .from('roles')
  .select('id')
  .eq('name', 'photographe')  // ← Nouveau rôle
  .single()
```

3. **Ajouter lien navbar:**
```tsx
<Link href="/Studio-Photo">Studio Photo</Link>
```

4. **Dashboard dédié:**
```bash
app/dashboard-photo/page.tsx
```

---

## 🔐 SÉCURITÉ

### Vérifications côté serveur:

**Important:** Toujours vérifier le rôle côté serveur!

```tsx
// Dans dashboard-prestataire
const { data: userData } = await supabase
  .from('users')
  .select('role_id, roles(name)')
  .eq('auth_user_id', user.id)
  .single()

if (userData.roles.name !== 'entreprise') {
  router.push('/dashboard-wedding') // Redirection
}
```

---

## 📊 ANALYTICS RECOMMANDÉES

### Tracker les inscriptions par porte:

```tsx
// Dans Studio-Arooskena
analytics.track('Signup Started', {
  door: 'studio-arooskena',
  role: 'entreprise'
})

// Dans sign-up
analytics.track('Signup Started', {
  door: 'sign-up',
  role: 'marie'
})
```

**Métriques à suivre:**
- Taux de conversion par porte
- Temps de complétion formulaire
- Abandon par étape
- Source de trafic (pour savoir comment les prestataires trouvent le Studio)

---

## 🎯 OBJECTIFS BUSINESS

### Utilisateurs classiques (/sign-up):
- Volume élevé
- Conversion rapide
- Simplicité maximale

### Prestataires (/Studio-Arooskena):
- Qualité > Quantité
- Professionnalisme
- Engagement long terme

**Le système à 2 portes permet d'optimiser chaque funnel séparément!**

---

## ✅ CHECKLIST DE VALIDATION

- [x] Page /sign-up crée rôle "marie"
- [x] Page /Studio-Arooskena crée rôle "entreprise"
- [x] Navbar pointe vers les bonnes URL
- [x] Design professionnel pour Studio
- [x] Formulaire adapté pour prestataires
- [ ] Tester création compte marie
- [ ] Tester création compte entreprise
- [ ] Vérifier redirections après login
- [ ] Vérifier accès aux dashboards selon rôle

---

## 🚀 PROCHAINES ÉTAPES

### Court terme:
1. Tester les 2 flux d'inscription
2. Vérifier les redirections
3. Ajuster le design si besoin

### Moyen terme:
1. Ajouter validation Zod
2. Ajouter email de bienvenue différencié
3. Analytics sur les inscriptions

### Long terme:
1. Onboarding spécifique par rôle
2. A/B testing sur formulaires
3. Programme parrainage prestataires

---

## 📝 NOTES IMPORTANTES

### ⚠️ Rôle "prestataire" vs "entreprise"

Dans votre demande vous avez mentionné le rôle "entreprise", mais votre base de données peut avoir "prestataire". **Assurez-vous que le nom du rôle dans le code correspond exactement à la BDD:**

```sql
-- Vérifier dans Supabase
SELECT * FROM roles WHERE name = 'entreprise';
-- OU
SELECT * FROM roles WHERE name = 'prestataire';
```

**Si le rôle s'appelle "prestataire" dans la BDD, modifier:**
```tsx
// Dans Studio-Arooskena/page.tsx ligne 52
.eq('name', 'prestataire')  // Au lieu de 'entreprise'
```

---

## 🎉 RÉSUMÉ

### Ce qui a été fait:
- ✅ **2 pages d'inscription distinctes**
- ✅ **Attribution automatique des rôles**
- ✅ **Design professionnel pour Studio**
- ✅ **Navigation navbar mise à jour**
- ✅ **Documentation complète**

### Résultat:
**Système clair et professionnel avec 2 portes d'entrée adaptées à chaque type d'utilisateur!**

---

**🚪🚪 Votre système à deux portes est prêt!**
