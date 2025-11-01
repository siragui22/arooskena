'use client';

import Link from 'next/link';

export default function AnnuairesSection({ annuaires, userRole }) {
  const { prestataires, lieux } = annuaires;
  const totalAnnuaires = prestataires.length + lieux.length;

  // Rôles autorisés à créer des annuaires
  const canCreateAnnuaire = ['prestataire', 'entreprise', 'admin'].includes(userRole);

  if (!canCreateAnnuaire) {
    return null; // Ne rien afficher pour les autres rôles
  }

  return (
    <div className="section-aroos">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="icon-aroos mr-3">🏢</span>
          Mes Annuaires ({totalAnnuaires})
        </h2>
        {totalAnnuaires === 0 && (
          <div className="flex gap-3">
            <Link href="/prestataires/setup" className="btn-aroos">
              ➕ Créer Prestataire
            </Link>
            <Link href="/receptions/setup" className="btn-aroos-outline">
              ➕ Créer Lieu
            </Link>
          </div>
        )}
      </div>

      {totalAnnuaires === 0 ? (
        <div className="empty-state text-center py-12">
          <div className="empty-state-icon text-6xl mb-6">🏢</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Créez votre premier annuaire
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Commencez par créer un annuaire de prestataire ou un lieu de réception 
            pour apparaître dans notre plateforme et attirer de nouveaux clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/prestataires/setup" className="btn-aroos btn-lg">
              🎨 Créer un Prestataire
            </Link>
            <Link href="/receptions/setup" className="btn-aroos-outline btn-lg">
              🏛️ Créer un Lieu de Réception
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Prestataires */}
          {prestataires.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-4 flex items-center">
                <span className="mr-2">🎨</span>
                Prestataires ({prestataires.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prestataires.map((prestataire) => (
                  <Link
                    key={prestataire.id}
                    href="/prestataires"
                    className="card-hover p-6 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-gray-800">
                        {prestataire.nom_entreprise}
                      </h4>
                      {prestataire.is_verified && (
                        <span className="badge-aroos bg-green-500 text-xs">
                          ✓ Vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {prestataire.description || 'Aucune description'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prestataire.categories && (
                        <span className="badge-aroos bg-blue-500 text-xs">
                          {prestataire.categories.label}
                        </span>
                      )}
                      {prestataire.subscription_types && (
                        <span className="badge-aroos bg-purple-500 text-xs">
                          {prestataire.subscription_types.name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Lieux de réception */}
          {lieux.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-4 flex items-center">
                <span className="mr-2">🏛️</span>
                Lieux de Réception ({lieux.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lieux.map((lieu) => (
                  <Link
                    key={lieu.id}
                    href="/receptions"
                    className="card-hover p-6 rounded-lg border-2 border-transparent hover:border-purple-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-gray-800">
                        {lieu.nom_lieu}
                      </h4>
                      {lieu.is_verified && (
                        <span className="badge-aroos bg-green-500 text-xs">
                          ✓ Vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {lieu.description || 'Aucune description'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lieu.lieu_types && (
                        <span className="badge-aroos bg-purple-500 text-xs">
                          {lieu.lieu_types.label}
                        </span>
                      )}
                      {lieu.capacite_min && lieu.capacite_max && (
                        <span className="badge-aroos bg-gray-500 text-xs">
                          👥 {lieu.capacite_min}-{lieu.capacite_max} pers.
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bouton d'ajout */}
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/prestataires/setup" className="btn-aroos-outline">
              ➕ Nouveau Prestataire
            </Link>
            <Link href="/receptions/setup" className="btn-aroos-outline">
              ➕ Nouveau Lieu
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
