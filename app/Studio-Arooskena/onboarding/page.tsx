'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Briefcase, Building2, MapPin, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function StudioOnboarding() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/sign-in?redirect=/Studio-Arooskena/onboarding')
        return
      }

      // Vérifier si l'utilisateur a le rôle entreprise
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label),
          profiles(first_name, last_name)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (error || !userData) {
        console.error('Erreur chargement userData:', error)
        router.push('/sign-in?redirect=/Studio-Arooskena/onboarding')
        return
      }

      if (userData.roles?.name !== 'entreprise') {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setUserData(userData)
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const firstName = userData?.profiles?.first_name || 'là'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Studio Arooskena</h1>
                <p className="text-sm text-gray-600">Bienvenue {firstName} !</p>
              </div>
            </div>
            <Link 
              href="/"
              className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Dernière étape</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Créez votre annuaire professionnel
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le type d'annuaire qui correspond à votre activité pour apparaître sur Arooskena
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Prestataire */}
          <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-pink-400 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl">
            {/* Badge populaire */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-400 to-orange-300 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Populaire
            </div>

            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="w-8 h-8 text-pink-600" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Annuaire Prestataire
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                Pour les professionnels qui offrent des services de mariage
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Photographes, DJ, Traiteurs, Décorateurs</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Vitrine avec portfolio et services</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Gestion des demandes de devis</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Statistiques et avis clients</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => router.push('/Studio-Arooskena/setup/prestataire')}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>Créer mon annuaire prestataire</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Option 2: Lieu de Réception */}
          <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-pink-400 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl">
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Annuaire Lieu de Réception
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                Pour les établissements qui accueillent des événements
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Salles de fête, Hôtels, Restaurants</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Galerie photos et visite virtuelle</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Capacité et tarifs par personne</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Gestion des disponibilités</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => router.push('/Studio-Arooskena/setup/lieu')}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>Créer mon annuaire lieu</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Vous pouvez créer les deux types d'annuaires
              </h4>
              <p className="text-sm text-gray-600">
                Si votre activité combine services et lieu de réception, vous pourrez créer un deuxième annuaire plus tard depuis votre tableau de bord.
              </p>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <Link href="/contact" className="text-pink-600 hover:text-pink-700 font-medium">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
