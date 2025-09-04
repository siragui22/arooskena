# Arooskena - Plateforme de Mariage à Djibouti

Arooskena est une plateforme web tout-en-un dédiée à l'organisation de mariages à Djibouti. Elle permet aux futurs mariés de trouver des prestataires, planifier leur mariage, gérer leur budget et inviter leurs proches.

## 🚀 Fonctionnalités

### Pour les Couples
- **Inscription gratuite** avec attribution automatique du rôle
- **Annuaire des prestataires** par catégories (lieux, photographes, traiteurs, DJ, etc.)
- **Planificateur de tâches** prédéfinies et personnalisées
- **Gestionnaire de budget** avec graphiques et suivi
- **Liste d'invités** avec RSVP et suivi
- **Favoris** pour sauvegarder les prestataires préférés

### Pour les Prestataires
- **Profils détaillés** avec photos, descriptions et prix
- **Badges de vérification** et mise en avant
- **Forfaits d'abonnement** (Essentiel, Découverte, Premium, Professionnel, Élite)
- **Gestion des services** et disponibilités

### Pour les Administrateurs
- **Dashboard complet** avec statistiques
- **Gestion des utilisateurs** et prestataires
- **Modération du carrousel** et des annonces
- **Validation des comptes** prestataires

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 (App Router)
- **UI** : TailwindCSS + DaisyUI
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Déploiement** : Vercel (recommandé)

## 📦 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/arooskena_v1.git
cd arooskena_v1
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
   - Créer un projet sur [Supabase](https://supabase.com)
   - Copier les variables d'environnement dans `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

4. **Créer la base de données**
   - Exécuter le script SQL dans `database/schema.sql` dans votre projet Supabase

5. **Lancer le serveur de développement**
```bash
npm run dev
```

6. **Ouvrir [http://localhost:3000](http://localhost:3000)**

## 🗄️ Structure de la Base de Données

### Tables Principales
- `users` - Utilisateurs (extension de auth.users)
- `profiles` - Profils utilisateurs détaillés
- `prestataires` - Annuaire des prestataires
- `lieux_receptions` - Lieux de réception
- `services` - Services proposés par les prestataires
- `mariages` - Mariages des couples
- `taches_mariage` - Tâches de planification
- `budgets` - Gestion des budgets
- `invites` - Liste d'invités
- `carousel_items` - Annonces du carrousel
- `avis` - Avis des utilisateurs
- `favoris` - Prestataires favoris
- `abonnements` - Forfaits prestataires

## 📁 Structure du Projet

```
arooskena_v1/
├── app/                    # Pages Next.js (App Router)
│   ├── dashboard/         # Dashboard utilisateur
│   ├── admin/            # Interface d'administration
│   ├── sign-in/          # Connexion
│   ├── sign-up/          # Inscription
│   ├── reception/        # Lieux de réception
│   ├── prestataire/      # Annuaire prestataires
│   └── ...
├── components/           # Composants réutilisables
├── lib/                 # Configuration Supabase
├── database/            # Schémas SQL
├── public/              # Assets statiques
└── ...
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification ESLint
```

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement Supabase
3. Déployer automatiquement

### Autres Plateformes
- **Netlify** : Compatible avec Next.js
- **Railway** : Déploiement simple
- **DigitalOcean App Platform** : Scalable

## 🔐 Sécurité

- **Row Level Security (RLS)** activé sur Supabase
- **Authentification** sécurisée avec Supabase Auth
- **Validation** des données côté client et serveur
- **Middleware** de protection des routes

## 📈 Monétisation

### Forfaits Prestataires
- **Essentiel** : Gratuit
- **Découverte** : 29€/mois
- **Premium** : 59€/mois
- **Professionnel** : 99€/mois
- **Élite** : 199€/mois

### Forfaits Couples
- **Essentiel** : Gratuit
- **Premium** : 19€/mois
- **Mariage Pro** : 49€/mois
- **Élite** : 99€/mois

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Email** : support@arooskena.com
- **WhatsApp** : +253 XXX XXX XXX
- **Site web** : https://arooskena.com

## 🎯 Roadmap

### Version 1.1
- [ ] Interface de gestion des prestataires
- [ ] Système de messagerie
- [ ] Notifications push
- [ ] Application mobile

### Version 1.2
- [ ] Marketplace digitale
- [ ] Blog et inspirations
- [ ] Système de paiement intégré
- [ ] API publique

---

**Développé avec ❤️ pour les mariages à Djibouti**
