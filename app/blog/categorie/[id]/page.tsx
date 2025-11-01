import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Heart, ArrowRight } from 'lucide-react';

async function getArticlesByCategory(id) {
  const supabase = createClient();
  
  // Trouver la catégorie par son ID
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('id', id)
    .single();

  if (categoryError || !categoryData) {
    notFound();
  }

  // Récupérer les articles associés à cette catégorie
  const { data: articlesData, error: articlesError } = await supabase
    .from('articles')
    .select('*, categories(name)')
    .eq('categorie_id', id)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (articlesError) {
    console.error('Error fetching articles by category:', articlesError);
    return { category: categoryData, articles: [] };
  }

  // Récupérer les catégories pour chaque article (elles devraient déjà être incluses mais on les rajoute pour être sûr)
  const articlesWithCategories = await Promise.all(articlesData.map(async (article) => {
    if (article.categorie_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .eq('id', article.categorie_id)
        .single();
        
      if (!categoryError) {
        return { ...article, category: categoryData };
      }
    }
    return { ...article, category: null };
  }));

  return { category: categoryData, articles: articlesWithCategories };
}

function ArticleCard({ article }) {
  return (
    <Link href={`/blog/${article.slug}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors">{article.title}</h2>
        <div className="flex items-center text-xs text-gray-400 mb-4 space-x-4">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1.5" />
            <span>{new Date(article.published_at).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center">
            <Heart size={14} className="mr-1.5" />
            <span>{article.views_count || 0} vues</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-5 line-clamp-3">{article.excerpt}</p>
        <div className="text-primary font-semibold text-sm flex items-center group-hover:gap-2 transition-all">
          Lire l&apos;article <ArrowRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      {article.featured_image && (
        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-xl h-48 relative">
            <Image 
              src={article.featured_image} 
              alt={article.title} 
              fill
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>
        </div>
      )}
    </Link>
  );
}

export default async function CategoryPage({ params }) {
  const { category, articles } = await getArticlesByCategory(params.id);

  return (
    <div className="bg-pink-50 min-h-screen justify-center">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-pink-500 mb-4">Catégorie: {category.name}</h1>
          <p className="text-lg text-gray-600">Articles dans la catégorie {category.name}</p>
        </header>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 justify-items-center items-center">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun article trouvé pour cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}