'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Briefcase, Building2, Mail, Phone, Lock, User, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function StudioArooskenaPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
    // Le nom de l'entreprise sera collecté dans le setup (prestataires ou lieux)
  })

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const generateSlug = (userId: string, first: string, last: string) => {
    return `${userId}-${first}-${last}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { email, password, first_name, last_name, phone } = formData

    try {
      // Étape 1 : création via Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError || !authData.user?.id) {
        alert(`Erreur lors de l'inscription : ${signUpError?.message || 'Utilisateur non créé'}`)
        setLoading(false)
        return
      }

      const auth_user_id = authData.user.id

      // Étape 2 : récupérer l'ID du rôle "entreprise"
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'entreprise')
        .single()

      if (roleError || !roleData) {
        alert(`Erreur : le rôle "entreprise" n'existe pas dans la base de données`)
        setLoading(false)
        return
      }

      const entreprise_role_id = roleData.id

      // Étape 3 : vérifier si l'email existe déjà dans users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, phone')
        .eq('email', email)
        .single()

      let user_id: string

      if (existingUser) {
        // ✅ Utilisateur existe déjà, mettre à jour son rôle vers "entreprise"
        console.log('✅ Utilisateur existant trouvé, mise à jour du rôle vers entreprise')
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role_id: entreprise_role_id,
            phone: phone || existingUser.phone
          })
          .eq('id', existingUser.id)

        if (updateError) {
          console.error('❌ Erreur mise à jour rôle:', updateError)
          alert(`Erreur lors de la mise à jour du rôle : ${updateError.message}`)
          setLoading(false)
          return
        }

        console.log('✅ Rôle mis à jour vers entreprise')
        user_id = existingUser.id
      } else {
        // Étape 4 : insertion dans users avec role_id = "entreprise"
        console.log('✅ Création nouveau utilisateur avec rôle entreprise')
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{ 
            auth_user_id, 
            email, 
            phone, 
            role_id: entreprise_role_id,
            is_active: true 
          }])
          .select('id')

        if (userError || !userData || userData.length === 0) {
          console.error('❌ Erreur création utilisateur:', userError)
          alert(`Erreur lors de la création du compte : ${userError?.message || 'Utilisateur non enregistré'}`)
          setLoading(false)
          return
        }

        console.log('✅ Utilisateur créé avec rôle entreprise')
        user_id = userData[0].id
      }

      // Étape 5 : insertion dans profiles avec slug
      const slug = generateSlug(user_id, first_name, last_name)

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ user_id, first_name, last_name, slug }])

      if (profileError) {
        alert(`Erreur lors de l'enregistrement du profil : ${profileError.message}`)
        setLoading(false)
        return
      }

      alert('🎉 Bienvenue dans le Studio Arooskena !')
      // Rediriger vers la page de choix d'annuaire
      router.push('/Studio-Arooskena/onboarding')
    } catch (error) {
      console.error('Erreur inscription:', error)
      alert('Une erreur est survenue lors de l\'inscription')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header avec retour */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Retour</span>
        </Link>
      </div>

      <div className="flex min-h-screen">
        {/* Colonne gauche - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-400 via-pink-500 to-orange-400 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          {/* Pattern décoratif */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="relative z-10 max-w-md">
            <div className="mb-8">
              <Briefcase className="w-20 h-20 mb-6" />
              <h1 className="text-5xl font-bold mb-4">Studio Arooskena</h1>
              <p className="text-xl text-pink-100">
                Votre espace professionnel pour gérer votre activité et développer votre visibilité
              </p>
            </div>

            {/* Avantages */}
            <div className="space-y-4 mt-12">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Vitrine professionnelle</h3>
                  <p className="text-pink-100 text-sm">Page dédiée avec photos, services et tarifs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Gestion des demandes</h3>
                  <p className="text-pink-100 text-sm">Recevez et gérez les demandes de devis</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Statistiques détaillées</h3>
                  <p className="text-pink-100 text-sm">Suivez vos performances et votre visibilité</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite - Formulaire */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Header mobile */}
            <div className="lg:hidden mb-8 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-pink-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Studio Arooskena</h1>
              <p className="text-gray-600">Rejoignez notre réseau de prestataires</p>
            </div>

            {/* Formulaire */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer votre compte</h2>
                <p className="text-gray-600 text-sm">
                  Déjà inscrit ? <Link href="/sign-in" className="text-pink-600 hover:text-pink-700 font-semibold">Se connecter</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom et Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="first_name"
                        type="text"
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="last_name"
                        type="text"
                        placeholder="Doe"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Le nom de l'entreprise sera demandé dans le setup (étape 2) */}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email professionnel
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      placeholder="contact@entreprise.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+253 77 12 34 56"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                </div>

                {/* CGV */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    J&apos;accepte les{' '}
                    <Link href="/terms" className="text-pink-600 hover:text-pink-700 font-medium">
                      conditions générales
                    </Link>{' '}
                    et la{' '}
                    <Link href="/privacy" className="text-pink-600 hover:text-pink-700 font-medium">
                      politique de confidentialité
                    </Link>
                  </label>
                </div>

                {/* Bouton Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Inscription en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Rejoindre le Studio</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-6">
              En créant un compte, vous rejoignez le réseau de prestataires Arooskena
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
