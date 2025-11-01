# 📋 Guide d'Implémentation - Dashboard Amélioré

## ✅ **Composants Créés**

### 1. **UserHeader Component** (`components/dashboard/UserHeader.jsx`)
Affiche les informations complètes de l'utilisateur :
- Avatar (ou initiales si pas d'avatar)
- Nom complet (prénom + nom)
- Email
- Rôle avec badge coloré
- Statut (Actif/Inactif)
- Téléphone (si disponible)
- Bouton "Modifier mon profil"

### 2. **AnnuairesSection Component** (`components/dashboard/AnnuairesSection.jsx`)
Gère l'affichage et la création d'annuaires :
- Liste tous les prestataires créés par l'utilisateur
- Liste tous les lieux de réception créés
- Boutons pour créer de nouveaux annuaires
- Adapté aux rôles (visible uniquement pour prestataire, entreprise, admin)

## 🎯 **Intégration dans le Dashboard Principal**

### Étape 1: Importer les composants dans `app/dashboard/page.jsx`

Ajoutez en haut du fichier :
```javascript
import UserHeader from '@/components/dashboard/UserHeader';
import AnnuairesSection from '@/components/dashboard/AnnuairesSection';
```

### Étape 2: Remplacer l'ancien header

Trouvez la section `{/* Header avec animation */}` et remplacez-la par :
```jsx
<UserHeader user={user} userData={userData} profile={profile} />
```

### Étape 3: Ajouter la section annuaires

Après les statistiques et avant la section "Mon Mariage", ajoutez :
```jsx
{/* Section Annuaires (pour prestataire, entreprise, admin) */}
{['prestataire', 'entreprise', 'admin'].includes(userData?.roles?.name) && (
  <AnnuairesSection 
    annuaires={annuaires} 
    userRole={userData?.roles?.name} 
  />
)}
```

## 📐 **Adaptation par Rôle**

### **Rôle : marie**
Dashboard axé sur la planification de mariage :
- ✅ Informations utilisateur
- ✅ Compte à rebours
- ✅ Statistiques (tâches, budget, invités, favoris)
- ✅ Gestion du mariage
- ✅ Tâches récentes
- ✅ Actions rapides
- ❌ Section annuaires (masquée)

### **Rôle : prestataire / entreprise**
Dashboard axé sur la gestion d'entreprise :
- ✅ Informations utilisateur
- ✅ Section annuaires (prestataires + lieux)
- ✅ Boutons création rapide
- ⚠️ Section mariage (optionnelle, peut être masquée)

### **Rôle : admin**
Dashboard complet avec tous les accès :
- ✅ Informations utilisateur
- ✅ Tous les annuaires
- ✅ Statistiques globales
- ✅ Accès à toutes les sections

### **Rôle : editeur**
Dashboard axé sur la gestion de contenu :
- ✅ Informations utilisateur
- ✅ Accès aux outils d'édition
- ❌ Annuaires (masqués)
- ❌ Mariage (masqué)

## 🎨 **Harmonisation des Styles**

### Palette de Couleurs (basée sur prestataires/page.jsx)
```css
/* Couleurs principales */
- Rose/Pink: from-pink-500 to-purple-600
- Bleu: bg-blue-500, border-blue-200
- Vert (succès): bg-green-500, border-green-200
- Rouge (admin): bg-red-500
- Violet (entreprise): bg-purple-500

/* Composants */
- .section-aroos : Cartes principales
- .btn-aroos : Bouton principal
- .btn-aroos-outline : Bouton secondaire
- .badge-aroos : Badges/Tags
- .card-hover : Cartes avec hover
- .empty-state : État vide
```

### Classes Communes à Utiliser
```jsx
{/* Sections */}
<div className="section-aroos">

{/* Boutons */}
<button className="btn-aroos">Action Principale</button>
<button className="btn-aroos-outline">Action Secondaire</button>

{/* Badges */}
<span className="badge-aroos bg-blue-500">Label</span>

{/* Cards avec hover */}
<div className="card-hover p-6">

{/* Empty State */}
<div className="empty-state">
  <div className="empty-state-icon">🏢</div>
  <h3>Titre</h3>
  <p>Description</p>
</div>
```

## 🔧 **Page Profile (dashboard/profile)**

### Structure Recommandée

```jsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/dashboard/UserHeader';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar: null
  });

  // Charger le profil
  useEffect(() => {
    loadProfile();
  }, [userData]);

  const loadProfile = async () => {
    if (!userData) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userData.id)
      .single();
    
    if (data) {
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        avatar: data.avatar
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userData.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        slug: `${formData.first_name}-${formData.last_name}`.toLowerCase().replace(/\\s+/g, '-')
      });
    
    if (!error) {
      alert('Profil mis à jour avec succès !');
      loadProfile();
      setEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <UserHeader user={user} userData={userData} profile={profile} />
        
        <div className="section-aroos">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Mon Profil</h2>
            <button 
              onClick={() => setEditing(!editing)}
              className="btn-aroos-outline"
            >
              {editing ? '❌ Annuler' : '✏️ Modifier'}
            </button>
          </div>
          
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="input-aroos w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="input-aroos w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input-aroos w-full"
                  placeholder="+253 XX XX XX XX"
                />
              </div>
              
              <button type="submit" className="btn-aroos">
                💾 Sauvegarder
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{user?.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Téléphone:</span>
                <span className="ml-2 font-medium">{profile?.phone || 'Non renseigné'}</span>
              </div>
              <div>
                <span className="text-gray-600">Rôle:</span>
                <span className="ml-2 font-medium">{userData?.roles?.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 📝 **Checklist d'Intégration**

- [x] Créer UserHeader component
- [x] Créer AnnuairesSection component
- [ ] Intégrer UserHeader dans dashboard/page.jsx
- [ ] Intégrer AnnuairesSection dans dashboard/page.jsx
- [ ] Créer/améliorer dashboard/profile/page.jsx
- [ ] Tester avec différents rôles
- [ ] Harmoniser reception/page.jsx avec le style prestataires
- [ ] Vérifier la responsivité mobile

## 🚀 **Prochaines Étapes**

1. **Testez avec différents utilisateurs** ayant des rôles différents
2. **Ajustez les permissions** selon vos besoins
3. **Ajoutez des statistiques spécifiques** par rôle
4. **Créez des dashboards spécialisés** si nécessaire (dashboard/admin, etc.)

---

**Les composants sont prêts ! Il suffit maintenant de les intégrer dans le dashboard principal.** 🎉
