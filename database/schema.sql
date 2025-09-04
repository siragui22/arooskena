-- Arooskena Database Schema
-- Tables principales pour la plateforme de mariage

-- Table des rôles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs (extension de auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role_id UUID REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    avatar TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,         -- ex: 'photo', 'traiteur'
    label TEXT NOT NULL,               -- ex: 'Photographe', 'Traiteur'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sous-catégories
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                -- ex: 'studio', 'extérieur'
    label TEXT NOT NULL,               -- ex: 'Studio photo', 'Extérieur'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des prestataires
CREATE TABLE IF NOT EXISTS public.prestataires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nom_entreprise TEXT NOT NULL,
    description TEXT,
    categorie_id UUID REFERENCES public.categories(id),
    subcategorie_id UUID REFERENCES public.subcategories(id),
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    website TEXT,
    prix_min DECIMAL(10,2),
    prix_max DECIMAL(10,2),
    devise TEXT DEFAULT 'EUR',
    images TEXT[], -- URLs des images
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    subscription_type TEXT DEFAULT 'essentiel' CHECK (subscription_type IN (
        'essentiel', 'decouverte', 'premium', 'professionnel', 'elite'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lieux de réception
CREATE TABLE IF NOT EXISTS public.lieux_receptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    capacite_min INTEGER,
    capacite_max INTEGER,
    prix_location DECIMAL(10,2),
    services_inclus TEXT[], -- ['parking', 'cuisine', 'deco']
    images TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    prix DECIMAL(10,2),
    duree_estimee INTEGER, -- en minutes
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des mariages
CREATE TABLE IF NOT EXISTS public.mariages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    maries_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nom_mariage TEXT NOT NULL,
    date_mariage DATE NOT NULL,
    lieu_ceremonie TEXT,
    lieu_reception TEXT,
    budget_total DECIMAL(10,2),
    nombre_invites INTEGER,
    theme TEXT,
    status TEXT DEFAULT 'planification' CHECK (status IN (
        'planification', 'en_cours', 'termine', 'annule'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison prestataires-mariages
CREATE TABLE IF NOT EXISTS public.prestataires_mariages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mariage_id UUID REFERENCES public.mariages(id) ON DELETE CASCADE,
    prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
    role TEXT, -- ex: photographe, traiteur, dj, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mariage_id, prestataire_id, role)
);

-- Table des tâches de mariage
CREATE TABLE IF NOT EXISTS public.taches_mariage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mariage_id UUID REFERENCES public.mariages(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT,
    date_limite DATE,
    priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    status TEXT DEFAULT 'a_faire' CHECK (status IN ('a_faire', 'en_cours', 'terminee')),
    assigne_a UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mariage_id UUID REFERENCES public.mariages(id) ON DELETE CASCADE,
    categorie TEXT NOT NULL,
    montant_prevu DECIMAL(10,2) NOT NULL,
    montant_reel DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des invités
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mariage_id UUID REFERENCES public.mariages(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    nombre_personnes INTEGER DEFAULT 1,
    status_rsvp TEXT DEFAULT 'en_attente' CHECK (status_rsvp IN ('en_attente', 'confirme', 'refuse', 'peut_etre')),
    reponse_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des annonces/carrousel
CREATE TABLE IF NOT EXISTS public.carousel_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titre TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    lien_url TEXT,
    ordre INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'sponsorise' CHECK (type IN ('sponsorise', 'promotion', 'info')),
    prestataire_id UUID REFERENCES public.prestataires(id),
    date_debut DATE,
    date_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des avis
CREATE TABLE IF NOT EXISTS public.avis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    note INTEGER CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des favoris
CREATE TABLE IF NOT EXISTS public.favoris (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prestataire_id)
);

-- Table des abonnements
CREATE TABLE IF NOT EXISTS public.abonnements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'essentiel', 'decouverte', 'premium', 'professionnel', 'elite'
    )),
    montant DECIMAL(10,2) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    status TEXT DEFAULT 'actif' CHECK (status IN ('actif', 'expire', 'annule')),
    paiement_status TEXT DEFAULT 'en_attente' CHECK (paiement_status IN ('en_attente', 'paye', 'refuse')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des rôles par défaut
INSERT INTO public.roles (name, label, description) VALUES
    ('couple', 'Couple', 'Couple organisant son mariage'),
    ('prestataire', 'Prestataire', 'Professionnel proposant des services'),
    ('admin', 'Administrateur', 'Administrateur de la plateforme')
ON CONFLICT (name) DO NOTHING;

-- Insertion des catégories par défaut
INSERT INTO public.categories (name, label, description) VALUES
    ('photo', 'Photographie', 'Services de photographie et vidéo'),
    ('traiteur', 'Traiteur', 'Services de restauration et traiteur'),
    ('lieu', 'Lieu de réception', 'Salles et lieux de réception'),
    ('musique', 'Musique', 'DJ, orchestre et animation musicale'),
    ('decoration', 'Décoration', 'Décoration florale et événementielle'),
    ('transport', 'Transport', 'Services de transport et location'),
    ('beaute', 'Beauté', 'Coiffure, maquillage et bien-être'),
    ('robe', 'Robe de mariée', 'Robes de mariée et accessoires'),
    ('ceremonie', 'Cérémonie', 'Organisation de cérémonies'),
    ('autres', 'Autres', 'Autres services et prestations')
ON CONFLICT (name) DO NOTHING;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_prestataires_categorie_id ON public.prestataires(categorie_id);
CREATE INDEX IF NOT EXISTS idx_prestataires_subcategorie_id ON public.prestataires(subcategorie_id);
CREATE INDEX IF NOT EXISTS idx_prestataires_verified ON public.prestataires(is_verified);
CREATE INDEX IF NOT EXISTS idx_prestataires_featured ON public.prestataires(is_featured);
CREATE INDEX IF NOT EXISTS idx_mariages_maries_id ON public.mariages(maries_id);
CREATE INDEX IF NOT EXISTS idx_mariages_date ON public.mariages(date_mariage);
CREATE INDEX IF NOT EXISTS idx_prestataires_mariages_mariage_id ON public.prestataires_mariages(mariage_id);
CREATE INDEX IF NOT EXISTS idx_prestataires_mariages_prestataire_id ON public.prestataires_mariages(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_carousel_active ON public.carousel_items(is_active);
CREATE INDEX IF NOT EXISTS idx_carousel_ordre ON public.carousel_items(ordre);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prestataires_updated_at BEFORE UPDATE ON public.prestataires FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mariages_updated_at BEFORE UPDATE ON public.mariages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taches_mariage_updated_at BEFORE UPDATE ON public.taches_mariage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON public.invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carousel_items_updated_at BEFORE UPDATE ON public.carousel_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_avis_updated_at BEFORE UPDATE ON public.avis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_favoris_updated_at BEFORE UPDATE ON public.favoris FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_abonnements_updated_at BEFORE UPDATE ON public.abonnements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
