# Mise à jour du système d'adresses - Arooskena

## Vue d'ensemble

Le système d'adresses a été mis à jour pour utiliser des sélecteurs prédéfinis pour les régions et communes de Djibouti, tout en gardant un champ libre pour l'adresse détaillée.

## Modifications apportées

### 🏗️ **Structure des données**

#### Ancienne structure :
```javascript
{
  rue: string,           // Champ libre
  ville: string,         // Champ libre
  region: string,        // Champ libre
  pays: string,          // Champ libre
  code_postal: string,   // Champ libre
  latitude: number,      // Coordonnées GPS
  longitude: number      // Coordonnées GPS
}
```

#### Nouvelle structure :
```javascript
{
  adresse: string,       // Champ libre - adresse détaillée
  commune: string,       // Sélecteur - commune prédéfinie
  region: string,        // Sélecteur - région prédéfinie
  pays: string           // Champ libre - pays
}
```

### 📍 **Données de référence**

#### Régions de Djibouti :
```javascript
const regions = [
  { id: 'djibouti', name: 'Djibouti' },
  { id: 'ali_sabieh', name: 'Ali Sabieh' },
  { id: 'dikhil', name: 'Dikhil' },
  { id: 'tadjourah', name: 'Tadjourah' },
  { id: 'obock', name: 'Obock' },
  { id: 'arta', name: 'Arta' }
];
```

#### Communes par région :
```javascript
const communes = {
  djibouti: [
    { id: 'djibouti_ville', name: 'Djibouti Ville' },
    { id: 'balbala', name: 'Balbala' },
    { id: 'boulaos', name: 'Boulaos' },
    { id: 'doraleh', name: 'Doraleh' }
  ],
  ali_sabieh: [
    { id: 'ali_sabieh_ville', name: 'Ali Sabieh Ville' },
    { id: 'holhol', name: 'Holhol' },
    { id: 'dikhil_commune', name: 'Dikhil' }
  ],
  // ... autres régions
};
```

### 🎨 **Interface utilisateur**

#### Formulaire d'adresse mis à jour :

1. **Champ Adresse** (libre) :
   - Input text pour l'adresse détaillée
   - Placeholder : "Ex: Rue de la République, Quartier 4"

2. **Sélecteur Région** (obligatoire) :
   - Dropdown avec toutes les régions de Djibouti
   - Déclenche la mise à jour des communes disponibles

3. **Sélecteur Commune** (obligatoire) :
   - Dropdown dynamique basé sur la région sélectionnée
   - Désactivé tant qu'aucune région n'est sélectionnée
   - Se réinitialise quand la région change

4. **Champ Pays** (libre) :
   - Input text avec valeur par défaut "Djibouti"

#### Logique de sélection en cascade :
```javascript
// Quand la région change, on réinitialise la commune
onChange={(e) => setAddressForm({
  ...addressForm, 
  region: e.target.value, 
  commune: ''  // Réinitialisation
})}

// La commune est désactivée si aucune région n'est sélectionnée
disabled={!addressForm.region}

// Les communes sont filtrées par région
{addressForm.region && communes[addressForm.region]?.map(commune => (
  <option key={commune.id} value={commune.id}>
    {commune.name}
  </option>
))}
```

### 🔧 **Fonctionnalités techniques**

#### Validation des données :
- **Adresse** : Champ obligatoire
- **Région** : Sélection obligatoire
- **Commune** : Sélection obligatoire
- **Pays** : Champ libre (défaut : "Djibouti")

#### Gestion des états :
- Réinitialisation automatique de la commune quand la région change
- Désactivation du sélecteur commune si aucune région n'est sélectionnée
- Mise à jour dynamique des options de communes

#### Sauvegarde en base :
```javascript
await supabase
  .from('prestataire_adresses')
  .insert({
    prestataire_id: prestataire.id,
    adresse: addressForm.adresse,
    commune: addressForm.commune,
    region: addressForm.region,
    pays: addressForm.pays
  });
```

### 📱 **Pages mises à jour**

#### 1. Page de gestion des prestataires (`app/prestataires/page.jsx`)
- Modal d'ajout d'adresse avec nouveaux sélecteurs
- Affichage des adresses existantes avec nouveaux champs
- Gestion des données de référence (régions/communes)

#### 2. Page de setup (`app/prestataires/setup/page.jsx`)
- Étape 4 (Localisation) mise à jour
- Formulaire d'adresse avec sélecteurs
- Sauvegarde avec nouvelle structure

### 🎯 **Avantages de cette approche**

1. **Standardisation** : 
   - Noms de régions et communes cohérents
   - Évite les erreurs de saisie
   - Facilite les recherches et filtres

2. **Expérience utilisateur** :
   - Sélection guidée et intuitive
   - Validation en temps réel
   - Interface cohérente

3. **Données de qualité** :
   - Pas de doublons ou variations d'orthographe
   - Structure normalisée
   - Facilite l'analyse géographique

4. **Maintenance** :
   - Données centralisées
   - Facile à mettre à jour
   - Cohérence garantie

### 🔄 **Migration des données existantes**

Si des données existent avec l'ancienne structure, il faudra :
1. Mapper les anciens champs vers les nouveaux
2. Convertir les noms de villes en IDs de communes
3. Mettre à jour la structure de la base de données

### 📊 **Impact sur l'affichage**

#### Affichage des adresses :
```javascript
// Ancien affichage
<div>{address.rue}</div>
<div>{address.ville}, {address.region}</div>
<div>{address.pays} {address.code_postal}</div>

// Nouvel affichage
<div>{address.adresse}</div>
<div>{address.commune}, {address.region}</div>
<div>{address.pays}</div>
```

### 🚀 **Prochaines améliorations possibles**

1. **Géolocalisation automatique** :
   - Récupération automatique des coordonnées GPS
   - Validation des adresses

2. **Recherche géographique** :
   - Filtrage par région/commune
   - Carte interactive

3. **Données étendues** :
   - Codes postaux par commune
   - Informations supplémentaires (quartiers, etc.)

4. **API externe** :
   - Intégration avec des services de géolocalisation
   - Validation d'adresses en temps réel

## Conclusion

Cette mise à jour améliore significativement la qualité et la cohérence des données d'adresses tout en offrant une meilleure expérience utilisateur avec des sélecteurs guidés et une validation robuste.






