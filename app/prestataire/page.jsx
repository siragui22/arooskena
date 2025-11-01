'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Sparkles, Search, MapPin, DollarSign, Heart, Eye, Phone, Home, BadgeCheck, Gem  } from "lucide-react";

export default function PrestatairePage() {
  const router = useRouter();
  const [prestataires, setPrestataires] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) {
          console.error('❌ Erreur lors du chargement des catégories:', categoriesError);
        } else {
          console.log('✅ Catégories chargées:', categoriesData?.length || 0);
          setCategories(categoriesData || []);
        }

        // Charger les prestataires avec leurs relations
        let query = supabase
          .from('prestataires')
          .select(`
            *,
            categories(name, label),
            subcategories(name, label),
            prestataire_images(url, is_main)
          `);
          
        // Filtrer par statut de vérification si demandé
        if (showOnlyVerified) {
          query = query.eq('is_verified', true);
        }

        if (filter !== 'all') {
          query = query.eq('categorie_id', filter);
        }

        if (searchTerm) {
          query = query.or(`nom_entreprise.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data: prestatairesData, error: prestatairesError } = await query
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        console.log('🔍 Requête prestataires:', {
          filter,
          searchTerm,
          prestatairesData,
          prestatairesError
        });

        if (prestatairesError) {
          console.error('❌ Erreur lors du chargement des prestataires:', prestatairesError);
          setPrestataires([]);
        } else {
          console.log('✅ Prestataires chargés:', prestatairesData?.length || 0);
          const list = prestatairesData || [];
          // Charger en lot les adresses référencées par adresse_id
          const ids = list.map(p => p.adresse_id).filter(Boolean);
          let addressesById = {};
          if (ids.length > 0) {
            const { data: addrRows, error: addrErr } = await supabase
              .from('adresses')
              .select('*')
              .in('id', ids);
            if (addrErr) {
              console.warn('⚠️ Erreur chargement adresses:', addrErr);
            } else {
              addressesById = (addrRows || []).reduce((acc, row) => {
                acc[row.id] = row;
                return acc;
              }, {});
            }
          }
          // Attacher address à chaque prestataire
          let withAddress = list.map(p => ({ ...p, address: p.adresse_id ? addressesById[p.adresse_id] || null : null }));

          // Fallback legacy pour ceux sans adresse_id ou non résolus
          const needLegacy = withAddress.filter(p => !p.address).map(p => p.id);
          if (needLegacy.length > 0) {
            const { data: legacyRows, error: legacyErr } = await supabase
              .from('prestataire_adresses')
              .select('prestataire_id, id, adresse, commune, region, pays, created_at')
              .in('prestataire_id', needLegacy)
              .order('created_at', { ascending: false });
            if (!legacyErr && legacyRows) {
              const firstLegacyByPrestataire = {};
              for (const row of legacyRows) {
                if (!firstLegacyByPrestataire[row.prestataire_id]) {
                  firstLegacyByPrestataire[row.prestataire_id] = { ...row, _legacy: true };
                }
              }
              withAddress = withAddress.map(p => (
                p.address ? p : { ...p, address: firstLegacyByPrestataire[p.id] || null }
              ));
            }
          }
          setPrestataires(withAddress);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setPrestataires([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filter, searchTerm, showOnlyVerified]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Chargement des prestataires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Hero Section - Design épuré comme l'image */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          {/* Badge Premium */}
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Plateforme de Prestataires Premium
          </div>
          
          {/* Titre Principal */}
          <h1 className="text-5xl md:text-6xl font-bold text-pink-400 mb-6 leading-tight">
            Prestataires de Mariage
          </h1>
          
          {/* Description */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Découvrez les meilleurs professionnels pour créer le mariage de vos rêves à Djibouti.<br/>
            Des prestataires vérifiés et passionnés à votre service.
          </p>

          {/* Statistiques */}
          <div className="flex items-center justify-center gap-8 text-sm text-pink-500 mb-12">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">{prestataires.length} prestataires</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">{prestataires.filter(p => p.is_verified).length} vérifiés</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        {/* Search and Filters - Design épuré comme l'image */}
        <section className="mb-12">
          <div className="container mx-auto max-w-4xl px-4">
            {/* Barre de recherche et checkbox */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8">
              {/* Barre de recherche */}
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Rechercher un prestataire..."
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Checkbox Vérifiés uniquement */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verified-only"
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-300"
                  checked={showOnlyVerified}
                  onChange={(e) => setShowOnlyVerified(e.target.checked)}
                />
                <label htmlFor="verified-only" className="text-gray-600 font-medium cursor-pointer"> <BadgeCheck/>
                  Vérifiés uniquement
                </label>
              </div>
            </div>

            {/* Filtres par catégorie - Style épuré */}
            <div className="flex justify-center">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    filter === 'all' 
                      ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white shadow-md hover:shadow-lg' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-500'
                  }`}
                  onClick={() => setFilter('all')}
                >
                  <Home className="w-4 h-4" />
                  Tous
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filter === category.id 
                        ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white shadow-md hover:shadow-lg' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-500'
                    }`}
                    onClick={() => setFilter(category.id)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results Counter - Style épuré */}
        {prestataires.length > 0 && (
          <div className="text-center mb-12">
            <p className="text-pink-500 font-medium">
              {prestataires.length} prestataire{prestataires.length > 1 ? 's' : ''} trouvé{prestataires.length > 1 ? 's' : ''}
              {showOnlyVerified && ' (vérifiés uniquement)'}
            </p>
          </div>
        )}

        {/* Providers Grid - Design simple et épuré */}
        <section className="mb-20">
          {prestataires.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-sm max-w-md mx-auto p-12">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Aucun prestataire trouvé</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}"`
                    : 'Aucun prestataire disponible pour le moment.'
                  }
                </p>
                {searchTerm && (
                  <button 
                    className="px-6 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-full hover:from-pink-500 hover:to-orange-400 transition-all duration-300 shadow-md hover:shadow-lg"
                    onClick={() => setSearchTerm('')}
                  >
                    Effacer la recherche
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prestataires.map((prestataire, index) => {
                // Trouver l'image principale
                const mainImage = prestataire.prestataire_images?.find(img => img.is_main) || prestataire.prestataire_images?.[0];
                // Adresse unique (via FK adresse_id) attachée comme `address`
                const firstAddress = prestataire.address || null;
                
                return (
                  <div 
                    key={prestataire.id} 
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {mainImage ? (
                        <Image
                          src={mainImage.url}
                          alt={prestataire.nom_entreprise}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                          <svg className="w-12 h-12 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      {prestataire.is_featured && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                            <Gem className="w-4 h-4 " />  En vedette
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {prestataire.nom_entreprise}
                      </h3>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-2 py-1 bg-pink-600 text-white rounded-full text-xs">
                          {prestataire.categories?.label || 'Non catégorisé'}
                        </span>
                        {prestataire.is_verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs flex items-center gap-1">
                            
                            <BadgeCheck/>
                            Vérifié
                          </span>
                        )}
                      </div>

                      {/* Adresse */}
                      {firstAddress && (
                        <p className="text-gray-500 text-sm flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {(firstAddress.adresse_complete || firstAddress.adresse)}, {firstAddress.commune}
                          </span>
                        </p>
                      )}
                      
                      {/* Description */}
                      {prestataire.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {prestataire.description}
                        </p>
                      )}

                      {/* Prix */}
                      {prestataire.prix_min && (
                        <p className="text-pink-600 font-semibold text-sm mb-4">
                          À partir de {prestataire.prix_min} FDJ
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {/* <button className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:from-pink-500 hover:to-orange-400 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg" onClick={() => router.push(`/prestataire/${prestataire.id}`)}>
                          Voir détails
                        </button> */}
                        <Link href={`/prestataire/${prestataire.id}`} className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:from-pink-500 hover:to-orange-400 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg">
                                                Voir détails
                                              </Link>
                        <button className="px-4 py-2 border border-pink-200 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA Section - Design épuré */}
        <section className="text-center">
          <div className="bg-white rounded-2xl shadow-sm max-w-4xl mx-auto p-12">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-pink-500" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Vous êtes prestataire de services de mariage ?
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Rejoignez notre plateforme et développez votre activité en vous connectant 
              avec les futurs mariés de Djibouti.
            </p>
            
            <Link href="/prestataires/setup">
              <button className="px-8 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-full hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                Devenir prestataire
              </button>
            </Link>
            
            <p className="text-sm text-gray-500 mt-4">
              Inscription gratuite • Vérification rapide • Support dédié
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
