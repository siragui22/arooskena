# 🎯 PROCESSUS D'ONBOARDING STUDIO AROOSKENA (2 ÉTAPES)

> **Concept:** Inscription utilisateur PUIS choix du type d'annuaire  
> **Date:** Octobre 2025  
> **Status:** ✅ Implémenté

---

## 📋 PROCESSUS COMPLET EN 2 ÉTAPES

### ✅ ÉTAPE 1: Inscription Utilisateur (Account Creation)

**URL:** `/Studio-Arooskena`

**Action:**
- Création compte dans table `users`
- Rôle attribué: `entreprise`
- Création profil dans table `profiles`

**Champs collectés:**
- Prénom → `profiles.first_name`
- Nom → `profiles.last_name`
- Email professionnel → `users.email`
- Téléphone → `users.phone`
- Mot de passe → `auth.users`

**Note:** Le nom de l'entreprise sera collecté à l'étape 2 (setup)!

**Redirection après inscription:**
```
→ /Studio-Arooskena/onboarding
```

---

### ✅ ÉTAPE 2: Choix du Type d'Annuaire

**URL:** `/Studio-Arooskena/onboarding`

**Options proposées:**

#### 🎨 Option A: Annuaire Prestataire
```
Icône: Briefcase
Badge: "Populaire"
Description: Pour les professionnels qui offrent des services
Exemples: Photographes, DJ, Traiteurs, Décorateurs
Redirection: /prestataires/setup
```

#### 🏢 Option B: Annuaire Lieu de Réception
```
Icône: Building2
Description: Pour les établissements qui accueillent des événements
Exemples: Salles de fête, Hôtels, Restaurants
Redirection: /receptions/setup
```

---

## 🔄 FLUX UTILISATEUR COMPLET

```
┌─────────────────────────────────────────────────────────┐
│  1. Utilisateur clique "Espace Prestataires" (navbar)  │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│  2. Page /Studio-Arooskena (Inscription)                │
│     - Formulaire inscription entreprise                 │
│     - Rôle "entreprise" attribué automatiquement        │
│     - Compte créé dans table users                      │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│  3. Redirection → /Studio-Arooskena/onboarding          │
│     Message: "🎉 Bienvenue dans le Studio Arooskena !"  │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│  4. Page de choix (Onboarding)                          │
│     ┌─────────────────┬─────────────────┐              │
│     │  Prestataire    │  Lieu Réception │              │
│     │  (Briefcase)    │  (Building2)    │              │
│     └────────┬────────┴────────┬────────┘              │
│              ↓                  ↓                        │
│     /prestataires/setup  /receptions/setup              │
└─────────────────────────────────────────────────────────┘
                   ↓                  ↓
┌──────────────────────────────────────────────────────┐
│  5. Setup Annuaire (Multi-étapes)                    │
│     - Informations entreprise                        │
│     - Contact et localisation                        │
│     - Tarifs et services                             │
│     - Upload photos                                  │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│  6. Annuaire créé et publié!                         │
│     Redirection vers annuaire ou dashboard           │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 DESIGN PAGE ONBOARDING

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: [Logo Studio] Bienvenue {firstname}!  [Retour] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     🌟 Dernière étape                                   │
│     Créez votre annuaire professionnel                  │
│     Choisissez le type qui correspond à votre activité  │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  📋 POPULAIRE        │  │                     │      │
│  │  Annuaire Prestataire│  │ Annuaire Lieu       │      │
│  │                      │  │                     │      │
│  │  ✅ Photographes...  │  │ ✅ Salles de fête...│      │
│  │  ✅ Vitrine portfolio│  │ ✅ Galerie photos   │      │
│  │  ✅ Demandes devis   │  │ ✅ Tarifs/personne  │      │
│  │  ✅ Stats & avis     │  │ ✅ Disponibilités   │      │
│  │                      │  │                     │      │
│  │  [Créer annuaire →] │  │ [Créer annuaire →]  │      │
│  │  Gradient pink       │  │ Gradient purple     │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
│  💡 Info: Vous pouvez créer les 2 types d'annuaires    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Couleurs

**Card Prestataire:**
- Icon background: `from-purple-100 to-pink-100`
- Icon: `text-pink-600`
- Button: `from-pink-500 to-orange-400`
- Badge "Populaire": `from-pink-400 to-orange-300`

**Card Lieu:**
- Icon background: `from-blue-100 to-purple-100`
- Icon: `text-purple-600`
- Button: `from-purple-500 to-blue-400`

---

## 🔐 VÉRIFICATIONS DE SÉCURITÉ

### Page `/Studio-Arooskena/onboarding`

```tsx
// Vérifications effectuées:
1. ✅ Utilisateur connecté
2. ✅ Rôle = "entreprise"
3. ✅ Pas d'annuaire prestataire existant
4. ✅ Pas d'annuaire lieu existant

// Si déjà un annuaire:
→ Redirection vers /prestataires ou /receptions
```

### Page `/prestataires/setup`

```tsx
// Rôles acceptés:
- ✅ entreprise
- ✅ prestataire (legacy)
- ✅ admin

// Vérification:
if (!['entreprise', 'prestataire', 'admin'].includes(role)) {
  redirect('/dashboard')
}
```

### Page `/receptions/setup`

```tsx
// Rôles acceptés:
- ✅ entreprise
- ✅ prestataire
- ✅ admin

// Déjà configuré dans le code existant
```

---

## 📊 TABLES DE BASE DE DONNÉES

### Table: users (Étape 1)

```sql
id          | uuid (PK)
auth_user_id| uuid (FK → auth.users)
email       | text UNIQUE
phone       | text UNIQUE
role_id     | uuid (FK → roles) ← "entreprise"
is_active   | boolean (default: true)
created_at  | timestamp
```

### Table: profiles (Étape 1)

```sql
id         | uuid (PK)
user_id    | uuid (FK → users)
first_name | text
last_name  | text
slug       | text UNIQUE
```

### Table: prestataires (Étape 2 - Option A)

```sql
id               | uuid (PK)
user_id          | uuid (FK → users)
nom_entreprise   | text
description      | text
categorie_id     | uuid (FK)
subcategorie_id  | uuid (FK)
telephone_fixe   | text
whatsapp         | text
email            | text
prix_min         | numeric
prix_max         | numeric
is_verified      | boolean
...
```

### Table: lieux_reception (Étape 2 - Option B)

```sql
id              | uuid (PK)
user_id         | uuid (FK → users)
nom_lieu        | text
description     | text
type_lieu_id    | uuid (FK)
capacite_min    | integer
capacite_max    | integer
prix_min        | numeric
prix_max        | numeric
prix_par_personne| numeric
...
```

---

## 🎯 AVANTAGES DU PROCESSUS EN 2 ÉTAPES

### 1. **Séparation des responsabilités**
- ✅ Étape 1: Création compte utilisateur (simple, rapide)
- ✅ Étape 2: Configuration annuaire (détaillée, spécialisée)

### 2. **Flexibilité**
- ✅ L'utilisateur peut créer les 2 types d'annuaires
- ✅ Processus non bloquant
- ✅ Peut revenir plus tard pour créer le 2ème annuaire

### 3. **UX Optimale**
- ✅ Choix clair et visuel
- ✅ Descriptions détaillées
- ✅ Badges et icônes explicites
- ✅ Design cohérent Arooskena

### 4. **Conversion**
- ✅ Inscription rapide (pas de découragement)
- ✅ Engagement progressif
- ✅ Choix guidé après inscription

---

## 🧪 COMMENT TESTER

### Test Complet du Flux

```bash
1. npm run dev

2. Aller sur http://localhost:3000

3. Cliquer "Espace Prestataires" (navbar)
   → URL: /Studio-Arooskena
   
4. Remplir formulaire inscription:
   - Prénom: Test
   - Nom: Entreprise
   - Entreprise: Ma Belle Boîte
   - Email: test@studio.com
   - Téléphone: +253 77 12 34 56
   - Password: test12345

5. Cliquer "Rejoindre le Studio"
   → Message: "🎉 Bienvenue dans le Studio Arooskena !"
   → Redirection: /Studio-Arooskena/onboarding

6. Page Onboarding:
   ✅ Voir header "Bienvenue Test !"
   ✅ Voir 2 cards (Prestataire + Lieu)
   ✅ Badge "Populaire" sur Prestataire
   ✅ Icônes et couleurs distinctes

7. Cliquer "Créer annuaire prestataire"
   → Redirection: /prestataires/setup
   → Formulaire multi-étapes visible

8. Ou revenir et cliquer "Créer annuaire lieu"
   → Redirection: /receptions/setup
   → Formulaire multi-étapes visible
```

### Vérification BDD

```sql
-- Après inscription (Étape 1)
SELECT 
  u.email,
  r.name as role_name,
  p.first_name,
  p.last_name
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'test@studio.com';

-- Résultat attendu:
-- test@studio.com | entreprise | Test | Entreprise


-- Après création annuaire prestataire (Étape 2A)
SELECT 
  pr.nom_entreprise,
  u.email,
  r.name as user_role
FROM prestataires pr
JOIN users u ON pr.user_id = u.id
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'test@studio.com';

-- Résultat attendu:
-- Ma Belle Boîte | test@studio.com | entreprise


-- OU après création lieu réception (Étape 2B)
SELECT 
  lr.nom_lieu,
  u.email,
  r.name as user_role
FROM lieux_reception lr
JOIN users u ON lr.user_id = u.id
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'test@studio.com';
```

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux fichiers:

```
✅ app/Studio-Arooskena/onboarding/page.tsx
   ↳ Page de choix du type d'annuaire
   ↳ Design moderne avec 2 cards
   ↳ Vérifications sécurité intégrées
```

### Fichiers modifiés:

```
✅ app/Studio-Arooskena/page.tsx
   ↳ Ligne 114: Redirection vers /Studio-Arooskena/onboarding
   ↳ Au lieu de /dashboard-prestataire

✅ app/prestataires/setup/page.jsx
   ↳ Ligne 117: Accepte rôle "entreprise"
   ↳ Avant: only "prestataire"
   ↳ Après: ['entreprise', 'prestataire', 'admin']

✅ app/receptions/setup/page.jsx
   ↳ Ligne 122: Déjà configuré pour "entreprise"
   ↳ Aucune modification nécessaire ✅
```

### Documentation:

```
✅ STUDIO_ONBOARDING_PROCESS.md (ce fichier)
   ↳ Documentation complète du processus
```

---

## 🎯 SCÉNARIOS D'UTILISATION

### Scénario 1: Photographe uniquement

```
1. Inscription → Rôle: entreprise
2. Onboarding → Choisit "Prestataire"
3. Setup → Catégorie: Photographie
4. Annuaire prestataire créé ✅
```

### Scénario 2: Salle de fête uniquement

```
1. Inscription → Rôle: entreprise
2. Onboarding → Choisit "Lieu de Réception"
3. Setup → Type: Salle de fête
4. Annuaire lieu créé ✅
```

### Scénario 3: Restaurant avec service traiteur

```
1. Inscription → Rôle: entreprise
2. Onboarding → Choisit "Lieu de Réception"
3. Setup lieu → Restaurant créé ✅
4. Plus tard, depuis dashboard:
   → Créer aussi annuaire prestataire (Traiteur)
5. 2 annuaires pour la même entreprise ✅
```

---

## 🔄 CRÉER UN 2ÈME ANNUAIRE (Future Feature)

**Depuis le dashboard prestataire/lieu**, ajouter un bouton:

```tsx
<Link href="/Studio-Arooskena/onboarding">
  + Créer un autre annuaire
</Link>
```

**La page onboarding détectera:**
- Si annuaire prestataire existe → Proposer uniquement Lieu
- Si annuaire lieu existe → Proposer uniquement Prestataire
- Si les 2 existent → Message "Tous vos annuaires sont créés"

---

## ✅ CHECKLIST DE VALIDATION

- [x] Page Studio-Arooskena créée (inscription)
- [x] Rôle "entreprise" attribué automatiquement
- [x] Page onboarding créée (choix annuaire)
- [x] Design moderne et responsive
- [x] Prestataires/setup accepte rôle "entreprise"
- [x] Receptions/setup accepte rôle "entreprise"
- [x] Redirections correctes
- [x] Vérifications sécurité en place
- [ ] Tests inscription réels
- [ ] Tests création annuaire prestataire
- [ ] Tests création annuaire lieu
- [ ] Vérification BDD après création

---

## 🚀 PROCHAINES ÉTAPES

### Court terme:
1. ✅ Tester le flux complet
2. ✅ Vérifier les tables BDD
3. ✅ S'assurer que les setup fonctionnent

### Moyen terme:
1. Ajouter analytics sur les choix
2. Email de bienvenue après choix annuaire
3. Onboarding tutorial dans le setup

### Long terme:
1. Permettre création 2ème annuaire depuis dashboard
2. Migration des comptes "prestataire" → "entreprise"
3. Dashboard unifié pour gérer les 2 annuaires

---

## 📊 MÉTRIQUES À SUIVRE

### Conversion:
- % d'utilisateurs qui choisissent Prestataire vs Lieu
- % d'utilisateurs qui complètent le setup
- Temps moyen pour finaliser l'annuaire

### Engagement:
- % d'utilisateurs avec 2 annuaires
- Taux d'abandon par étape du setup

---

## 🎉 RÉSUMÉ

### ✅ Processus en 2 étapes implémenté:
1. **Inscription compte** (rôle entreprise)
2. **Choix annuaire** (prestataire OU lieu)

### ✅ Avantages:
- Inscription rapide et simple
- Choix guidé et visuel
- Flexibilité (2 annuaires possibles)
- Design cohérent Arooskena

### ✅ Fichiers:
- 1 nouveau: onboarding page
- 2 modifiés: Studio-Arooskena + prestataires/setup
- 1 OK: receptions/setup (déjà compatible)

---

**🎯 Le processus d'onboarding en 2 étapes est prêt!**

**Testez maintenant le flux complet Chef!** 🚀
