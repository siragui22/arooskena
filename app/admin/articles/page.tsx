'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FileText, PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import FormattedDate from '@/components/FormattedDate';

const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export default function AdminArticlesPage() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [allData, setAllData] = useState({ categories: [], subcategories: [], tags: [], lieu_types: [] });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState(getInitialFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  function getInitialFormState() {
    return {
      id: null, title: '', slug: '', content: '', excerpt: '',
      categorie_id: '', subcategorie_id: '', lieu_type_id: '',
      is_published: false, featured_image: null, tag_ids: [],
    };
  }

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/sign-in');

      const { data: userData } = await supabase.from('users').select('roles(name)').eq('auth_user_id', user.id).single();
      const userRole = userData?.roles && 'name' in userData.roles ? (userData.roles as { name: string }).name : null;
      if (userRole !== 'admin') return router.push('/dashboard');

      await loadInitialData();
      setLoading(false);
    };
    checkAdminAndLoadData();
  }, [router]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedArticle) {
        setFormState({
          id: selectedArticle.id,
          title: selectedArticle.title || '',
          slug: selectedArticle.slug || '',
          content: selectedArticle.content || '',
          excerpt: selectedArticle.excerpt || '',
          categorie_id: selectedArticle.categorie_id || '',
          subcategorie_id: selectedArticle.subcategorie_id || '',
          lieu_type_id: selectedArticle.lieu_type_id || '',
          is_published: selectedArticle.is_published || false,
          featured_image: selectedArticle.featured_image || null,
          tag_ids: selectedArticle.article_tags ? selectedArticle.article_tags.map(t => t.tag_id) : [],
        });
      } else {
        setFormState(getInitialFormState());
      }
    }
  }, [selectedArticle, isFormOpen]);

  async function loadInitialData() {
    try {
      const [articlesRes, categoriesRes, subcategoriesRes, tagsRes, lieuTypesRes] = await Promise.all([
        supabase.from('articles').select('*, category:categories(name), article_tags(tag_id)').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name'),
        supabase.from('subcategories').select('id, name, category_id'),
        supabase.from('tags').select('id, name'),
        supabase.from('lieu_types').select('id, name'),
      ]);
      setArticles(articlesRes.data || []);
      setAllData({
        categories: categoriesRes.data || [],
        subcategories: subcategoriesRes.data || [],
        tags: tagsRes.data || [],
        lieu_types: lieuTypesRes.data || [],
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setFormState(prev => ({ ...prev, title: newTitle, slug: !prev.id ? slugify(newTitle) : prev.slug }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormState(prev => ({ ...prev, featured_image: e.target.files[0] }));
    }
  };

  const handleTagChange = (tagId) => {
    setFormState(prev => {
      const newTagIds = prev.tag_ids.includes(tagId) ? prev.tag_ids.filter(id => id !== tagId) : [...prev.tag_ids, tagId];
      return { ...prev, tag_ids: newTagIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let imageUrl = formState.featured_image;
    if (formState.featured_image && typeof formState.featured_image !== 'string') {
      const file = formState.featured_image;
      const filePath = `public/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('images_articles').upload(filePath, file);
      if (uploadError) {
        alert('Erreur lors du téléversement de l’image.');
        setIsSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('images_articles').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    const { id, tag_ids, ...articleData } = formState;
    const dataToSave = {
      ...articleData,
      featured_image: imageUrl,
      content: articleData.content || '',
      // Convert empty strings to null for foreign keys
      categorie_id: articleData.categorie_id || null,
      subcategorie_id: articleData.subcategorie_id || null,
      lieu_type_id: articleData.lieu_type_id || null,
    };

    let result;
    if (id) {
      result = await supabase.from('articles').update(dataToSave).eq('id', id);
    } else {
      result = await supabase.from('articles').insert(dataToSave).select().single();
    }

    if (result.error) {
      alert('Erreur: ' + result.error.message);
    } else {
      const articleId = id || result.data.id;
      await supabase.from('article_tags').delete().eq('article_id', articleId);
      if (tag_ids.length > 0) {
        const tagsToInsert = tag_ids.map(tag_id => ({ article_id: articleId, tag_id }));
        await supabase.from('article_tags').insert(tagsToInsert);
      }
      alert(`Article ${id ? 'mis à jour' : 'créé'} avec succès!`);
      closeForm();
      await loadInitialData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;
    const { error } = await supabase.from('articles').delete().eq('id', articleToDelete.id);
    if (error) {
      alert('Erreur: ' + error.message);
    } else {
      alert('Article supprimé.');
      setArticleToDelete(null);
      await loadInitialData();
    }
  };

  const openForm = (article = null) => {
    setSelectedArticle(article);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedArticle(null);
  };

  const filteredArticles = useMemo(() => {
    if (!searchTerm) return articles;
    return articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [articles, searchTerm]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="loader-aroos"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Gestion des Articles
          </h1>
          {!isFormOpen && <button onClick={() => openForm()} className="btn-aroos"><PlusCircle className="h-5 w-5 mr-2" />Ajouter un article</button>}
        </header>

        {isFormOpen ? (
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{selectedArticle ? "Modifier l'article" : 'Nouvel article'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-aroos">Titre</label>
                <input type="text" required minLength={5} value={formState.title} onChange={handleTitleChange} className="input-aroos w-full" />
              </div>
              <div>
                <label className="label-aroos">Slug</label>
                <input type="text" required name="slug" value={formState.slug} onChange={handleInputChange} className="input-aroos w-full bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-aroos">Catégorie</label>
                  <select required name="categorie_id" value={formState.categorie_id} onChange={handleInputChange} className="input-aroos w-full">
                    <option value="">Sélectionner</option>
                    {allData.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-aroos">Sous-catégorie</label>
                  <select name="subcategorie_id" value={formState.subcategorie_id} onChange={handleInputChange} className="input-aroos w-full">
                    <option value="">Sélectionner</option>
                    {allData.subcategories.filter(sc => sc.category_id === formState.categorie_id).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-aroos">Extrait</label>
                <textarea name="excerpt" value={formState.excerpt} onChange={handleInputChange} className="input-aroos w-full" rows={3}></textarea>
              </div>
              <div>
                <label className="label-aroos">Image</label>
                <input type="file" onChange={handleFileChange} accept="image/*" className="input-aroos w-full" />
              </div>
              <div>
                <label className="label-aroos">Tags</label>
                <div className="p-3 border rounded-lg max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allData.tags.map(tag => (
                    <div key={tag.id} className="flex items-center">
                      <input type="checkbox" id={`tag-${tag.id}`} checked={formState.tag_ids.includes(tag.id)} onChange={() => handleTagChange(tag.id)} className="h-4 w-4 rounded" />
                      <label htmlFor={`tag-${tag.id}`} className="ml-2 text-sm">{tag.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-aroos">Contenu</label>
                <textarea required name="content" value={formState.content} onChange={handleInputChange} className="input-aroos w-full" rows={10}></textarea>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="is_published" checked={formState.is_published} onChange={(e) => setFormState({...formState, is_published: e.target.checked})} className="h-4 w-4 rounded" />
                <label htmlFor="is_published" className="ml-2">Publier</label>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={closeForm} className="btn-aroos-outline">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-aroos">{isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="relative w-full md:w-1/3 mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-aroos w-full pl-10" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArticles.map(article => (
                    <tr key={article.id}>
                      <td className="px-6 py-4"><div className="font-medium">{article.title}</div><div className="text-sm text-gray-500">/{article.slug}</div></td>
                      <td className="px-6 py-4">{article.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4"><span className={`badge ${article.is_published ? 'badge-success' : 'badge-warning'}`}>{article.is_published ? 'Publié' : 'Brouillon'}</span></td>
                      <td className="px-6 py-4"><FormattedDate dateString={article.created_at} /></td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openForm(article)} className="text-indigo-600"><Edit size={18} /></button>
                        <button onClick={() => setArticleToDelete(article)} className="text-red-600"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {articleToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-8">
              <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
              <p>Supprimer l'article "{articleToDelete.title}" ?</p>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setArticleToDelete(null)} className="btn-aroos-outline">Annuler</button>
                <button onClick={handleDelete} className="btn-aroos bg-red-600">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}