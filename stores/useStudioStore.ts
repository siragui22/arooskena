import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'

interface StudioState {
  lieux: any[]
  prestataires: any[]
  loading: boolean
  error: string | null
  filter: 'all' | 'lieux' | 'prestataires'
  setFilter: (filter: 'all' | 'lieux' | 'prestataires') => void
  loadLieux: (userId: string) => Promise<void>
  loadPrestataires: (userId: string) => Promise<void>
  loadAll: (userId: string) => Promise<void>
  deleteLieu: (lieuId: string) => Promise<void>
  deletePrestataire: (prestataireId: string) => Promise<void>
}

export const useStudioStore = create<StudioState>((set, get) => ({
  lieux: [],
  prestataires: [],
  loading: false,
  error: null,
  filter: 'all',

  setFilter: (filter) => set({ filter }),

  loadLieux: async (userId) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('lieux_reception')
        .select(`
          *,
          lieu_types(label),
          adresses(region, commune),
          lieu_reception_images(url, is_main)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ lieux: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  loadPrestataires: async (userId) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('prestataires')
        .select(`
          *,
          categories(label),
          subcategories(label),
          adresses(region, commune),
          prestataire_images(url, is_main)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ prestataires: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  loadAll: async (userId) => {
    const { loadLieux, loadPrestataires } = get()
    await Promise.all([loadLieux(userId), loadPrestataires(userId)])
  },

  deleteLieu: async (lieuId) => {
    try {
      set({ loading: true, error: null })

      // Récupérer les images pour les supprimer du storage
      const { data: lieu } = await supabase
        .from('lieux_reception')
        .select('lieu_reception_images(url)')
        .eq('id', lieuId)
        .single()

      // Supprimer les images du storage
      if (lieu?.lieu_reception_images && lieu.lieu_reception_images.length > 0) {
        const imageUrls = lieu.lieu_reception_images.map((img: any) => {
          const url = new URL(img.url)
          return url.pathname.split('/').pop()
        })
        
        await supabase.storage
          .from('lieu_reception_images')
          .remove(imageUrls)
      }

      // Supprimer le lieu
      const { error } = await supabase
        .from('lieux_reception')
        .delete()
        .eq('id', lieuId)

      if (error) throw error

      // Mettre à jour le state local
      set(state => ({
        lieux: state.lieux.filter(l => l.id !== lieuId),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deletePrestataire: async (prestataireId) => {
    try {
      set({ loading: true, error: null })

      // Récupérer les images
      const { data: prestataire } = await supabase
        .from('prestataires')
        .select('prestataire_images(url)')
        .eq('id', prestataireId)
        .single()

      // Supprimer les images du storage
      if (prestataire?.prestataire_images && prestataire.prestataire_images.length > 0) {
        const imageUrls = prestataire.prestataire_images.map((img: any) => {
          const url = new URL(img.url)
          return url.pathname.split('/').pop()
        })
        
        await supabase.storage
          .from('prestataire_images')
          .remove(imageUrls)
      }

      // Supprimer le prestataire
      const { error } = await supabase
        .from('prestataires')
        .delete()
        .eq('id', prestataireId)

      if (error) throw error

      // Mettre à jour le state local
      set(state => ({
        prestataires: state.prestataires.filter(p => p.id !== prestataireId),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))
