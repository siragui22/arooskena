'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

export default function PrestatairePage() {
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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Prestataires de Mariage
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trouvez les meilleurs professionnels pour organiser votre mariage à Djibouti
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          <div className="form-control w-full max-w-md">
            <div className="input-group">
              <input
                type="text"
                placeholder="Rechercher un prestataire..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-square">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Filtre de vérification */}
          <div className="form-control">
            <label className="label cursor-pointer gap-3">
              <input
                type="checkbox"
                className="checkbox-aroos"
                checked={showOnlyVerified}
                onChange={(e) => setShowOnlyVerified(e.target.checked)}
              />
              <span className="label-text font-medium">Vérifiés uniquement</span>
            </label>
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap gap-2 justify-center max-w-4xl">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
            >
              <span className="mr-2">🏠</span>
              Tous
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`btn btn-sm ${filter === category.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(category.id)}
              >
                <span className="mr-2">🏢</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compteur de prestataires */}
        {prestataires.length > 0 && (
          <div className="text-center mb-6">
            <p className="text-gray-600">
              {prestataires.length} prestataire{prestataires.length > 1 ? 's' : ''} trouvé{prestataires.length > 1 ? 's' : ''}
              {showOnlyVerified && ' (vérifiés uniquement)'}
            </p>
          </div>
        )}

        {/* Liste des prestataires */}
        {prestataires.length === 0 ? (
          <div className="text-center py-12">
            <div className="alert alert-info max-w-md mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {searchTerm 
                  ? `Aucun prestataire trouvé pour "${searchTerm}"`
                  : 'Aucun prestataire disponible pour le moment.'
                }
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prestataires.map((prestataire) => {
              // Trouver l'image principale
              const mainImage = prestataire.prestataire_images?.find(img => img.is_main) || prestataire.prestataire_images?.[0];
              // Adresse unique (via FK adresse_id) attachée comme `address`
              const firstAddress = prestataire.address || null;
              
              return (
                <div key={prestataire.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                  <figure className="px-6 pt-6">
                    <div className="w-full h-48 relative rounded-lg overflow-hidden">
                      {mainImage ? (
                        <Image
                          src={mainImage.url}
                          alt={prestataire.nom_entreprise}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      {prestataire.is_featured && (
                        <div className="absolute top-2 right-2">
                          <div className="badge badge-primary">⭐ En vedette</div>
                        </div>
                      )}
                    </div>
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">{prestataire.nom_entreprise}</h2>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-outline">
                        {prestataire.categories?.label || 'Non catégorisé'}
                      </span>
                      {prestataire.subcategories && (
                        <span className="badge badge-secondary">
                          {prestataire.subcategories.label}
                        </span>
                      )}
                      {prestataire.is_verified ? (
                        <div className="badge badge-success gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Vérifié
                        </div>
                      ) : (
                        <div className="badge badge-warning gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          En attente
                        </div>
                      )}
                    </div>

                    {firstAddress && (
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {(firstAddress.adresse_complete || firstAddress.adresse)}, {firstAddress.commune}
                      </p>
                    )}
                    
                    {prestataire.description && (
                      <p className="text-gray-700 mt-2 line-clamp-3">{prestataire.description}</p>
                    )}

                    {prestataire.prix_min && prestataire.prix_max && (
                      <div className="flex items-center gap-2 mt-4">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <div className="flex align-center">
                        <span className="text-sm font-medium"> A partir de  ,
                          {prestataire.prix_min} FDJ
                        </span>
                        

                        </div>
                        {/* <span className="text-sm font-medium"> a partir de  jusqu'à
                          {prestataire.prix_min} FDJ jusqu'à {prestataire.prix_max} FDJ
                        </span> */}
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <button className="btn btn-outline btn-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <button className="btn btn-outline hover:bg-pink-600 hover:text-white btn-sm">
                        Voir détails
                      </button>
                      <button className="btn btn-secondary btn-sm">
                        Contacter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-base-100 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vous êtes prestataire de services de mariage ?
            </h2>
            <p className="text-gray-600 mb-6">
              Rejoignez notre plateforme et développez votre activité en vous connectant avec les futurs mariés.
            </p>
            <Link href="/prestataires/setup" className="btn btn-primary btn-lg">
              Devenir prestataire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}