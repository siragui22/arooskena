'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function ReceptionPage() {
  const [lieux, setLieux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadLieux = async () => {
      try {
        let query = supabase
          .from('lieux_receptions')
          .select(`
            *,
            prestataires (
              nom_entreprise,
              description,
              telephone,
              email,
              website
            )
          `);

        if (filter !== 'all') {
          query = query.eq('prestataires.categorie', 'lieu_reception');
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erreur lors du chargement des lieux:', error);
          setLieux([]);
        } else {
          setLieux(data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des lieux:', error);
        setLieux([]);
      } finally {
        setLoading(false);
      }
    };

    loadLieux();
  }, [filter]);

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
            Lieux de Réception
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les plus beaux lieux de réception à Djibouti pour votre mariage
          </p>
        </div>

        {/* Filtres */}
        <div className="flex justify-center mb-8">
          <div className="join">
            <button
              className={`join-item btn ${filter === 'all' ? 'btn-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous
            </button>
            <button
              className={`join-item btn ${filter === 'hotel' ? 'btn-active' : ''}`}
              onClick={() => setFilter('hotel')}
            >
              Hôtels
            </button>
            <button
              className={`join-item btn ${filter === 'restaurant' ? 'btn-active' : ''}`}
              onClick={() => setFilter('restaurant')}
            >
              Restaurants
            </button>
            <button
              className={`join-item btn ${filter === 'salle' ? 'btn-active' : ''}`}
              onClick={() => setFilter('salle')}
            >
              Salles privées
            </button>
          </div>
        </div>

        {/* Liste des lieux */}
        {lieux.length === 0 ? (
          <div className="text-center py-12">
            <div className="alert alert-info max-w-md mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Aucun lieu de réception disponible pour le moment.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lieux.map((lieu) => (
              <div key={lieu.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <figure className="px-6 pt-6">
                  <div className="w-full h-48 relative rounded-lg overflow-hidden">
                    {lieu.images && lieu.images.length > 0 ? (
                      <Image
                        src={lieu.images[0]}
                        alt={lieu.nom}
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
                  </div>
                </figure>
                <div className="card-body">
                  <h2 className="card-title">{lieu.nom}</h2>
                  <p className="text-gray-600 text-sm">{lieu.adresse}</p>
                  
                  {lieu.description && (
                    <p className="text-gray-700 mt-2">{lieu.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {lieu.capacite_min && lieu.capacite_max && (
                      <div className="badge badge-primary">
                        {lieu.capacite_min}-{lieu.capacite_max} personnes
                      </div>
                    )}
                    {lieu.prix_location && (
                      <div className="badge badge-secondary">
                        À partir de {lieu.prix_location}€
                      </div>
                    )}
                  </div>

                  {lieu.services_inclus && lieu.services_inclus.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Services inclus :</p>
                      <div className="flex flex-wrap gap-1">
                        {lieu.services_inclus.map((service, index) => (
                          <span key={index} className="badge badge-outline badge-sm">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-primary btn-sm">
                      Voir détails
                    </button>
                    <button className="btn btn-outline btn-sm">
                      Contacter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-base-100 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vous êtes prestataire de lieux de réception ?
            </h2>
            <p className="text-gray-600 mb-6">
              Rejoignez notre plateforme et faites découvrir votre établissement aux futurs mariés.
            </p>
            <button className="btn btn-primary btn-lg">
              Devenir prestataire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}