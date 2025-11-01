'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Carousel from './Carousel'

interface CarouselSlide {
  id: number
  titre: string
  description: string
  image: string
  lien_sponsoriser: string | null
  position: number
  actif: boolean
}

export default function CarouselWrapper() {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('carrousels')
        .select('*')
        .eq('actif', true)
        .order('position', { ascending: true })

      if (error) throw error
      setSlides(data || [])
    } catch (error) {
      console.error('Erreur carrousel:', error)
      setSlides([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-96 lg:h-[500px] bg-gray-200 rounded-2xl animate-pulse" />
    )
  }

  if (slides.length === 0) {
    return null
  }

  return <Carousel slides={slides} autoPlay={true} autoPlayInterval={5000} />
}
