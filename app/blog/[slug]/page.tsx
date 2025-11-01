import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import FormattedDate from '@/components/FormattedDate';
import Link from 'next/link';
import Image from 'next/image';

async function getArticle(slug) {
  const supabase = createClient();
  
  // D'abord, récupérer l'article
  const { data: articleData, error: articleError } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (articleError || !articleData) {
    notFound();
  }

  // Récupérer la catégorie associée
  let category = null;
  if (articleData.categorie_id) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('name, id')
      .eq('id', articleData.categorie_id)
      .single();
      
    if (!categoryError) {
      category = categoryData;
    }
  }

  // Récupérer les tags associés
  const { data: articleTagsData, error: articleTagsError } = await supabase
    .from('article_tags')
    .select('tag_id')
    .eq('article_id', articleData.id);

  let tags = [];
  if (!articleTagsError && articleTagsData) {
    const tagIds = articleTagsData.map(at => at.tag_id);
    if (tagIds.length > 0) {
      const { data: tagDetails, error: tagError } = await supabase
        .from('tags')
        .select('name, id, slug')
        .in('id', tagIds);
        
      if (!tagError) {
        tags = tagDetails;
      }
    }
  }

  // Combiner les données
  return {
    ...articleData,
    category,
    tags
  };
}

export default async function ArticlePage({ params }) {
  const article = await getArticle(params.slug);

  return (
    <div className="bg-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header avec cat\u00e9gorie, titre et m\u00e9tadonn\u00e9es */}
          <header className="p-8 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {article.category && (
                <Link 
                  href={`/blog/categorie/${article.category.id}`} 
                  className="px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-200 transition-colors"
                >
                  {article.category.name}
                </Link>
              )}
              
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <Link 
                      href={`/blog/tag/${tag.slug}`} 
                      key={tag.id} 
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{article.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
              <div className="flex items-center">
                <span>Publi\u00e9 le <FormattedDate dateString={article.published_at} /></span>
              </div>
              <div className="flex items-center">
                <span>{article.reading_time_minutes} min lecture</span>
              </div>
              <div className="flex items-center">
                <span>{article.views_count} vues</span>
              </div>
            </div>
          </header>

          {/* Image mise en avant */}
          {article.featured_image && (
            <div className="relative h-80 md:h-96 overflow-hidden">
              <div className="relative w-full h-full">
                <Image 
                  src={article.featured_image} 
                  alt={article.title} 
                  fill
                  className="object-cover" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
          )}

          {/* Contenu de l'article */}
          <div className="p-8">
            {article.excerpt && (
              <div className="mb-8 pb-6 border-b border-gray-100">
                <p className="text-xl text-gray-600 italic leading-relaxed">{article.excerpt}</p>
              </div>
            )}
            
            {/* Contenu principal */}
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} 
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
