'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useStudioStore } from '@/stores/useStudioStore'
import Link from 'next/link'
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Settings,
  TrendingUp,
  Trash2,
  PartyPopper,
  Briefcase,
  Filter,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react'

export default function MonStudio() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'lieu' | 'prestataire', name: string} | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const { 
    lieux, 
    prestataires, 
    filter, 
    setFilter, 
    loadAll,
    deleteLieu,
    deletePrestataire
  } = useStudioStore()
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Calculer les stats
  const stats = {
    totalLieux: lieux.length,
    totalPrestataires: prestataires.length,
    total: lieux.length + prestataires.length,
    actifs: lieux.filter((l: any) => l.is_active).length + prestataires.filter((p: any) => p.is_active).length,
    vues: 0
  }

  useEffect(() => {
    checkUser()
    
    // Messages de succès
    const created = searchParams.get('created')
    const deleted = searchParams.get('deleted')
    
    if (created === 'true') {
      setSuccessMessage('🎉 Félicitations ! Votre annuaire a été créé avec succès.')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
      window.history.replaceState({}, '', '/Mon-Studio')
    }
    
    if (deleted === 'true') {
      setSuccessMessage('✅ L\'annuaire a été supprimé avec succès.')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
      window.history.replaceState({}, '', '/Mon-Studio')
    }
  }, [])

  const checkUser = async () => {
    try {
      // Charger l'utilisateur depuis Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        console.log('❌ Pas d\'utilisateur connecté')
        router.push('/sign-in')
        return
      }

      console.log('✅ User connecté:', authUser.email)
      setUser(authUser)

      // Charger les données utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, profiles(*), roles(*)')
        .eq('auth_user_id', authUser.id)
        .single()

      if (userError) {
        console.error('❌ Erreur chargement user:', userError)
        throw userError
      }

      console.log('✅ UserData chargé:', userData)
      setUserData(userData)
      
      if (userData.roles?.name !== 'entreprise') {
        console.log('❌ Rôle incorrect:', userData.roles?.name)
        router.push('/')
        return
      }

      console.log('✅ Rôle entreprise confirmé, chargement des annuaires...')
      // Charger les données via le store
      await loadAll(userData.id)
      console.log('✅ Annuaires chargés - Lieux:', lieux.length, 'Prestataires:', prestataires.length)

      setLoading(false)
    } catch (error) {
      console.error('❌ Erreur checkUser:', error)
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string, type: 'lieu' | 'prestataire', name: string) => {
    setItemToDelete({ id, type, name })
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      setDeleting(true)
      
      if (itemToDelete.type === 'lieu') {
        await deleteLieu(itemToDelete.id)
      } else {
        await deletePrestataire(itemToDelete.id)
      }
      
      setSuccessMessage('✅ Annuaire supprimé avec succès.')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
      
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const mainImage = (item: any, type: 'lieu' | 'prestataire') => {
    const images = type === 'lieu' ? item.lieu_reception_images : item.prestataire_images
    const main = images?.find((img: any) => img.is_main)
    return main?.url || images?.[0]?.url || '/placeholder-lieu.jpg'
  }

  // Filtrer les items
  const filteredLieux = filter === 'all' || filter === 'lieux' ? lieux : []
  const filteredPrestataires = filter === 'all' || filter === 'prestataires' ? prestataires : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50">
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Supprimer l&apos;annuaire ?</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Êtes-vous sûr de vouloir supprimer définitivement <strong>{itemToDelete?.name}</strong> ?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Cette action est irréversible et toutes les données associées seront perdues.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-orange-300 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                Mon Studio
              </h1>
              <p className="text-gray-500 mt-1">
                Bienvenue {userData?.profiles?.first_name} ! Gérez vos annuaires professionnels
              </p>
            </div>
            
            <Link
              href="/Studio-Arooskena/onboarding"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Nouvel annuaire
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PartyPopper className="w-6 h-6 text-green-600" />
                <p className="font-medium text-green-900">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lieux</p>
                <p className="text-3xl font-bold text-pink-600 mt-1">{stats.totalLieux}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Prestataires</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.totalPrestataires}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Actifs</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.actifs}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Mes Informations */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-pink-600" />
              Mes Informations
            </h2>
            <Link
              href="/Mon-Studio/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-all font-medium"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{userData?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="font-medium text-gray-900">{userData?.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrer :</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilter('lieux')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'lieux' 
                  ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lieux ({stats.totalLieux})
            </button>
            <button
              onClick={() => setFilter('prestataires')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'prestataires' 
                  ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prestataires ({stats.totalPrestataires})
            </button>
          </div>
        </div>

        {/* Mes Annuaires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-pink-600" />
            Mes Annuaires
          </h2>

          {stats.total === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun annuaire pour le moment</h3>
              <p className="text-gray-500 mb-6">Créez votre premier annuaire professionnel</p>
              <Link
                href="/Studio-Arooskena/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Créer mon premier annuaire
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Lieux */}
              {filteredLieux.map((lieu: any) => (
                <div key={lieu.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={mainImage(lieu, 'lieu')}
                      alt={lieu.nom_lieu}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-pink-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Lieu
                      </span>
                      {lieu.is_verified && (
                        <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Vérifié
                        </span>
                      )}
                    </div>
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                      lieu.is_active !== false ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {lieu.is_active !== false ? 'Actif' : 'Inactif'}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{lieu.nom_lieu}</h3>
                    
                    {lieu.lieu_types && (
                      <span className="inline-block px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full mb-3">
                        {lieu.lieu_types.label}
                      </span>
                    )}

                    <div className="space-y-2 mb-4">
                      {lieu.adresses && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-1">{lieu.adresses.region}, {lieu.adresses.commune}</span>
                        </div>
                      )}
                      
                      {lieu.capacite_max && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>Jusqu&apos;à {lieu.capacite_max} personnes</span>
                        </div>
                      )}
                      
                      {lieu.prix_min && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{lieu.prix_min.toLocaleString()} Fdj</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/Mon-Studio/lieu/${lieu.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </Link>
                      <Link
                        href={`/reception/${lieu.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(lieu.id, 'lieu', lieu.nom_lieu)}
                        className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prestataires */}
              {filteredPrestataires.map((prestataire: any) => (
                <div key={prestataire.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={mainImage(prestataire, 'prestataire')}
                      alt={prestataire.nom_entreprise}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        Prestataire
                      </span>
                      {prestataire.is_verified && (
                        <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Vérifié
                        </span>
                      )}
                    </div>
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                      prestataire.is_active !== false ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {prestataire.is_active !== false ? 'Actif' : 'Inactif'}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{prestataire.nom_entreprise}</h3>
                    
                    {prestataire.categories && (
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full mb-3">
                        {prestataire.categories.label}
                      </span>
                    )}

                    <div className="space-y-2 mb-4">
                      {prestataire.adresses && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-1">{prestataire.adresses.region}</span>
                        </div>
                      )}
                      
                      {prestataire.prix_min && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>À partir de {prestataire.prix_min.toLocaleString()} Fdj</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/Mon-Studio/prestataire/${prestataire.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </Link>
                      <Link
                        href={`/prestataire/${prestataire.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(prestataire.id, 'prestataire', prestataire.nom_entreprise)}
                        className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
