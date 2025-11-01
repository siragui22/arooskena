# 🧪 GUIDE DE TEST RAPIDE - STUDIO AROOSKENA

> Guide pas-à-pas pour tester le nouveau processus d'inscription en 2 étapes

---

## ⚡ TEST RAPIDE (5 minutes)

### 1. Démarrer le serveur
```bash
npm run dev
```

### 2. Aller sur la homepage
```
http://localhost:3000
```

### 3. Cliquer "Espace Prestataires"
- Vérifier que vous êtes redirigé vers `/Studio-Arooskena`
- Vérifier le design professionnel (split-screen)

### 4. Remplir formulaire:
   - Prénom: Test
   - Nom: Studio
   - Email: test@studio.dj
   - Tel: +253 77 12 34 56
   - Pass: test1234
   
   **Note:** Le nom de l'entreprise sera demandé à l'étape 2 (setup)!

### 5. Cliquer "Rejoindre le Studio"
- Message: " Bienvenue dans le Studio Arooskena !"
- Redirection vers `/Studio-Arooskena/onboarding`
- ✅ Redirection vers `/Studio-Arooskena/onboarding`

### 6. Page Onboarding - Vérifier le contenu
```
✅ Header "Bienvenue Test !"
✅ 2 cards côte à côte
✅ Card gauche: "Annuaire Prestataire" (badge Populaire)
✅ Card droite: "Annuaire Lieu de Réception"
✅ Icônes: Briefcase et Building2
✅ Boutons gradients (pink et purple)
```

### 7. Choisir "Créer annuaire prestataire"
- ✅ Redirection vers `/prestataires/setup`
- ✅ Formulaire multi-étapes visible
- ✅ Étape 1: Informations de base

### 8. Vérifier la BDD
```sql
SELECT 
  u.email,
  r.name as role_name,
  p.first_name,
  p.last_name
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'test@studio.dj';
```

**Résultat attendu:**
```
email: test@studio.dj
role_name: entreprise ← IMPORTANT: Doit être "entreprise"!
first_name: Test
last_name: Studio
```

### 9. Vérifier les logs console
Pendant l'inscription, la console devrait afficher:
```
✅ Création nouveau utilisateur avec rôle entreprise
✅ Utilisateur créé avec rôle entreprise
🎉 Bienvenue dans le Studio Arooskena !
```

OU si l'utilisateur existait déjà:
```
✅ Utilisateur existant trouvé, mise à jour du rôle vers entreprise
✅ Rôle mis à jour vers entreprise
🎉 Bienvenue dans le Studio Arooskena !
```

---

## 🎯 POINTS CLÉS À VÉRIFIER

### Page Studio-Arooskena (Inscription)
- [ ] Design split-screen
- [ ] Gradient rose-orange à gauche
- [ ] Liste des avantages affichée
- [ ] Formulaire SANS "Nom de l'entreprise" (sera dans setup)
- [ ] Bouton "Rejoindre le Studio" avec icône
- [ ] Loading spinner pendant inscription

### Page Onboarding (Choix)
- [ ] Header avec nom utilisateur
- [ ] Badge "Dernière étape"
- [ ] 2 cards responsives (stack sur mobile)
- [ ] Card Prestataire avec badge "Populaire"
- [ ] Features (✅) affichées pour chaque option
- [ ] Boutons avec animations hover
- [ ] Info box en bas

### Redirections
- [ ] Navbar "Espace Prestataires" → `/Studio-Arooskena` ✅
- [ ] Après inscription → `/Studio-Arooskena/onboarding` ✅
- [ ] Choix Prestataire → `/prestataires/setup` ✅
- [ ] Choix Lieu → `/receptions/setup` ✅

### Sécurité
- [ ] Si pas connecté → redirection `/sign-in`
- [ ] Si pas rôle "entreprise" → redirection `/dashboard`
- [ ] Si annuaire existe → redirection vers annuaire

---

## 🐛 ERREURS POSSIBLES

### Erreur: "Le rôle entreprise n'existe pas"

**Solution:**
```sql
-- Vérifier les rôles
SELECT * FROM roles;

-- Créer le rôle si manquant
INSERT INTO roles (name, label) 
VALUES ('entreprise', 'Entreprise');
```

### Erreur: Redirection vers `/dashboard` au lieu de `/onboarding`

**Vérifier:**
```tsx
// Dans Studio-Arooskena/page.tsx ligne 114
router.push('/Studio-Arooskena/onboarding')
// PAS router.push('/dashboard-prestataire')
```

### Erreur: "Vous n'êtes pas autorisé" sur `/prestataires/setup`

**Vérifier:**
```tsx
// Dans prestataires/setup/page.jsx ligne 117
!['entreprise', 'prestataire', 'admin'].includes(userData.roles?.name)
// Doit inclure 'entreprise'
```

---

## 📸 SCREENSHOTS ATTENDUS

### 1. Studio-Arooskena (Inscription)
```
┌──────────────────────────────────────┐
│  🏢 Studio Arooskena  │  Formulaire  │
│  Gradient             │  Inscription │
│  rose-orange          │              │
│  ✅ Vitrine           │  [Nom]       │
│  ✅ Demandes          │  [Email]     │
│  ✅ Stats             │  [...]       │
│                       │  [Rejoindre] │
└──────────────────────────────────────┘
```

### 2. Onboarding (Choix)
```
┌────────────────────────────────────────┐
│  Header: Bienvenue Test !              │
│  🌟 Dernière étape                     │
│  Créez votre annuaire                  │
│                                        │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ 📋 POPULAIRE │  │ 🏢 Lieu      │   │
│  │ Prestataire  │  │ Réception    │   │
│  │ Pink gradient│  │ Purple grad  │   │
│  └──────────────┘  └──────────────┘   │
└────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE

Avant de dire que ça marche:

- [ ] Inscription fonctionne sans erreur
- [ ] Rôle "entreprise" bien attribué en BDD
- [ ] Redirection vers onboarding automatique
- [ ] Page onboarding affiche les 2 options
- [ ] Clic "Prestataire" → Setup prestataire
- [ ] Clic "Lieu" → Setup lieu
- [ ] Design cohérent avec Arooskena
- [ ] Responsive mobile OK
- [ ] Aucune erreur console

---

## 🚀 SI TOUT FONCTIONNE

**Vous avez maintenant:**
- ✅ Système d'inscription professionnel en 2 étapes
- ✅ Séparation claire compte / annuaire
- ✅ Flexibilité (possibilité de créer 2 annuaires)
- ✅ Design moderne et engageant
- ✅ Processus guidé et intuitif

**Prochaine étape:**
Tester la création complète d'un annuaire prestataire ou lieu!

---

**🎯 Bon test Chef!**
