# 📋 TODO COMPLET - OPTIMISATION AROOSKENA

> **Status**: Phase 1 en cours | Phase 2 à venir
> **Dernière mise à jour**: Octobre 2025

---

## 🎯 OBJECTIF GLOBAL

- ⚡ **Réduire de 60-70%** les requêtes API
- ⚡ **Navigation instantanée** entre les pages (0ms avec cache)
- 🔒 **Renforcer la sécurité** à tous les niveaux
- 🚀 **Améliorer l'expérience utilisateur**

---

## ✅ PHASE 1: PERFORMANCE (EN COURS)

### ÉTAPE 1.1: Installation ✅ FAIT
- [x] `npm install zustand @tanstack/react-query zod lru-cache dompurify`
- [x] Dépendances TypeScript installées

### ÉTAPE 1.2: Architecture Stores ✅ FAIT
- [x] `stores/useAuthStore.ts` - Store auth centralisé
- [x] `stores/useWeddingStore.ts` - Store wedding avec cache
- [x] `stores/usePrestatairesStore.ts` - Store prestataires

### ÉTAPE 1.3: Configuration React Query ✅ FAIT
- [x] `lib/react-query.ts` - Config + query keys
- [x] `components/providers/QueryProvider.tsx` - Provider
- [x] Layout mis à jour avec QueryProvider

### ÉTAPE 1.4: Hooks Personnalisés ✅ FAIT
- [x] `hooks/useWedding.ts` - Hook complet pour wedding data
- [x] Mutations: useAddExpense, useDeleteExpense
- [x] Mutations: useAddTask, useUpdateTask, useDeleteTask

### ÉTAPE 1.5: Migration Pages Dashboard Wedding 🔄 EN COURS

#### 1.5.1: dashboard-wedding/page.tsx 🔜 PRIORITÉ 1
**Fichier**: `app/dashboard-wedding/page.tsx`

**Actions à faire**:
```tsx
// AVANT (lignes 3-21)
import { useState, useEffect } from 'react';
const [loading, setLoading] = useState(true);
const [user, setUser] = useState(null);
const [wedding, setWedding] = useState(null);
const [budgetCategories, setBudgetCategories] = useState([]);
const [tasks, setTasks] = useState([]);
const [expenses, setExpenses] = useState([]);

// APRÈS (remplacer par)
import { useWeddingData } from '@/hooks/useWedding';
import { useAuthStore } from '@/stores/useAuthStore';

const { wedding, budgetCategories, tasks, expenses, isLoading } = useWeddingData();
const user = useAuthStore((state) => state.user);
```

**Changements**:
- [ ] Remplacer imports useState/useEffect par hooks
- [ ] Supprimer tout le useEffect (lignes 23-97)
- [ ] Utiliser `isLoading` au lieu de `loading`
- [ ] Tester la page
- [ ] Vérifier que le cache fonctionne (voir console)

**Gains attendus**: -1 seconde de chargement, 0ms navigation

---

#### 1.5.2: dashboard-wedding/budget/page.tsx 🔜 PRIORITÉ 2
**Fichier**: `app/dashboard-wedding/budget/page.tsx`

**Actions à faire**:
```tsx
// AVANT
const [loading, setLoading] = useState(true);
const [wedding, setWedding] = useState(null);
const [budgetCategories, setBudgetCategories] = useState([]);
const [expenses, setExpenses] = useState([]);

// APRÈS
import { useWeddingData, useAddExpense, useDeleteExpense } from '@/hooks/useWedding';

const { wedding, budgetCategories, expenses, isLoading } = useWeddingData();
const addExpenseMutation = useAddExpense();
const deleteExpenseMutation = useDeleteExpense();
```

**Changements**:
- [ ] Remplacer useState par hooks
- [ ] Supprimer `fetchBudgetData()` (lignes 44-88)
- [ ] Remplacer `handleAddExpense` avec `addExpenseMutation.mutateAsync()`
- [ ] Remplacer `handleDeleteExpense` avec `deleteExpenseMutation.mutateAsync()`
- [ ] Tester ajout/suppression
- [ ] Vérifier optimistic updates

**Gains**: Plus de duplications, UI instantanée

---

#### 1.5.3: dashboard-wedding/tasks/page.tsx 🔜 PRIORITÉ 3
**Actions similaires à budget/page.tsx**:
- [ ] Utiliser `useWeddingData()`
- [ ] Utiliser `useAddTask()`, `useUpdateTask()`, `useDeleteTask()`
- [ ] Supprimer les fetches manuels

---

#### 1.5.4: dashboard-wedding/profile/page.tsx ⏳
**Note**: Moins de duplication ici, mais:
- [ ] Créer `useProfile()` hook si nécessaire
- [ ] Optimiser upload avatar

---

#### 1.5.5: dashboard-wedding/inspirations/page.tsx ⏳
**À faire**:
- [ ] Créer `hooks/useInspirations.ts`
- [ ] Créer mutations pour add/delete/update
- [ ] Migrer la page

---

#### 1.5.6: dashboard-wedding/timeline/page.tsx ⏳
**À faire**:
- [ ] Créer `hooks/useTimeline.ts`
- [ ] Gérer les milestones
- [ ] Migrer la page

---

### ÉTAPE 1.6: Migration Pages Admin ⏳

#### admin/page.jsx
- [ ] Créer `hooks/useAdminStats.ts`
- [ ] Créer `hooks/useAdminUsers.ts`
- [ ] Migrer les fetches

---

### ÉTAPE 1.7: Migration Pages Publiques ⏳

#### prestataires/page.jsx
- [ ] Utiliser `usePrestatairesStore`
- [ ] Créer `hooks/usePrestataires.ts` si nécessaire

#### reception/page.jsx
- [ ] Utiliser `usePrestatairesStore`
- [ ] Créer `hooks/useLieuxReception.ts`

---

## 🔒 PHASE 2: SÉCURITÉ (À VENIR)

### ÉTAPE 2.1: Validation Zod ⏳
**Fichiers à créer**:
- [ ] `lib/validations/wedding.ts`
- [ ] `lib/validations/user.ts`
- [ ] `lib/validations/prestataire.ts`
- [ ] `lib/validations/admin.ts`

**Tester**: Tous les schémas de validation

---

### ÉTAPE 2.2: API Routes Sécurisées ⏳

**Structure à créer**:
```
app/api/
├── wedding/
│   ├── route.ts
│   ├── expenses/route.ts
│   └── tasks/route.ts
├── prestataires/
│   └── route.ts
└── admin/
    └── users/route.ts
```

**Pour chaque route**:
- [ ] Authentification
- [ ] Validation Zod
- [ ] Vérification ownership
- [ ] Rate limiting
- [ ] Error handling

**Tester**: Chaque endpoint avec Postman/Thunder Client

---

### ÉTAPE 2.3: Rate Limiting ⏳
- [ ] Créer `lib/rate-limit.ts`
- [ ] Intégrer au middleware
- [ ] Tester avec 100 requêtes rapides

---

### ÉTAPE 2.4: Middleware Amélioré ⏳
**Fichier**: `middleware.ts`

**À ajouter**:
- [ ] Rate limiting global
- [ ] Vérification de rôles pour /admin
- [ ] Vérification de rôles pour /dashboard-prestataire
- [ ] Logs des accès

**Tester**:
- [ ] Accès /admin sans être admin
- [ ] Accès /dashboard-wedding sans auth
- [ ] Rate limit atteint

---

### ÉTAPE 2.5: Headers de Sécurité ⏳
**Fichier**: `next.config.mjs`

- [ ] Ajouter CSP
- [ ] Ajouter HSTS
- [ ] Ajouter X-Frame-Options
- [ ] Ajouter X-Content-Type-Options

**Vérifier**: https://securityheaders.com/

---

### ÉTAPE 2.6: Sanitization ⏳
- [ ] Créer `lib/sanitize.ts`
- [ ] Appliquer sur tous les inputs texte
- [ ] Appliquer sur les descriptions HTML

---

### ÉTAPE 2.7: Upload Sécurisé ⏳
- [ ] Créer `lib/upload-security.ts`
- [ ] Valider types MIME
- [ ] Vérifier taille fichiers
- [ ] Générer noms sécurisés

**Tester**:
- [ ] Upload .exe renommé en .jpg (doit échouer)
- [ ] Upload > 5MB (doit échouer)

---

### ÉTAPE 2.8: RLS Supabase ⏳
**Base de données**:
- [ ] Vérifier policies sur `weddings`
- [ ] Vérifier policies sur `wedding_expenses`
- [ ] Vérifier policies sur `wedding_tasks`
- [ ] Vérifier policies sur `users`
- [ ] Vérifier policies sur `profiles`
- [ ] Vérifier policies sur `prestataires`

**Tester**: Essayer d'accéder aux données d'un autre user

---

## 📊 INDICATEURS DE SUCCÈS

### Performance
- [ ] Dashboard wedding charge en < 500ms
- [ ] Navigation entre pages en < 50ms (cache hit)
- [ ] Réduction de 60% des requêtes API
- [ ] Score Lighthouse > 90

### Sécurité
- [ ] Aucune faille OWASP Top 10
- [ ] Rate limiting fonctionnel
- [ ] Toutes les données validées
- [ ] RLS Supabase testé et validé
- [ ] Headers sécurité A+ sur securityheaders.com

---

## 🧪 TESTS À EFFECTUER

### Tests Performance
- [ ] Test avec React Query DevTools
- [ ] Test avec Network tab (Chrome)
- [ ] Test cache Zustand (localStorage)
- [ ] Test navigation rapide entre pages

### Tests Sécurité
- [ ] Test SQL injection sur inputs
- [ ] Test XSS sur inputs texte
- [ ] Test CSRF avec requêtes externes
- [ ] Test rate limiting (100 requêtes/min)
- [ ] Test authorization (accès autres users)
- [ ] Test upload fichiers malveillants

### Tests Utilisateur
- [ ] Test ajout dépense (optimistic update)
- [ ] Test suppression tâche (optimistic update)
- [ ] Test navigation rapide
- [ ] Test refresh page (cache persiste)

---

## 📝 NOTES IMPORTANTES

### Ordre de Priorité
1. **CRITIQUE**: Dashboard wedding pages (duplications massives)
2. **HAUTE**: Sécurité API routes
3. **MOYENNE**: Pages admin
4. **BASSE**: Pages publiques (moins de problèmes)

### Backup Avant Migration
```bash
# Créer une branche pour chaque étape
git checkout -b feat/optimize-dashboard-main
git checkout -b feat/optimize-dashboard-budget
# etc.
```

### Rollback si Problème
```bash
# Revenir à l'ancienne version
git checkout main
```

---

## 📚 DOCUMENTATION

- **Guide complet**: Voir `OPTIMIZATION_GUIDE.md`
- **Sécurité détaillée**: Voir `SECURITY_TODO.md`
- **Exemples de code**: Voir les hooks dans `hooks/`

---

## ✅ CHECKLIST FINALE

Avant de marquer le projet comme terminé:

### Performance
- [ ] Toutes les pages dashboard-wedding migrées
- [ ] Cache fonctionne partout
- [ ] Aucune duplication de requête
- [ ] DevTools React Query propre

### Sécurité
- [ ] Toutes les validations en place
- [ ] Toutes les API routes créées
- [ ] Rate limiting actif
- [ ] Headers sécurité configurés
- [ ] RLS Supabase vérifié

### Tests
- [ ] Tests performance passent
- [ ] Tests sécurité passent
- [ ] Tests utilisateur passent

### Documentation
- [ ] README mis à jour
- [ ] Guides à jour
- [ ] Commentaires dans le code

---

**🚀 Let's ship it! | ⚡ Performance | 🔒 Sécurité**
