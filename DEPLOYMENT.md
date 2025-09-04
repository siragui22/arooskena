# 🚀 Guide de Déploiement Supabase - Arooskena

## 📋 Prérequis

1. **Compte Supabase** : Créez un compte sur [supabase.com](https://supabase.com)
2. **Projet Supabase** : Créez un nouveau projet
3. **Variables d'environnement** : Configurez vos clés API

## 🔧 Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Récupération des clés Supabase

1. Allez dans votre projet Supabase
2. Cliquez sur **Settings** → **API**
3. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ Déploiement des Tables

### Option 1 : Script automatique (Recommandé)

```bash
# Installer les dépendances
npm install

# Déployer le schéma complet
node deploy-supabase.js --all

# Ou déployer seulement le schéma
node deploy-supabase.js --schema

# Vérifier les tables
node deploy-supabase.js --verify
```

### Option 2 : Interface Supabase

1. Allez dans **SQL Editor** dans votre projet Supabase
2. Copiez le contenu de `database/schema.sql`
3. Exécutez le script
4. Copiez le contenu de `database/rls-policies.sql`
5. Exécutez les politiques RLS

### Option 2 : Interface Supabase

1. Allez dans **SQL Editor** dans votre projet Supabase
2. Copiez le contenu de `database/schema.sql`
3. Exécutez le script

## 📊 Tables créées

Le script crée les tables suivantes :

- ✅ `roles` - Définition des rôles (couple, prestataire, admin)
- ✅ `users` - Utilisateurs de la plateforme (avec role_id)
- ✅ `profiles` - Profils détaillés des utilisateurs
- ✅ `prestataires` - Prestataires de services
- ✅ `lieux_receptions` - Lieux de réception
- ✅ `services` - Services proposés par les prestataires
- ✅ `mariages` - Projets de mariage des couples
- ✅ `taches_mariage` - Tâches de planification
- ✅ `budgets` - Gestion budgétaire
- ✅ `invites` - Liste d'invités
- ✅ `carousel_items` - Éléments du carrousel
- ✅ `avis` - Avis des clients
- ✅ `favoris` - Prestataires favoris
- ✅ `abonnements` - Abonnements premium

## 🔐 Configuration RLS (Row Level Security)

### 1. Activer RLS sur toutes les tables

Le script `database/rls-policies.sql` active automatiquement RLS sur toutes les tables et crée les politiques de sécurité appropriées.

### 2. Politiques implémentées

- **Utilisateurs** : Chaque utilisateur ne peut voir que ses propres données
- **Admins** : Peuvent voir et modifier toutes les données
- **Prestataires** : Peuvent gérer leurs propres services
- **Couples** : Peuvent gérer leurs propres mariages et données associées
- **Public** : Peut voir les prestataires vérifiés et les éléments de carrousel actifs

### 3. Exécution des politiques

```sql
-- Copier et exécuter le contenu de database/rls-policies.sql
-- dans l'éditeur SQL de Supabase
```

## 🎨 Données d'exemple

Le script insère automatiquement :

- ✅ Éléments de carrousel d'exemple
- ✅ Configuration de base

## 🧪 Test de la configuration

### 1. Vérifier la connexion

```bash
npm run dev
```

Visitez `http://localhost:3000` et vérifiez que :
- ✅ La page d'accueil se charge
- ✅ Le carrousel affiche les images
- ✅ L'inscription/connexion fonctionne

### 2. Tester les dashboards

1. **Créer un compte couple** :
   - Inscrivez-vous avec un email
   - Vérifiez que vous accédez au dashboard couple

2. **Créer un compte admin** :
   - Connectez-vous à Supabase
   - Modifiez manuellement le rôle en 'admin' dans la table `users`
   - Vérifiez l'accès au dashboard admin

3. **Créer un compte prestataire** :
   - Modifiez le rôle en 'prestataire' dans la table `users`
   - Vérifiez l'accès au dashboard prestataire

## 🔧 Dépannage

### Erreur de connexion Supabase

```bash
# Vérifier les variables d'environnement
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Tables manquantes

```bash
# Vérifier les tables créées
node deploy-supabase.js --verify
```

### Erreur de permissions

1. Vérifiez que RLS est activé
2. Vérifiez les politiques de sécurité
3. Vérifiez que l'utilisateur a le bon rôle

## 📈 Prochaines étapes

1. **Configurer l'authentification** :
   - Activer l'authentification par email
   - Configurer les redirections

2. **Configurer le stockage** :
   - Créer un bucket pour les images
   - Configurer les permissions

3. **Configurer les emails** :
   - Configurer SMTP pour les notifications
   - Tester les emails de confirmation

4. **Déployer en production** :
   - Configurer le domaine
   - Configurer SSL
   - Optimiser les performances

## 🆘 Support

En cas de problème :

1. Vérifiez les logs dans la console Supabase
2. Vérifiez les logs Next.js (`npm run dev`)
3. Consultez la documentation Supabase
4. Vérifiez les variables d'environnement

---

**🎉 Félicitations ! Votre plateforme Arooskena est maintenant configurée et prête à être utilisée !**
