-- Politiques RLS (Row Level Security) pour Arooskena
-- À exécuter après la création des tables

-- Activer RLS sur toutes les tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lieux_receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mariages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestataires_mariages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches_mariage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLITIQUES POUR LA TABLE ROLES
-- ========================================

-- Tout le monde peut lire les rôles
CREATE POLICY "Roles are viewable by everyone" ON public.roles
    FOR SELECT USING (true);

-- ========================================
-- POLITIQUES POUR LA TABLE USERS
-- ========================================

-- Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Les admins peuvent voir toutes les données utilisateurs
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- Les admins peuvent modifier toutes les données utilisateurs
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- ========================================
-- POLITIQUES POUR LA TABLE PROFILES
-- ========================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = profiles.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = profiles.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = profiles.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- ========================================
-- POLITIQUES POUR LA TABLE PRESTATAIRES
-- ========================================

-- Les prestataires peuvent voir leurs propres données
CREATE POLICY "Prestataires can view own data" ON public.prestataires
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = prestataires.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les prestataires peuvent modifier leurs propres données
CREATE POLICY "Prestataires can update own data" ON public.prestataires
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = prestataires.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les prestataires peuvent insérer leurs propres données
CREATE POLICY "Prestataires can insert own data" ON public.prestataires
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = prestataires.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Tout le monde peut voir les prestataires actifs et vérifiés
CREATE POLICY "Everyone can view verified prestataires" ON public.prestataires
    FOR SELECT USING (
        is_verified = true AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = prestataires.user_id 
            AND users.is_active = true
        )
    );

-- Les admins peuvent voir tous les prestataires
CREATE POLICY "Admins can view all prestataires" ON public.prestataires
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- Les admins peuvent modifier tous les prestataires
CREATE POLICY "Admins can update all prestataires" ON public.prestataires
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- ========================================
-- POLITIQUES POUR LA TABLE MARIAGES
-- ========================================

-- Les couples peuvent voir leurs propres mariages
CREATE POLICY "Couples can view own mariages" ON public.mariages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = mariages.maries_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les couples peuvent modifier leurs propres mariages
CREATE POLICY "Couples can update own mariages" ON public.mariages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = mariages.maries_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les couples peuvent insérer leurs propres mariages
CREATE POLICY "Couples can insert own mariages" ON public.mariages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = mariages.maries_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Les admins peuvent voir tous les mariages
CREATE POLICY "Admins can view all mariages" ON public.mariages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- ========================================
-- POLITIQUES POUR LA TABLE PRESTATAIRES_MARIAGES
-- ========================================

-- Les couples peuvent voir les prestataires de leurs mariages
CREATE POLICY "Couples can view own wedding prestataires" ON public.prestataires_mariages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mariages m
            JOIN public.users u ON m.maries_id = u.id
            WHERE m.id = prestataires_mariages.mariage_id 
            AND u.auth_user_id = auth.uid()
        )
    );

-- Les couples peuvent gérer les prestataires de leurs mariages
CREATE POLICY "Couples can manage own wedding prestataires" ON public.prestataires_mariages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mariages m
            JOIN public.users u ON m.maries_id = u.id
            WHERE m.id = prestataires_mariages.mariage_id 
            AND u.auth_user_id = auth.uid()
        )
    );

-- Les prestataires peuvent voir les mariages où ils sont impliqués
CREATE POLICY "Prestataires can view own wedding assignments" ON public.prestataires_mariages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.prestataires p
            JOIN public.users u ON p.user_id = u.id
            WHERE p.id = prestataires_mariages.prestataire_id 
            AND u.auth_user_id = auth.uid()
        )
    );

-- Les admins peuvent gérer toutes les associations
CREATE POLICY "Admins can manage all prestataires_mariages" ON public.prestataires_mariages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- ========================================
-- POLITIQUES POUR LA TABLE CARROUSEL_ITEMS
-- ========================================

-- Tout le monde peut voir les éléments de carrousel actifs
CREATE POLICY "Everyone can view active carousel items" ON public.carousel_items
    FOR SELECT USING (is_active = true);

-- Les admins peuvent gérer tous les éléments de carrousel
CREATE POLICY "Admins can manage carousel items" ON public.carousel_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- ========================================
-- POLITIQUES POUR LES AUTRES TABLES
-- ========================================

-- Services : Prestataires peuvent gérer leurs services, tout le monde peut voir les services disponibles
CREATE POLICY "Prestataires can manage own services" ON public.services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.prestataires p
            JOIN public.users u ON p.user_id = u.id
            WHERE p.id = services.prestataire_id 
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view available services" ON public.services
    FOR SELECT USING (is_available = true);

-- Avis : Tout le monde peut voir les avis vérifiés, utilisateurs peuvent créer leurs avis
CREATE POLICY "Everyone can view verified reviews" ON public.avis
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Users can create reviews" ON public.avis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = avis.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Favoris : Utilisateurs peuvent gérer leurs favoris
CREATE POLICY "Users can manage own favorites" ON public.favoris
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = favoris.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Tâches, budgets, invités : Couples peuvent gérer leurs données de mariage
CREATE POLICY "Couples can manage own wedding data" ON public.taches_mariage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mariages m
            JOIN public.users u ON m.maries_id = u.id
            WHERE m.id = taches_mariage.mariage_id 
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can manage own wedding data" ON public.budgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mariages m
            JOIN public.users u ON m.maries_id = u.id
            WHERE m.id = budgets.mariage_id 
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can manage own wedding data" ON public.invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mariages m
            JOIN public.users u ON m.maries_id = u.id
            WHERE m.id = invites.mariage_id 
            AND u.auth_user_id = auth.uid()
        )
    );
