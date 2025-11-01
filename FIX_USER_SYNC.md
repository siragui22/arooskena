# 🔧 FIX: Synchronisation User avec AuthStore

> **Problème:** L'utilisateur connecté voit "Créez votre premier mariage" alors qu'il a déjà un mariage  
> **Cause:** Le store Zustand n'était pas synchronisé avec AuthContext  
> **Solution:** Ajout d'un AuthSyncProvider

---

## 🐛 LE PROBLÈME

### Ce qui se passait:

```
1. Utilisateur se connecte ✅
2. AuthContext charge les données ✅
3. Mais AuthStore reste vide ❌
4. useWeddingData() utilise AuthStore (vide) ❌
5. Requête: weddings WHERE user_id = null ❌
6. Résultat: Aucun wedding trouvé ❌
7. Affichage: "Créez votre premier mariage" ❌
```

### Schéma du bug:

```
AuthContext (✅ a les données)
     ↓
     X  (Pas de synchronisation)
     ↓
AuthStore Zustand (❌ vide)
     ↓
useWeddingData()
     ↓
Requête avec user.id = undefined
     ↓
Aucun résultat
```

---

## ✅ LA SOLUTION

### Fichiers créés:

1. **`components/providers/AuthSyncProvider.tsx`**
   - Synchronise AuthContext → AuthStore
   - S'exécute automatiquement au chargement
   - Met à jour le store quand l'auth change

2. **`hooks/useAuthSync.ts`**
   - Hook helper (optionnel)

3. **`app/layout.jsx`** (modifié)
   - Ajout du AuthSyncProvider dans la hiérarchie

### Hiérarchie des providers (NOUVELLE):

```jsx
<QueryProvider>
  <AuthProvider>           // ← Charge les données depuis Supabase
    <AuthSyncProvider>     // ← Synchronise vers Zustand Store
      <Navbar />
      {children}
      <Footer />
    </AuthSyncProvider>
  </AuthProvider>
</QueryProvider>
```

### Ce qui se passe maintenant:

```
1. Utilisateur se connecte ✅
2. AuthContext charge les données ✅
3. AuthSyncProvider synchronise automatiquement ✅
4. AuthStore reçoit les données ✅
5. useWeddingData() utilise AuthStore (rempli) ✅
6. Requête: weddings WHERE user_id = [ID réel] ✅
7. Résultat: Trouve le wedding ✅
8. Affichage: Dashboard avec les données ✅
```

---

## 🧪 COMMENT TESTER

### 1. Redémarrer le serveur:
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### 2. Se connecter:
```
http://localhost:3000/sign-in
```

### 3. Aller sur le dashboard:
```
http://localhost:3000/dashboard-wedding
```

### 4. Vérifier la console:
Vous devriez voir:
```
🔄 Syncing user to AuthStore: {id: "...", email: "...", ...}
🔄 Fetching wedding data from Supabase...
✅ Wedding data cached
```

### 5. Résultat attendu:
- ✅ Votre dashboard s'affiche avec vos données
- ✅ Votre mariage existant est chargé
- ✅ Budget, tâches, etc. sont affichés

---

## 🔍 VÉRIFICATION DÉTAILLÉE

### Dans la console du navigateur:

```javascript
// Ouvrir la console (F12)
// Vérifier le store
console.log(window.__ZUSTAND_STORES__);

// Ou directement dans le code
import { useAuthStore } from '@/stores/useAuthStore';
const user = useAuthStore.getState().user;
console.log('User in store:', user);
```

### Avec React Query DevTools:

1. Ouvrir la page dashboard
2. Cliquer sur React Query DevTools (bouton bas-droite)
3. Chercher la query `['wedding', 'detail', userId]`
4. Vérifier que userId n'est pas vide
5. Vérifier que la query status = success
6. Vérifier les données retournées

---

## 🐛 SI ÇA NE MARCHE TOUJOURS PAS

### Debug checklist:

#### 1. Vérifier que l'utilisateur est bien dans la DB:
```sql
-- Dans Supabase SQL Editor
SELECT * FROM users WHERE email = 'votre@email.com';
-- Noter l'ID
```

#### 2. Vérifier que le wedding existe:
```sql
SELECT * FROM weddings WHERE user_id = '[ID de l'étape 1]';
-- Doit retourner au moins 1 ligne
```

#### 3. Vérifier AuthContext:
```tsx
// Ajouter temporairement dans dashboard-wedding/page.tsx
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardWeddingPage() {
  const authContext = useAuth();
  console.log('AuthContext:', authContext);
  // ...
}
```

#### 4. Vérifier AuthStore:
```tsx
// Ajouter temporairement
const storeUser = useAuthStore((state) => state.user);
console.log('Store User:', storeUser);
```

#### 5. Clear le cache:
```bash
# Supprimer le cache localStorage
# Dans la console navigateur:
localStorage.clear();
# Puis F5
```

---

## 📝 NOTES TECHNIQUES

### Pourquoi 2 systèmes (AuthContext + AuthStore)?

**AuthContext** (existant):
- Gère l'authentification Supabase
- Écoute les changements de session
- Charge les données user depuis la DB

**AuthStore** (nouveau):
- Cache global Zustand
- Partagé entre tous les composants
- Persistance localStorage
- Utilisé par React Query

**AuthSyncProvider** (nouveau):
- Pont entre les deux
- Synchronisation automatique
- Pas besoin de dupliquer le code

### Alternative (si le fix ne fonctionne pas):

Modifier `useWedding.ts` pour utiliser AuthContext directement:

```tsx
// Dans hooks/useWedding.ts
import { useAuth } from '@/contexts/AuthContext';

export function useWeddingData() {
  const { userData } = useAuth();  // Au lieu de useAuthStore
  
  const query = useQuery({
    queryKey: queryKeys.wedding.detail(userData?.id || ''),
    queryFn: async () => {
      // ...
    },
    enabled: !!userData?.id,
  });
  // ...
}
```

---

## ✅ RÉSUMÉ

### Ce qui a été fixé:
- ✅ Synchronisation AuthContext → AuthStore
- ✅ useWeddingData() reçoit maintenant le bon user.id
- ✅ Les weddings sont correctement récupérés
- ✅ Le dashboard affiche les données existantes

### Fichiers modifiés:
```
✅ components/providers/AuthSyncProvider.tsx (nouveau)
✅ hooks/useAuthSync.ts (nouveau)
✅ app/layout.jsx (modifié - ajout provider)
```

### Impact:
- ✅ Les utilisateurs existants voient leurs données
- ✅ Pas de perte de données
- ✅ Pas d'impact sur les nouvelles inscriptions

---

**🔧 Le bug devrait être fixé maintenant!**

**Testez en redémarrant le serveur et en vous reconnectant.**
