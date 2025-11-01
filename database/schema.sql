
 CREATE TABLE public.adresses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    adresse_complete text NOT NULL,
    commune text NOT NULL,
    region text NOT NULL,
    pays text DEFAULT 'DJIBOUTI'::text,
    created_at timestamp with time zone DEFAULT now(),
    quartiers text,
    PRIMARY KEY (id)
);

 CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    label text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (name),
    PRIMARY KEY (id)
);

 CREATE TABLE public.lieu_reception_disponibilites (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lieu_reception_id uuid,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    est_disponible boolean DEFAULT true,
    prix_special numeric,
    note text,
    created_at timestamp with time zone DEFAULT now(),
    CHECK ((date_debut <= date_fin)),
    FOREIGN KEY (lieu_reception_id) REFERENCES lieux_reception(id) ON DELETE CASCADE,
    PRIMARY KEY (id)
);

 CREATE TABLE public.lieu_reception_images (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lieu_reception_id uuid,
    url text NOT NULL,
    is_main boolean DEFAULT false,
    type_image text,
    created_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (lieu_reception_id) REFERENCES lieux_reception(id) ON DELETE CASCADE,
    PRIMARY KEY (id),
    CHECK ((type_image = ANY (ARRAY['exterieur'::text, 'interieur'::text, 'salle'::text, 'jardin'::text, 'decoration'::text, 'autre'::text])))
);

 CREATE TABLE public.lieu_reception_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lieu_reception_id uuid,
    user_id uuid,
    note integer,
    commentaire text,
    created_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (lieu_reception_id) REFERENCES lieux_reception(id) ON DELETE CASCADE,
    CHECK (((note >= 1) AND (note <= 5))),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (lieu_reception_id, user_id)
);

 CREATE TABLE public.lieu_subscription_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    label text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    duration_days integer NOT NULL DEFAULT 30,
    features jsonb,
    priority_listing boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (name),
    PRIMARY KEY (id)
);

 CREATE TABLE public.lieu_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    label text NOT NULL,
    description text,
    icone text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (name),
    PRIMARY KEY (id)
);

 CREATE TABLE public.lieux_reception (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    nom_lieu text NOT NULL,
    description text,
    type_lieu_id uuid,
    adresse_id uuid,
    capacite_min integer,
    capacite_max integer,
    prix_min numeric,
    prix_max numeric,
    prix_par_personne numeric,
    telephone_fixe text,
    whatsapp text,
    email text,
    website text,
    is_verified boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    subscription_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CHECK ((capacite_min <= capacite_max)),
    FOREIGN KEY (adresse_id) REFERENCES adresses(id),
    PRIMARY KEY (id),
    FOREIGN KEY (subscription_id) REFERENCES lieu_subscription_types(id),
    FOREIGN KEY (type_lieu_id) REFERENCES lieu_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    CHECK ((prix_min <= prix_max))
);

 CREATE TABLE public.prestataire_adresses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    prestataire_id uuid,
    adresse text,
    commune text,
    region text,
    pays text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE
);

 CREATE TABLE public.prestataire_images (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    prestataire_id uuid,
    url text NOT NULL,
    is_main boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE
);

 CREATE TABLE public.prestataire_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    prestataire_id uuid,
    user_id uuid,
    note integer,
    commentaire text,
    created_at timestamp with time zone DEFAULT now(),
    CHECK (((note >= 1) AND (note <= 5))),
    PRIMARY KEY (id),
    FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

 CREATE TABLE public.prestataires (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    nom_entreprise text NOT NULL,
    description text,
    categorie_id uuid,
    subcategorie_id uuid,
    telephone_fixe text,
    whatsapp text,
    email text,
    website text,
    prix_min numeric(10,2),
    prix_max numeric(10,2),
    is_verified boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    subscription_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    adresse_id uuid,
    FOREIGN KEY (adresse_id) REFERENCES adresses(id),
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
    CHECK (((prix_max IS NULL) OR (prix_min IS NULL) OR (prix_max >= prix_min))),
    PRIMARY KEY (id),
    FOREIGN KEY (subcategorie_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscription_types(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
 
 CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    avatar text,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (slug),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

 CREATE TABLE public.roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    label text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (name),
    PRIMARY KEY (id)
);

INSERT INTO public.roles (id, name, label, description, created_at) VALUES
    (gen_random_uuid(), 'admin',       'admin',  'Roles pour les administrateurs'     NULL, now()),
    (gen_random_uuid(), 'marie',       'marie',   'Rôle pour gérer les couples'    NULL, now()),
    (gen_random_uuid(), 'prestataire', 'Prestataire', 'Rôle pour gérer les Prestataire' NULL, now()),
    (gen_random_uuid(), 'editeur',     'editeur',  'Rôle pour gérer les editeurs'   NULL, now());
    (gen_random_uuid(), 'entreprise',     'entreprise',  'Rôle pivot pour les professionnels (ça peut être prestataire ou lieu de réception, et d’autres rôles à venir)'   NULL, now());


 CREATE TABLE public.subcategories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category_id uuid,
    name text NOT NULL,
    label text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (id)
);

 CREATE TABLE public.subscription_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric(10,2),
    duration_months integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (name),
    PRIMARY KEY (id)
);

 CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    auth_user_id uuid,
    email text NOT NULL,
    phone text,
    role_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE (email),
    UNIQUE (phone),
    PRIMARY KEY (id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);   

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text, -- Description SEO du tag
  usage_count integer default 0, -- Nombre d'articles utilisant ce tag
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  lieu_type_id uuid references lieu_types(id) on delete set null, -- ✅ Corrigé
  categorie_id uuid references categories(id) on delete set null,
  subcategorie_id uuid references subcategories(id) on delete set null,
  
  -- Contenu
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  featured_image text,
  reading_time_minutes integer,
  
  -- Statistiques
  views_count integer default 0,
  
  -- Publication
  is_published boolean default false,
  published_at timestamp with time zone,
  
  -- Sponsoring
  is_sponsored boolean default false,
  sponsor_url_vendor text,
  redirect_url_external text,
  
  -- Mise en avant
  is_featured boolean default false,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Contrainte
  check (
    (is_sponsored = false) or 
    (is_sponsored = true and (sponsor_url_vendor is not null or redirect_url_external is not null))
  )
);

create table if not exists article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (article_id, tag_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade, -- Pour les réponses
  content text not null,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid not null, -- ID de l'élément favori
  item_type text not null check (item_type in ('articles','prestataires','lieux_reception')),
  created_at timestamp with time zone default now(),
  unique(user_id, item_id, item_type)
);

-- ============================================
-- MODULE MARIAGE - AROOSKENA
-- ============================================

-- 1. Types d'abonnement pour les mariages (PAS DE DÉPENDANCES)
CREATE TABLE public.wedding_subscription_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    label text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL DEFAULT 0,
    duration_months integer NOT NULL DEFAULT 6,
    features jsonb,
    max_tasks integer,
    max_inspirations integer,
    has_public_page boolean DEFAULT false,
    has_budget_charts boolean DEFAULT false,
    has_pdf_export boolean DEFAULT false,
    priority_support boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (name),
    PRIMARY KEY (id)
);

-- 2. Table principale des mariages (DÉPEND DE: users, wedding_subscription_types)
CREATE TABLE public.weddings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    wedding_date date NOT NULL,
    estimated_guests integer,
    max_budget numeric(10,2),
    status text DEFAULT 'planification',
    slug text UNIQUE,
    public_page_enabled boolean DEFAULT false,
    public_page_settings jsonb,
    subscription_id uuid,
    subscription_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES wedding_subscription_types(id) ON DELETE SET NULL,
    PRIMARY KEY (id),
    CHECK (status IN ('planification', 'confirme', 'termine', 'annule'))
);

CREATE INDEX idx_weddings_user_id ON public.weddings(user_id);
CREATE INDEX idx_weddings_status ON public.weddings(status);
CREATE INDEX idx_weddings_slug ON public.weddings(slug);

-- 3. Catégories de budget (DÉPEND DE: weddings)
CREATE TABLE public.wedding_budget_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    wedding_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    description text,
    allocated_budget numeric(10,2),
    color text,
    icon text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    PRIMARY KEY (id)
);

CREATE INDEX idx_wedding_budget_categories_wedding_id ON public.wedding_budget_categories(wedding_id);

-- 4. Tâches du mariage (DÉPEND DE: weddings, prestataires, lieux_reception, wedding_budget_categories)
CREATE TABLE public.wedding_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    wedding_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    task_type text DEFAULT 'general',
    priority text DEFAULT 'moyenne',
    status text DEFAULT 'a_faire',
    due_date date,
    completed_at timestamp with time zone,
    estimated_cost numeric(10,2),
    prestataire_id uuid,
    lieu_reception_id uuid,
    budget_category_id uuid,
    notes text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE SET NULL,
    FOREIGN KEY (lieu_reception_id) REFERENCES lieux_reception(id) ON DELETE SET NULL,
    FOREIGN KEY (budget_category_id) REFERENCES wedding_budget_categories(id) ON DELETE SET NULL,
    PRIMARY KEY (id),
    CHECK (task_type IN ('general', 'prestataire', 'lieu', 'admin')),
    CHECK (priority IN ('basse', 'moyenne', 'haute', 'critique')),
    CHECK (status IN ('a_faire', 'en_cours', 'termine', 'annule'))
);

CREATE INDEX idx_wedding_tasks_wedding_id ON public.wedding_tasks(wedding_id);
CREATE INDEX idx_wedding_tasks_status ON public.wedding_tasks(status);
CREATE INDEX idx_wedding_tasks_prestataire_id ON public.wedding_tasks(prestataire_id);
CREATE INDEX idx_wedding_tasks_lieu_reception_id ON public.wedding_tasks(lieu_reception_id);

-- 5. Dépenses du mariage (DÉPEND DE: weddings, wedding_budget_categories, wedding_tasks)
CREATE TABLE public.wedding_expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    wedding_id uuid NOT NULL,
    budget_category_id uuid,
    task_id uuid,
    name text NOT NULL,
    description text,
    estimated_amount numeric(10,2),
    actual_amount numeric(10,2),
    payment_status text DEFAULT 'non_paye',
    payment_date date,
    payment_method text,
    receipt_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_category_id) REFERENCES wedding_budget_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES wedding_tasks(id) ON DELETE SET NULL,
    PRIMARY KEY (id),
    CHECK (payment_status IN ('non_paye', 'acompte', 'solde', 'complet'))
);

CREATE INDEX idx_wedding_expenses_wedding_id ON public.wedding_expenses(wedding_id);
CREATE INDEX idx_wedding_expenses_budget_category_id ON public.wedding_expenses(budget_category_id);

-- 6. Galerie d'inspirations (DÉPEND DE: weddings)
CREATE TABLE public.wedding_inspirations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    wedding_id uuid NOT NULL,
    title text,
    image_url text NOT NULL,
    source_url text,
    category text,
    tags text[],
    notes text,
    is_favorite boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    PRIMARY KEY (id),
    CHECK (category IN ('decoration', 'tenue', 'coiffure', 'maquillage', 'fleurs', 'gateau', 'theme', 'autre'))
);

CREATE INDEX idx_wedding_inspirations_wedding_id ON public.wedding_inspirations(wedding_id);
CREATE INDEX idx_wedding_inspirations_category ON public.wedding_inspirations(category);

-- 7. Timeline / Jalons du jour J (DÉPEND DE: weddings)
CREATE TABLE public.wedding_milestones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    wedding_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    scheduled_time time,
    duration_minutes integer,
    location text,
    contact_person text,
    contact_phone text,
    notes text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    PRIMARY KEY (id)
);

CREATE INDEX idx_wedding_milestones_wedding_id ON public.wedding_milestones(wedding_id);

-- =========================================
--  TABLE : carrousel
--  Description : Gère les publicités payantes
--  et leur position sur la page d'accueil.
-- =========================================

CREATE TABLE public.carrousels (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    lien_sponsoriser VARCHAR(255),
    position INTEGER,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
--  ROW LEVEL SECURITY (RLS) : carrousels
-- =========================================

-- Activer RLS
ALTER TABLE public.carrousels ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "Allow admin insert" ON public.carrousels;
DROP POLICY IF EXISTS "Allow admin update" ON public.carrousels;
DROP POLICY IF EXISTS "Allow admin delete" ON public.carrousels;
DROP POLICY IF EXISTS "Allow public read" ON public.carrousels;

-- Politique pour permettre aux admins d'insérer
CREATE POLICY "Allow admin insert" ON public.carrousels
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Politique pour permettre aux admins de mettre à jour
CREATE POLICY "Allow admin update" ON public.carrousels
FOR UPDATE
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Politique pour permettre aux admins de supprimer
CREATE POLICY "Allow admin delete" ON public.carrousels
FOR DELETE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Politique pour permettre à TOUS de lire
CREATE POLICY "Allow public read" ON public.carrousels
FOR SELECT
USING (true);