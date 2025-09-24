-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.prestataire_adresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prestataire_id uuid,
  adresse text,
  commune text,
  region text,
  pays text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestataire_adresses_pkey PRIMARY KEY (id),
  CONSTRAINT prestataire_adresses_prestataire_id_fkey FOREIGN KEY (prestataire_id) REFERENCES public.prestataires(id)
);
CREATE TABLE public.prestataire_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prestataire_id uuid,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestataire_images_pkey PRIMARY KEY (id),
  CONSTRAINT prestataire_images_prestataire_id_fkey FOREIGN KEY (prestataire_id) REFERENCES public.prestataires(id)
);
CREATE TABLE public.prestataire_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prestataire_id uuid,
  user_id uuid,
  note integer CHECK (note >= 1 AND note <= 5),
  commentaire text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestataire_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT prestataire_reviews_prestataire_id_fkey FOREIGN KEY (prestataire_id) REFERENCES public.prestataires(id),
  CONSTRAINT prestataire_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  prix_min numeric,
  prix_max numeric,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  subscription_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestataires_pkey PRIMARY KEY (id),
  CONSTRAINT prestataires_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT prestataires_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.categories(id),
  CONSTRAINT prestataires_subcategorie_id_fkey FOREIGN KEY (subcategorie_id) REFERENCES public.subcategories(id),
  CONSTRAINT prestataires_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscription_types(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar text,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  name text NOT NULL,
  label text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.subscription_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric,
  duration_months integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  email text NOT NULL UNIQUE,
  phone text UNIQUE,
  role_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);