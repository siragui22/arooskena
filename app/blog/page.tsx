'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Heart, Search, Sparkles, Camera, Music, Car, Users, Cake, Flower2, PartyPopper, Tag } from 'lucide-react';

// Featured Article Card (Large)
function FeaturedArticleCard({ article, tags }) {
  const articleTags = tags.filter(tag => article.tag_ids?.includes(tag.id));
  
  return (
    <Link href={`/blog/${article.slug}`} className="group block bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
      {article.featured_image && (
        <div className="relative h-80 overflow-hidden">
          <Image 
            src={article.featured_image} 
            alt={article.title} 
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      <div className="p-8">
        {article.category && (
          <span className="inline-block px-3 py-1 text-xs font-semibold text-pink-600 bg-pink-50 rounded-full mb-4 uppercase tracking-wide">
            {article.category.name}
          </span>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-pink-500 transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-gray-600 text-base mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        {articleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {articleTags.map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                <Tag size={12} />
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// Small Article Card
function SmallArticleCard({ article, tags }) {
  const articleTags = tags.filter(tag => article.tag_ids?.includes(tag.id));
  
  return (
    <Link href={`/blog/${article.slug}`} className="group flex gap-4 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden p-5">
      {article.featured_image && (
        <div className="relative w-32 h-28 rounded-xl overflow-hidden flex-shrink-0">
          <Image 
            src={article.featured_image} 
            alt={article.title} 
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
            sizes="128px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {article.category && (
          <span className="inline-block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {article.category.name}
          </span>
        )}
        <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-pink-500 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-1 mb-2">
          {article.excerpt}
        </p>
        {articleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {articleTags.slice(0, 2).map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('published_at'); // 'published_at' or 'views_count'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const articlesPerPage = 7; // 1 featured + 6 small articles

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // First, fetch all articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        setArticles([]);
        setLoading(false);
        return;
      }

      // For each article, fetch its associated category
      const articlesWithCategories = await Promise.all(articlesData.map(async (article) => {
        if (article.categorie_id) {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('name')
            .eq('id', article.categorie_id)
            .single();
            
          if (categoryError) {
            console.error('Error fetching category for article:', article.id, categoryError);
            return { ...article, category: null };
          }
          
          return { ...article, category: categoryData };
        } else {
          return { ...article, category: null };
        }
      }));
      
      // For each article, fetch its associated tags
      const articlesWithTags = await Promise.all(articlesData.map(async (article) => {
          const { data: articleTagsData, error: articleTagsError } = await supabase
            .from('article_tags')
            .select('tag_id')
            .eq('article_id', article.id);
            
          if (articleTagsError) {
            console.error('Error fetching tags for article:', article.id, articleTagsError);
            return { ...article, tag_ids: [] };
          }
          
          return { 
            ...article, 
            tag_ids: articleTagsData ? articleTagsData.map(at => at.tag_id) : [] 
          };
        }));
      
      setArticles(articlesWithTags);

      // Fetch all tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name');

      if (tagsError) {
        console.error('Error fetching tags:', tagsError);
        setTags([]);
      } else {
        setTags(tagsData || []);
      }

      // Fetch all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        setCategories([]);
      } else {
        setCategories(categoriesData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredAndSortedArticles = useMemo(() => {
    let result = [...articles];

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(article => article.category?.name === selectedCategory);
    }

    // Filter by tags - only show articles that have all selected tags
    if (selectedTags.length > 0) {
      result = result.filter(article => {
        const articleTagIds = article.tag_ids || [];
        return selectedTags.every(tagId => articleTagIds.includes(tagId));
      });
    }

    // Sort articles
    result.sort((a, b) => {
      if (sortBy === 'views_count') {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return result;
  }, [articles, selectedCategory, selectedTags, sortBy, searchQuery]);

  // Pagination logic
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredAndSortedArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredAndSortedArticles.length / articlesPerPage);

  // Category icons mapping
  const categoryIcons = {
    'Décoration': Sparkles,
    'Photographie': Camera,
    'Musique': Music,
    'Transport': Car,
    'Invités': Users,
    'Gâteaux': Cake,
    'Fleurs': Flower2,
    'Fêtes': PartyPopper
  };

  const featuredArticle = currentArticles[0];
  const smallArticles = currentArticles.slice(1);

  return (
    <div className="bg-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-pink-400 mb-4">
            Idées de Mariage
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Planifier un mariage est une expérience vraiment magique. Nous offrons notre expertise pour rendre le processus de planification amusant et sans stress, du début à la fin.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher des articles Arooskena"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all bg-white"
            />
          </div>
        </div>

        {/* Categories Circle */}
        <div className="mb-12 overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4 min-w-max justify-center">
            {/* All Categories Button */}
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`flex flex-col items-center gap-2 group transition-all ${
                selectedCategory === 'All' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                selectedCategory === 'All' 
                  ? 'bg-gradient-to-r from-pink-400 to-orange-300 scale-110' 
                  : 'bg-white group-hover:scale-105'
              }`}>
                <Sparkles 
                  size={32} 
                  className={selectedCategory === 'All' ? 'text-white' : 'text-gray-600'} 
                />
              </div>
              <span className={`text-xs font-medium text-center max-w-[80px] ${
                selectedCategory === 'All' ? 'text-pink-500' : 'text-gray-700'
              }`}>
                Tous
              </span>
            </button>

            {categories.map((cat) => {
              const IconComponent = categoryIcons[cat.name] || Sparkles;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex flex-col items-center gap-2 group transition-all ${
                    selectedCategory === cat.name ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                    selectedCategory === cat.name 
                      ? 'bg-gradient-to-r from-pink-400 to-orange-300 scale-110' 
                      : 'bg-white group-hover:scale-105'
                  }`}>
                    <IconComponent 
                      size={32} 
                      className={selectedCategory === cat.name ? 'text-white' : 'text-gray-600'} 
                    />
                  </div>
                  <span className={`text-xs font-medium text-center max-w-[80px] ${
                    selectedCategory === cat.name ? 'text-pink-500' : 'text-gray-700'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Articles Grid Layout */}
            {currentArticles.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6 mb-12">
                {/* Featured Article (Left) */}
                {featuredArticle && (
                  <div className="lg:row-span-2">
                    <FeaturedArticleCard article={featuredArticle} tags={tags} />
                  </div>
                )}

                {/* Small Articles (Right) */}
                <div className="space-y-6">
                  {smallArticles.slice(0, 3).map(article => (
                    <SmallArticleCard key={article.id} article={article} tags={tags} />
                  ))}
                </div>

                {/* Additional Small Articles (if exists) */}
                {smallArticles.length > 3 && (
                  <div className="lg:col-span-2 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {smallArticles.slice(3).map(article => (
                      <SmallArticleCard key={article.id} article={article} tags={tags} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Aucun article trouvé</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-pink-600 hover:bg-pink-50 border border-gray-200 shadow-sm'
                  }`}
                >
                  Précédent
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-10 h-10 rounded-full font-medium transition-all ${
                        currentPage === pageNumber
                          ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-200 shadow-sm'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-pink-600 hover:bg-pink-50 border border-gray-200 shadow-sm'
                  }`}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
