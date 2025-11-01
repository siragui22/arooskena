# 🧪 TEST STUDIO SETUP - PHASE 1

> Guide rapide pour tester le nouveau setup unifié du Studio Arooskena

---

## ✅ CE QUI EST IMPLÉMENTÉ (PHASE 1)

```
✅ Structure page /Studio-Arooskena/setup
✅ Header avec branding Studio cohérent
✅ Tabs pour switcher entre Prestataire/Lieu
✅ Routing intelligent avec query params
✅ Vérifications sécurité
✅ Design responsive
✅ Onboarding redirige vers nouveau setup
```

---

## 🚀 TEST RAPIDE (5 MINUTES)

### 1. Démarrer le serveur

```bash
npm run dev
```

### 2. Flow complet

```
http://localhost:3000
↓
Clic "Espace Prestataires"
↓
Remplir formulaire inscription:
  - Prénom: Test
  - Nom: Setup
  - Email: setup@studio.dj
  - Tel: +253 77 12 34 56
  - Pass: test1234
↓
Clic "Rejoindre le Studio"
↓
Page Onboarding (Choix)
↓
Clic "Créer annuaire prestataire"
↓
✅ Nouvelle page Studio Setup!
```

---

## 🎯 POINTS À VÉRIFIER

### Page /Studio-Arooskena/setup?type=prestataire

**Header:**
- [ ] Logo Studio avec icône Briefcase dans gradient pink-orange
- [ ] Titre "Studio Arooskena"
- [ ] Sous-titre "Configuration de votre annuaire"
- [ ] Bouton "← Retour" (redirection vers onboarding)
- [ ] Badge "Annuaire Prestataire" avec icône (desktop uniquement)

**Tabs:**
- [ ] Tab "Prestataire" active (gradient pink-orange)
- [ ] Tab "Lieu de Réception" inactive (gris)
- [ ] Hover sur tab inactif → fond gris plus foncé
- [ ] Icônes présentes (Briefcase et Building2)

**Info Box:**
- [ ] Box bleue avec icône Sparkles
- [ ] Message "Astuce: Vous pouvez créer les 2 types..."
- [ ] Border et background bleu clair

**Zone formulaire:**
- [ ] Card blanche avec shadow
- [ ] Icône Briefcase grande (16x16)
- [ ] Titre "Configuration Prestataire"
- [ ] Bouton temporaire vers /prestataires/setup

---

### Test Switch de Tab

```
1. Sur /Studio-Arooskena/setup?type=prestataire

2. Clic sur tab "Lieu de Réception"
   ✅ URL devient: ?type=lieu
   ✅ Tab "Lieu" devient active (gradient purple-blue)
   ✅ Tab "Prestataire" devient inactive
   ✅ Badge header change: "Annuaire Lieu de Réception"
   ✅ Contenu change: icône Building2
   ✅ Titre change: "Configuration Lieu de Réception"

3. Clic sur tab "Prestataire"
   ✅ Retour à l'état initial
```

---

### Test Navigation Retour

```
1. Sur /Studio-Arooskena/setup?type=prestataire

2. Clic bouton "← Retour"
   ✅ Redirection vers /Studio-Arooskena/onboarding
   ✅ Page onboarding s'affiche correctement
```

---

### Test Sécurité

**Test 1: Accès sans être connecté**
```
1. Se déconnecter
2. Aller sur /Studio-Arooskena/setup?type=prestataire
   ✅ Redirection vers /sign-in
```

**Test 2: Type invalide**
```
1. Connecté avec rôle entreprise
2. Aller sur /Studio-Arooskena/setup?type=invalid
   ✅ Redirection vers /Studio-Arooskena/onboarding
```

**Test 3: Sans paramètre type**
```
1. Connecté avec rôle entreprise
2. Aller sur /Studio-Arooskena/setup (sans ?type=...)
   ✅ Redirection vers /Studio-Arooskena/onboarding
```

---

### Test Responsive

**Mobile (< 640px):**
```
1. Ouvrir DevTools
2. Mode responsive, width 375px
   ✅ Badge type caché dans le header
   ✅ Tabs scrollables horizontalement
   ✅ Titre "Studio Arooskena" réduit si nécessaire
   ✅ Padding adapté
```

**Tablet (640px - 1024px):**
```
1. Width 768px
   ✅ Badge type visible
   ✅ Tabs côte à côte
   ✅ Layout équilibré
```

**Desktop (> 1024px):**
```
1. Width 1280px+
   ✅ Max-width 7xl appliqué
   ✅ Tous les éléments visibles
   ✅ Espacement généreux
```

---

## 🎨 VÉRIFICATION DESIGN

### Couleurs Prestataire:
```css
✅ Tab active: gradient from-pink-500 to-orange-400
✅ Badge header: bg-pink-100, text-pink-700
✅ Icône: text-pink-600
✅ Bouton temporaire: gradient pink-orange
```

### Couleurs Lieu:
```css
✅ Tab active: gradient from-purple-500 to-blue-400
✅ Badge header: bg-purple-100, text-purple-700
✅ Icône: text-purple-600
✅ Bouton temporaire: gradient purple-blue
```

### Couleurs Communes:
```css
✅ Background: bg-pink-50
✅ Header: bg-white border-b
✅ Cards: bg-white border-gray-200
✅ Tabs inactives: bg-gray-100 text-gray-600
✅ Info box: bg-blue-50 border-blue-200
```

---

## 📸 SCREENSHOTS ATTENDUS

### Vue Prestataire:

```
┌────────────────────────────────────────────────────┐
│ ← Retour  [🏢] Studio Arooskena  [Prestataire]     │
├────────────────────────────────────────────────────┤
│ [📋 Prestataire] [🏢 Lieu]                         │
│ (pink-orange)    (gris)                            │
├────────────────────────────────────────────────────┤
│                                                    │
│ 💡 Astuce: Vous pouvez créer les 2 types...       │
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │     📋 Briefcase (grande)                      ││
│ │     Configuration Prestataire                  ││
│ │     Le formulaire sera intégré ici             ││
│ │     [Continuer avec setup prestataire]         ││
│ └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

### Vue Lieu:

```
┌────────────────────────────────────────────────────┐
│ ← Retour  [🏢] Studio Arooskena  [Lieu]            │
├────────────────────────────────────────────────────┤
│ [📋 Prestataire] [🏢 Lieu]                         │
│ (gris)           (purple-blue)                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ 💡 Astuce: Vous pouvez créer les 2 types...       │
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │     🏢 Building2 (grande)                      ││
│ │     Configuration Lieu de Réception            ││
│ │     Le formulaire sera intégré ici             ││
│ │     [Continuer avec setup lieu]                ││
│ └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE PHASE 1

### Structure:
- [ ] Page /Studio-Arooskena/setup existe
- [ ] Détection query param ?type=prestataire|lieu
- [ ] Redirection si type invalide

### UI:
- [ ] Header Studio cohérent
- [ ] Tabs fonctionnels
- [ ] Switch entre types OK
- [ ] Info box affichée
- [ ] Composants temporaires affichés

### Navigation:
- [ ] Onboarding redirige vers setup
- [ ] Bouton retour fonctionne
- [ ] URLs propres

### Sécurité:
- [ ] Accès refusé si non connecté
- [ ] Vérification rôle entreprise
- [ ] Redirections appropriées

### Design:
- [ ] Branding Studio cohérent
- [ ] Couleurs correctes selon type
- [ ] Responsive mobile/tablet/desktop
- [ ] Animations smooth

---

## 🐛 BUGS POTENTIELS À SURVEILLER

### Bug 1: Type ne change pas au switch
**Symptôme:** Clic sur tab mais contenu ne change pas  
**Vérifier:** URL change bien, console logs, state update

### Bug 2: Redirection infinie
**Symptôme:** Page recharge constamment  
**Vérifier:** Conditions de vérification, useEffect dependencies

### Bug 3: Badge type pas affiché
**Symptôme:** Badge manquant sur desktop  
**Vérifier:** Classes responsive (hidden sm:flex), breakpoints

---

## 📝 NOTES DE TEST

### Test effectué le: ___________

**Environnement:**
- Node version: _______
- Browser: _______
- Screen size: _______

**Résultats:**

| Test | Status | Notes |
|------|--------|-------|
| Header affiché | ☐ Pass ☐ Fail | |
| Tabs fonctionnels | ☐ Pass ☐ Fail | |
| Switch type OK | ☐ Pass ☐ Fail | |
| Navigation retour | ☐ Pass ☐ Fail | |
| Sécurité | ☐ Pass ☐ Fail | |
| Responsive | ☐ Pass ☐ Fail | |
| Design cohérent | ☐ Pass ☐ Fail | |

**Bugs trouvés:**
1. ___________________________________
2. ___________________________________
3. ___________________________________

---

## 🎉 SI TOUT FONCTIONNE

**✅ Phase 1 validée!**

**Vous devriez voir:**
- Flow complet d'inscription jusqu'au setup
- Page setup avec branding Studio cohérent
- Possibilité de switcher entre Prestataire et Lieu
- Design responsive et moderne
- Boutons temporaires qui redirigent vers anciens setups

**Prochaine étape:**
- Phase 2: Intégrer les formulaires complets
- Remplacer les composants temporaires par vrais formulaires
- Upload d'images
- Sauvegarde des annuaires

---

**🎯 Testez maintenant la Phase 1 Chef!**

**Tout devrait fonctionner parfaitement pour la structure de base!** ✨
