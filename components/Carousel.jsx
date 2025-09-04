

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';

const Carousel = () => {
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCarouselItems = async () => {
      try {
        // Vérifier si Supabase est configuré
        if (supabaseUrl === 'https://your-project.supabase.co') {
          // Utiliser les images statiques par défaut
          setCarouselItems([
            { id: 1, image_url: '/carousel/1.jpg', titre: 'Slide 1' },
            { id: 2, image_url: '/carousel/2.jpg', titre: 'Slide 2' },
            { id: 3, image_url: '/carousel/3.jpg', titre: 'Slide 3' },
            { id: 4, image_url: '/carousel/4.jpg', titre: 'Slide 4' },
          ]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('carousel_items')
          .select('*')
          .eq('is_active', true)
          .order('ordre', { ascending: true });

        if (error) {
          console.error('Erreur lors du chargement du carrousel:', error);
          // Fallback vers les images statiques
          setCarouselItems([
            { id: 1, image_url: '/carousel/1.jpg', titre: 'Slide 1' },
            { id: 2, image_url: '/carousel/2.jpg', titre: 'Slide 2' },
            { id: 3, image_url: '/carousel/3.jpg', titre: 'Slide 3' },
            { id: 4, image_url: '/carousel/4.jpg', titre: 'Slide 4' },
          ]);
        } else {
          setCarouselItems(data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du carrousel:', error);
        // Fallback vers les images statiques
        setCarouselItems([
          { id: 1, image_url: '/carousel/1.jpg', titre: 'Slide 1' },
          { id: 2, image_url: '/carousel/2.jpg', titre: 'Slide 2' },
          { id: 3, image_url: '/carousel/3.jpg', titre: 'Slide 3' },
          { id: 4, image_url: '/carousel/4.jpg', titre: 'Slide 4' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCarouselItems();
  }, []);

  if (loading) {
    return (
      <div className="w-[1102px] h-[343px] mx-auto flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (carouselItems.length === 0) {
    return null;
  }

  return (
    <div className="w-[1102px] h-[343px] mx-auto">
      <div className="carousel w-full h-full rounded-lg overflow-hidden shadow-lg">
        {carouselItems.map((item, index) => (
          <div
            id={`slide${index}`}
            key={item.id || index}
            className="carousel-item relative w-full"
          >
            <Image
              src={item.image_url}
              alt={item.titre || `Slide ${index + 1}`}
              width={1102}
              height={343}
              className="w-full h-full object-cover"
            />
            {item.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <h3 className="text-lg font-bold">{item.titre}</h3>
                <p className="text-sm">{item.description}</p>
              </div>
            )}
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <a
                href={`#slide${(index - 1 + carouselItems.length) % carouselItems.length}`}
                className="btn btn-circle"
              >
                ❮
              </a>
              <a
                href={`#slide${(index + 1) % carouselItems.length}`}
                className="btn btn-circle"
              >
                ❯
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
