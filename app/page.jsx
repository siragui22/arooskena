import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  Sparkles, 
  MapPin, 
  Heart, 
  BadgeCheck, 
  Gem, 
  Calendar,
  ClipboardList,
  Lightbulb,
  Building2,
  PartyPopper,
  Star,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import CarouselWrapper from '@/components/CarouselWrapper';
import { supabase } from '@/lib/supabaseClient';

// Fonction pour charger les données côté serveur
async function getHomePageData() {
  const data = {
    prestataires: [],
    lieux: [],
    articles: [],
    stats: {
      prestataireCount: 0,
      lieuxCount: 0,
      mariagesCount: 200,
      couplesCount: 1000
    }
  };

  try {
    // Charger les prestataires en vedette (4 max)
    const { data: prestataireData } = await supabase
      .from('prestataires')
      .select(`
        *,
        categories(name, label),
        prestataire_images(url, is_main)
      `)
      .eq('is_verified', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (prestataireData) {
      // Charger les adresses
      const ids = prestataireData.map(p => p.adresse_id).filter(Boolean);
      let addressesById = {};
      if (ids.length > 0) {
        const { data: addrRows } = await supabase
          .from('adresses')
          .select('*')
          .in('id', ids);
        if (addrRows) {
          addressesById = addrRows.reduce((acc, row) => {
            acc[row.id] = row;
            return acc;
          }, {});
        }
      }
      data.prestataires = prestataireData.map(p => ({ 
        ...p, 
        address: p.adresse_id ? addressesById[p.adresse_id] || null : null 
      }));
    }

    // Charger les lieux en vedette (4 max)
    const { data: lieuxData } = await supabase
      .from('lieux_reception')
      .select(`
        *,
        lieu_types(name, label),
        lieu_reception_images(url, is_main)
      `)
      .eq('is_verified', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (lieuxData) {
      // Charger les adresses
      const ids = lieuxData.map(l => l.adresse_id).filter(Boolean);
      let addressesById = {};
      if (ids.length > 0) {
        const { data: addrRows } = await supabase
          .from('adresses')
          .select('*')
          .in('id', ids);
        if (addrRows) {
          addressesById = addrRows.reduce((acc, row) => {
            acc[row.id] = row;
            return acc;
          }, {});
        }
      }
      data.lieux = lieuxData.map(l => ({ 
        ...l, 
        address: l.adresse_id ? addressesById[l.adresse_id] || null : null 
      }));
    }

    // Charger les articles du blog (3 max)
    const { data: articlesData } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        reading_time_minutes,
        created_at,
        views_count,
        is_featured
      `)
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3);

    if (articlesData) {
      data.articles = articlesData;
    }

    // Charger les statistiques réelles
    const { count: prestataireCount } = await supabase
      .from('prestataires')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    const { count: lieuxCount } = await supabase
      .from('lieux_reception')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    data.stats.prestataireCount = prestataireCount || 0;
    data.stats.lieuxCount = lieuxCount || 0;

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }

  return data;
}

export default async function HomePage() {
  const { prestataires, lieux, articles, stats } = await getHomePageData();

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Section Carrousel Publicitaire */}
      <section className="w-full py-6 sm:py-8 md:py-12 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-4">
          <CarouselWrapper />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative w-full py-16 sm:py-20 md:py-24 lg:py-32 px-4 bg-gradient-to-br from-pink-100 via-pink-50 to-orange-50">
        {/* Motif décoratif en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white shadow-lg text-pink-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">La plateforme N°1 pour votre mariage à Djibouti</span>
          </div>
          
          {/* Titre Principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight px-2">
            Votre mariage de rêve<br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
              commence ici
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Trouvez les meilleurs prestataires et lieux de réception<br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>pour créer le mariage parfait à Djibouti
          </p>

          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center max-w-2xl mx-auto">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3.5 md:py-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full hover:from-pink-600 hover:to-orange-500 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2 justify-center text-base md:text-lg whitespace-nowrap">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                <span>Commencer l'organisation</span>
              </button>
            </Link>
            <Link href="/prestataire" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3.5 md:py-4 bg-white text-pink-600 rounded-full hover:bg-gray-50 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2 justify-center text-base md:text-lg whitespace-nowrap border-2 border-pink-200">
                <Users className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                <span>Découvrir les prestataires</span>
              </button>
            </Link>
          </div>

          {/* Indicateurs de confiance */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-10 sm:mt-12 text-sm sm:text-base text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-pink-500" />
              <span className="font-medium">100% Gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-pink-500" />
              <span className="font-medium">Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-pink-500" />
              <span className="font-medium">Prestataires vérifiés</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Services */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* En-tête Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <PartyPopper className="w-3 h-3 sm:w-4 sm:h-4" />
              Nos Services
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 px-4">
              Tout pour votre mariage
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Des solutions complètes pour organiser le mariage de vos rêves à Djibouti
            </p>
          </div>

          {/* Grille de services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Carte Lieux de réception */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-pink-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Lieux de Réception
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
                Découvrez les plus beaux espaces pour célébrer votre union
              </p>
              <Link href="/reception" className="block">
                <button className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-xl hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base">
                  Voir plus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Carte Prestataires */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-pink-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Prestataires
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
                Trouvez les meilleurs professionnels du mariage
              </p>
              <Link href="/prestataire" className="block">
                <button className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-xl hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base">
                  Voir plus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Carte Planification */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8 text-pink-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Planification
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
                Organisez votre mariage étape par étape avec nos outils
              </p>
              <Link href="/dashboard" className="block">
                <button className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-xl hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base">
                  Voir plus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Carte Inspiration */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-pink-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Inspiration & Idées
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
                Conseils et tendances pour un mariage unique
              </p>
              <Link href="/blog" className="block">
                <button className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-xl hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base">
                  Voir plus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Outils & Inspiration */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* En-tête Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
              Outils & Inspiration
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 px-4">
              Organisez avec simplicité
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Des outils gratuits et des idées pour planifier votre mariage parfait
            </p>
          </div>

          {/* Outils gratuits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-6 sm:p-8 border-2 border-pink-100">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-pink-500 mb-3 sm:mb-4 mx-auto sm:mx-0" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Liste de Tâches
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 text-center sm:text-left">
                Suivez toutes les étapes de préparation de votre mariage
              </p>
              <Link href="/dashboard" className="block">
                <span className="text-pink-600 font-semibold hover:text-pink-700 flex items-center gap-2 justify-center sm:justify-start text-sm sm:text-base">
                  Découvrir <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-6 sm:p-8 border-2 border-pink-100">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-pink-500 mb-3 sm:mb-4 mx-auto sm:mx-0" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Gestion Budget
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 text-center sm:text-left">
                Maîtrisez vos dépenses et optimisez votre budget mariage
              </p>
              <Link href="/dashboard" className="block">
                <span className="text-pink-600 font-semibold hover:text-pink-700 flex items-center gap-2 justify-center sm:justify-start text-sm sm:text-base">
                  Découvrir <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-6 sm:p-8 border-2 border-pink-100 sm:col-span-2 lg:col-span-1">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-pink-500 mb-3 sm:mb-4 mx-auto sm:mx-0" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center sm:text-left">
                Plan de Table
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 text-center sm:text-left">
                Organisez le placement de vos invités facilement
              </p>
              <Link href="/dashboard" className="block">
                <span className="text-pink-600 font-semibold hover:text-pink-700 flex items-center gap-2 justify-center sm:justify-start text-sm sm:text-base">
                  Découvrir <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

          {/* Articles du blog */}
          {articles.length > 0 && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 text-center px-4">
                Inspiration & Conseils
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {articles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`}>
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
                      {/* Image */}
                      <div className="relative h-44 sm:h-48 overflow-hidden">
                        {article.featured_image ? (
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                            <Lightbulb className="w-12 h-12 text-pink-300" />
                          </div>
                        )}
                        {article.is_featured && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              En vedette
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="p-4 sm:p-6">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {article.title}
                        </h4>
                        {article.excerpt && (
                          <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          {article.reading_time_minutes && (
                            <span>{article.reading_time_minutes} min de lecture</span>
                          )}
                          <span className="text-pink-600 font-medium group-hover:underline">
                            Lire l'article →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-8 sm:mt-10">
                <Link href="/blog">
                  <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white border-2 border-pink-300 text-pink-600 rounded-full hover:bg-pink-50 transition-all duration-300 font-semibold shadow-sm hover:shadow-md inline-flex items-center gap-2 text-sm sm:text-base">
                    Voir tous les articles
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section Prestataires & Lieux mis en avant */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* En-tête Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Gem className="w-3 h-3 sm:w-4 sm:h-4" />
              Sélection Premium
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 px-4">
              Nos partenaires en vedette
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Découvrez nos prestataires et lieux vérifiés et recommandés
            </p>
          </div>

          {/* Prestataires en vedette */}
          {prestataires.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center justify-center sm:justify-start gap-3 px-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                Prestataires recommandés
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {prestataires.map((prestataire) => {
                  const mainImage = prestataire.prestataire_images?.find(img => img.is_main) || prestataire.prestataire_images?.[0];
                  const firstAddress = prestataire.address || null;

                  return (
                    <div
                      key={prestataire.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      {/* Image */}
                      <div className="relative h-40 sm:h-44 overflow-hidden">
                        {mainImage ? (
                          <Image
                            src={mainImage.url}
                            alt={prestataire.nom_entreprise}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                            <Users className="w-12 h-12 text-pink-300" />
                          </div>
                        )}
                        {prestataire.is_featured && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <Gem className="w-3 h-3" />
                              Vedette
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h4 className="text-base font-semibold text-gray-800 mb-2 line-clamp-1">
                          {prestataire.nom_entreprise}
                        </h4>
                        
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-1 bg-pink-600 text-white rounded-full text-xs">
                            {prestataire.categories?.label || 'Service'}
                          </span>
                          {prestataire.is_verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" />
                              Vérifié
                            </span>
                          )}
                        </div>

                        {firstAddress && (
                          <p className="text-gray-500 text-xs flex items-center gap-1 mb-3 line-clamp-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {firstAddress.commune}
                          </p>
                        )}

                        <Link href={`/prestataire/${prestataire.id}`} className="block">
                          <button className="w-full px-3 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:from-pink-500 hover:to-orange-400 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md">
                            Voir la fiche
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center mt-6 sm:mt-8">
                <Link href="/prestataire">
                  <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white border-2 border-pink-300 text-pink-600 rounded-full hover:bg-pink-50 transition-all duration-300 font-semibold shadow-sm hover:shadow-md inline-flex items-center gap-2 text-sm sm:text-base">
                    Voir tous les prestataires
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Lieux en vedette */}
          {lieux.length > 0 && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center justify-center sm:justify-start gap-3 px-4">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                Lieux de réception recommandés
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {lieux.map((lieu) => {
                  const mainImage = lieu.lieu_reception_images?.find(img => img.is_main) || lieu.lieu_reception_images?.[0];
                  const firstAddress = lieu.address || null;

                  return (
                    <div
                      key={lieu.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      {/* Image */}
                      <div className="relative h-40 sm:h-44 overflow-hidden">
                        {mainImage ? (
                          <Image
                            src={mainImage.url}
                            alt={lieu.nom_lieu}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-pink-300" />
                          </div>
                        )}
                        {lieu.is_featured && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <Gem className="w-3 h-3" />
                              Vedette
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h4 className="text-base font-semibold text-gray-800 mb-2 line-clamp-1">
                          {lieu.nom_lieu}
                        </h4>
                        
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-1 bg-pink-600 text-white rounded-full text-xs">
                            {lieu.lieu_types?.label || 'Lieu'}
                          </span>
                          {lieu.is_verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" />
                              Vérifié
                            </span>
                          )}
                        </div>

                        {firstAddress && (
                          <p className="text-gray-500 text-xs flex items-center gap-1 mb-3 line-clamp-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {firstAddress.commune}
                          </p>
                        )}

                        <Link href={`/reception/${lieu.id}`} className="block">
                          <button className="w-full px-3 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:from-pink-500 hover:to-orange-400 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md">
                            Voir la fiche
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center mt-6 sm:mt-8">
                <Link href="/reception">
                  <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white border-2 border-pink-300 text-pink-600 rounded-full hover:bg-pink-50 transition-all duration-300 font-semibold shadow-sm hover:shadow-md inline-flex items-center gap-2 text-sm sm:text-base">
                    Voir tous les lieux
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section CTA plein écran */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-gradient-to-r from-pink-500 to-orange-400">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4 leading-tight">
            Rejoignez Arooskena et simplifiez<br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>votre mariage à Djibouti
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-white/95 mb-8 sm:mb-10 max-w-2xl mx-auto px-4 leading-relaxed">
            Accédez gratuitement à tous nos outils de planification et trouvez les meilleurs prestataires pour votre grand jour
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white text-pink-600 rounded-full hover:bg-gray-50 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2 justify-center text-sm sm:text-base">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Créer un compte gratuit
              </button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white rounded-full hover:bg-white/30 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base">
                Se connecter
              </button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-white/90 text-xs sm:text-sm px-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Inscription gratuite</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Support dédié</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* En-tête Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              Arooskena en chiffres
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 px-4">
              Une plateforme de confiance
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-500 mb-1 sm:mb-2">
                {stats.prestataireCount}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium px-2">Prestataires vérifiés</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-500 mb-1 sm:mb-2">
                {stats.lieuxCount}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium px-2">Lieux de réception</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-500 mb-1 sm:mb-2">
                {stats.mariagesCount}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium px-2">Mariages organisés</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-500 mb-1 sm:mb-2">
                {stats.couplesCount}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium px-2">Couples satisfaits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* En-tête Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              Témoignages
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 px-4">
              Ils nous font confiance
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Découvrez les expériences de couples qui ont organisé leur mariage avec Arooskena
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Témoignage 1 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic leading-relaxed">
                &quot;Arooskena nous a permis de trouver tous nos prestataires en un seul endroit. Une plateforme vraiment complète et facile à utiliser !&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-600 font-bold text-sm sm:text-lg">A&M</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">Amina & Mohamed</p>
                  <p className="text-xs sm:text-sm text-gray-500">Mariés en 2024</p>
                </div>
              </div>
            </div>

            {/* Témoignage 2 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic leading-relaxed">
                &quot;Les outils de planification sont géniaux ! Nous avons pu tout organiser sans stress. Merci Arooskena !&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-600 font-bold text-sm sm:text-lg">F&Y</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">Fatouma & Youssouf</p>
                  <p className="text-xs sm:text-sm text-gray-500">Mariés en 2024</p>
                </div>
              </div>
            </div>

            {/* Témoignage 3 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 md:col-span-2 lg:col-span-1">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic leading-relaxed">
                &quot;Les prestataires sont tous vérifiés et de qualité. Nous avons trouvé notre lieu de rêve grâce à Arooskena !&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-600 font-bold text-sm sm:text-lg">H&A</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">Hodan & Ali</p>
                  <p className="text-xs sm:text-sm text-gray-500">Mariés en 2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section finale - Devenir Prestataire/Lieu */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Carte Prestataire */}
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl shadow-sm p-8 sm:p-10 md:p-12 border-2 border-pink-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 to-orange-300 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                Vous êtes prestataire ?
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Rejoignez notre plateforme et développez votre activité en vous connectant avec les futurs mariés de Djibouti.
              </p>
              
              <Link href="/prestataires/setup" className="block">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-full hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 justify-center text-sm sm:text-base">
                  Devenir prestataire
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Link>
              
              <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 text-center sm:text-left">
                Inscription gratuite • Vérification rapide • Support dédié
              </p>
            </div>

            {/* Carte Lieu de réception */}
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl shadow-sm p-8 sm:p-10 md:p-12 border-2 border-pink-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 to-orange-300 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                Vous gérez un lieu ?
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Inscrivez votre lieu de réception sur notre plateforme et attirez plus de clients pour vos événements.
              </p>
              
              <Link href="/receptions/setup" className="block">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-full hover:from-pink-500 hover:to-orange-400 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 justify-center text-sm sm:text-base">
                  Inscrire mon lieu
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Link>
              
              <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 text-center sm:text-left">
                Inscription gratuite • Vérification rapide • Support dédié
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
