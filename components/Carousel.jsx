

import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

// La fonction pour charger les données est maintenant à l'extérieur et réutilisable
async function getCarouselItems() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';

  // Si Supabase n'est pas configuré, retourner les images statiques
  if (supabaseUrl === 'https://your-project.supabase.co') {
    return [
      { id: 1, image_url: '/carousel/1.jpg', titre: 'Slide 1' },
      { id: 2, image_url: '/carousel/2.jpg', titre: 'Slide 2' },
      { id: 3, image_url: '/carousel/3.jpg', titre: 'Slide 3' },
      { id: 4, image_url: '/carousel/4.jpg', titre: 'Slide 4' },
    ];
  }

  // Essayer de fetch depuis Supabase
  try {
    const { data, error } = await supabase
      .from('carousel_items')
      .select('*')
      .eq('is_active', true)
      .order('ordre', { ascending: true });

    if (error || !data || data.length === 0) {
      throw new Error('Supabase fetch failed or returned no data');
    }

    return data;
  } catch (error) {
    console.error('Carousel fetch error:', error.message);
    // En cas d'erreur, retourner les images statiques comme fallback
    return [
      { id: 1, image_url: '/carousel/1.jpg', titre: 'Slide 1' },
      { id: 2, image_url: '/carousel/2.jpg', titre: 'Slide 2' },
      { id: 3, image_url: '/carousel/3.jpg', titre: 'Slide 3' },
      { id: 4, image_url: '/carousel/4.jpg', titre: 'Slide 4' },
    ];
  }
}

// Le composant Carousel est maintenant un Server Component (async)
const Carousel = async () => {
  const carouselItems = await getCarouselItems();

  if (!carouselItems || carouselItems.length === 0) {
    // Affiche un placeholder si aucune image n'est disponible
    return (
      <div className="w-[1102px] h-[343px] mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Le carrousel est actuellement indisponible.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1102px] h-[343px] mx-auto">
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
              // La prop 'priority' précharge la première image, améliorant le LCP
              priority={index === 0}
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
                className="btn btn-circle btn-ghost text-white"
              >
                ❮
              </a>
              <a
                href={`#slide${(index + 1) % carouselItems.length}`}
                className="btn btn-circle btn-ghost text-white"
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
