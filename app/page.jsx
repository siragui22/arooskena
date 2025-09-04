import Carousel from '@/components/Carousel';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero Section avec Carousel */}
      <section className="py-12">
        <Carousel />
      </section>

      {/* Section Services */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Nos Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour organiser votre mariage parfait à Djibouti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="card-title justify-center">Lieux de Réception</h3>
                <p>Découvrez les plus beaux lieux pour votre réception</p>
                <div className="card-actions justify-center mt-4">
                  <Link href="/reception" className="btn btn-primary">
                    Voir les lieux
                  </Link>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">👰</div>
                <h3 className="card-title justify-center">Prestataires</h3>
                <p>Trouvez les meilleurs professionnels du mariage</p>
                <div className="card-actions justify-center mt-4">
                  <Link href="/prestataire" className="btn btn-primary">
                    Voir les prestataires
                  </Link>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="card-title justify-center">Planification</h3>
                <p>Organisez votre mariage étape par étape</p>
                <div className="card-actions justify-center mt-4">
                  <Link href="/sign-up" className="btn btn-primary">
                    Commencer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Call to Action */}
      <section className="py-16 bg-primary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à organiser votre mariage de rêve ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Rejoignez Arooskena et accédez à tous nos outils de planification
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn btn-secondary btn-lg">
              Créer un compte gratuit
            </Link>
            <Link href="/sign-in" className="btn btn-outline btn-lg">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100+</div>
              <div className="text-gray-600">Prestataires</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">50+</div>
              <div className="text-gray-600">Lieux de réception</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">200+</div>
              <div className="text-gray-600">Mariages organisés</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-info mb-2">1000+</div>
              <div className="text-gray-600">Couples satisfaits</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
