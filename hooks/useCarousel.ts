import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface CarouselSlide {
  id: number
  titre: string
  description: string
  image: string
  lien_sponsoriser: string | null
  position: number
  actif: boolean
  created_at: string
  updated_at: string
}

export const useCarousel = () => {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('carrousels')
        .select('*')
        .eq('actif', true)
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      setSlides(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Erreur récupération carrousel:', err)
      setError(err.message)
      setSlides([])
    } finally {
      setLoading(false)
    }
  }

  const addSlide = async (slideData: Omit<CarouselSlide, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('carrousels')
        .insert([slideData])
        .select()

      if (insertError) throw insertError

      await fetchSlides()
      return data?.[0]
    } catch (err: any) {
      console.error('Erreur ajout slide:', err)
      throw err
    }
  }

  const updateSlide = async (id: number, slideData: Partial<CarouselSlide>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('carrousels')
        .update(slideData)
        .eq('id', id)
        .select()

      if (updateError) throw updateError

      await fetchSlides()
      return data?.[0]
    } catch (err: any) {
      console.error('Erreur mise à jour slide:', err)
      throw err
    }
  }

  const deleteSlide = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('carrousels')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchSlides()
    } catch (err: any) {
      console.error('Erreur suppression slide:', err)
      throw err
    }
  }

  return {
    slides,
    loading,
    error,
    fetchSlides,
    addSlide,
    updateSlide,
    deleteSlide
  }
}
