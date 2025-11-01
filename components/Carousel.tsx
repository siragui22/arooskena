'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselSlide {
  id: number
  titre: string
  description: string
  image: string
  lien_sponsoriser: string | null
  position: number
  actif: boolean
}

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

export default function Carousel({ 
  slides, 
  autoPlay = true, 
  autoPlayInterval = 5000 
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)

  const activeSlides = slides.filter(slide => slide.actif)

  useEffect(() => {
    if (!isAutoPlaying || activeSlides.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, activeSlides.length, autoPlayInterval])

  if (activeSlides.length === 0) {
    return null
  }

  const currentSlide = activeSlides[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeSlides.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(autoPlay)

  return (
    <div 
      className="relative w-full h-96 lg:h-[500px] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Image */}
            <Image
              src={slide.image}
              alt={slide.titre}
              fill
              className="object-cover"
              priority={index === 0}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-12 text-white">
              <h2 className="text-3xl lg:text-5xl font-bold mb-3 line-clamp-2">
                {slide.titre}
              </h2>
              <p className="text-base lg:text-lg text-gray-200 mb-6 line-clamp-2">
                {slide.description}
              </p>

              {/* CTA Button */}
              {slide.lien_sponsoriser && (
                <Link
                  href={slide.lien_sponsoriser}
                  className="inline-flex w-fit px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Découvrir
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 lg:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Slide précédent"
      >
        <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 lg:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Slide suivant"
      >
        <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {activeSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'bg-gradient-to-r from-pink-400 to-orange-300 w-8 h-3'
                : 'bg-white/50 hover:bg-white/75 w-3 h-3'
            }`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentIndex + 1} / {activeSlides.length}
      </div>
    </div>
  )
}
