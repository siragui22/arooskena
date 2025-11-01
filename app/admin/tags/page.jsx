'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Hash, Search, X, Edit, Trash2, PlusCircle } from 'lucide-react';
import FormattedDate from '@/components/FormattedDate';

// Helper function to generate a slug
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

export default function AdminTagsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagForm, setTagForm] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('roles(name)')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData || userData.roles?.name !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      await loadTags();
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error);
      // TODO: Add toast notification for error
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setTagForm(prev => ({
      ...prev,
      name: newName,
      slug: editingTag ? prev.slug : slugify(newName) // Auto-generate slug only on creation
    }));
  };

  const resetForm = () => {
    setShowTagForm(false);
    setEditingTag(null);
    setTagForm({ name: '', slug: '', description: '' });
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    if (tagForm.name.length < 2) {
        // TODO: toast notification
        alert('Le nom du tag doit contenir au moins 2 caractères.');
        return;
    }

    try {
      let error;
      if (editingTag) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from('tags')
          .update({ ...tagForm, updated_at: new Date().toISOString() })
          .eq('id', editingTag.id);
        error = updateError;
      } else {
        // Création
        const { error: insertError } = await supabase
          .from('tags')
          .insert(tagForm);
        error = insertError;
      }

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
            alert(`Erreur: Le nom ou le slug '${error.details.includes('slug') ? tagForm.slug : tagForm.name}' existe déjà.`);
        } else {
            throw error;
        }
      } else {
        resetForm();
        await loadTags();
        // TODO: Add success toast
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde du tag:', error);
      alert('Une erreur est survenue. Vérifiez la console pour plus de détails.');
    }
  };

  const handleTagEdit = (tag) => {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || ''
    });
    setShowTagForm(true);
    window.scrollTo(0, 0);
  };

  const handleTagDelete = async (tag) => {
    if (tag.usage_count > 0) {
      alert(`Suppression impossible : le tag est utilisé dans ${tag.usage_count} article(s).`);
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tag.name}" ?`)) {
      try {
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('id', tag.id);
        
        if (error) throw error;

        await loadTags();
        // TODO: Add success toast
      } catch (error) {
        console.error('Erreur lors de la suppression du tag:', error);
        alert('Une erreur est survenue lors de la suppression.');
      }
    }
  };

  const filteredTags = useMemo(() => {
    if (!searchTerm) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tags, searchTerm]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Hash className="h-8 w-8 text-primary" />
                Gestion des Tags
              </h1>
              <p className="text-gray-500 mt-1">
                Créez, modifiez et organisez les tags pour les articles de blog.
              </p>
            </div>
            <Link href="/admin/platform" className="btn-aroos-outline">
              ← Retour à la plateforme
            </Link>
          </div>
        </header>

        {showTagForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 animate-fade-in-up">
            <form onSubmit={handleTagSubmit} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
                {editingTag ? '✏️ Modifier le tag' : '➕ Ajouter un nouveau tag'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tagName" className="block text-sm font-medium text-gray-600 mb-1">Nom du tag *</label>
                  <input
                    id="tagName"
                    type="text"
                    required
                    minLength="2"
                    value={tagForm.name}
                    onChange={handleNameChange}
                    className="input-aroos w-full"
                    placeholder="Ex: Technologie"
                  />
                </div>
                <div>
                  <label htmlFor="tagSlug" className="block text-sm font-medium text-gray-600 mb-1">Slug *</label>
                  <input
                    id="tagSlug"
                    type="text"
                    required
                    value={tagForm.slug}
                    onChange={(e) => setTagForm({...tagForm, slug: slugify(e.target.value)})}
                    className="input-aroos w-full bg-gray-50"
                    placeholder="Ex: technologie"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tagDescription" className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  id="tagDescription"
                  value={tagForm.description}
                  onChange={(e) => setTagForm({...tagForm, description: e.target.value})}
                  className="input-aroos w-full"
                  rows="3"
                  placeholder="Courte description du tag..."
                />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <button type="submit" className="btn-aroos">
                  {editingTag ? '💾 Mettre à jour' : '➕ Ajouter le tag'}
                </button>
                <button type="button" onClick={resetForm} className="btn-aroos-outline">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Rechercher par nom ou slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-aroos w-full pl-10"
                />
                {searchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 cursor-pointer" onClick={() => setSearchTerm('')} />}
            </div>
            {!showTagForm && (
                <button onClick={() => { setShowTagForm(true); setEditingTag(null); }} className="btn-aroos w-full md:w-auto">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Créer un tag
                </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisations</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTags.length > 0 ? filteredTags.map(tag => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">{tag.name}</div>
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{tag.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{tag.description || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tag.usage_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {tag.usage_count}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><FormattedDate dateString={tag.created_at} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleTagEdit(tag)} className="text-indigo-600 hover:text-indigo-900" title="Modifier">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleTagDelete(tag)} 
                        className={`${tag.usage_count > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                        disabled={tag.usage_count > 0}
                        title={tag.usage_count > 0 ? 'Suppression impossible (tag utilisé)' : 'Supprimer'}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan="5" className="text-center py-12">
                            <div className="text-gray-500">
                                <Hash className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun tag trouvé</h3>
                                <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Essayez de modifier votre recherche.' : 'Commencez par créer un nouveau tag.'}</p>
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
