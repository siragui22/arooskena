'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function AdminSubcategories() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
    category_id: ''
  });
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Vérifier si l'utilisateur est admin
      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label)
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (!userData || userData.roles?.name !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      await loadData();
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const loadData = async () => {
    try {
      // Charger les catégories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('label', { ascending: true });

      setCategories(categoriesData || []);

      // Charger les sous-catégories avec leurs catégories parentes
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories(name, label)
        `)
        .order('label', { ascending: true });

      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSubcategory) {
        // Mise à jour
        await supabase
          .from('subcategories')
          .update({
            name: formData.name,
            label: formData.label,
            description: formData.description,
            category_id: formData.category_id
          })
          .eq('id', editingSubcategory.id);
      } else {
        // Création
        await supabase
          .from('subcategories')
          .insert({
            name: formData.name,
            label: formData.label,
            description: formData.description,
            category_id: formData.category_id
          });
      }

      setShowForm(false);
      setEditingSubcategory(null);
      setFormData({
        name: '',
        label: '',
        description: '',
        category_id: ''
      });
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      name: subcategory.name,
      label: subcategory.label,
      description: subcategory.description || '',
      category_id: subcategory.category_id
    });
    setShowForm(true);
  };

  const handleDelete = async (subcategoryId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?')) {
      try {
        await supabase
          .from('subcategories')
          .delete()
          .eq('id', subcategoryId);

        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                📁 Gestion des Sous-catégories
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez les sous-catégories de la plateforme Arooskena
              </p>
            </div>
            <Link href="/admin" className="btn-aroos-outline">
              ← Retour à l'Admin
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">📁</div>
            <div className="text-2xl font-bold text-gray-800">{subcategories.length}</div>
            <div className="text-gray-600">Sous-catégories</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">📂</div>
            <div className="text-2xl font-bold text-gray-800">{categories.length}</div>
            <div className="text-gray-600">Catégories parentes</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">🔗</div>
            <div className="text-2xl font-bold text-gray-800">
              {new Set(subcategories.map(s => s.category_id)).size}
            </div>
            <div className="text-gray-600">Catégories utilisées</div>
          </div>
        </div>

        {/* Formulaire d'ajout/modification */}
        {showForm && (
          <div className="section-aroos mb-8 animate-fade-in-up">
            <div className="form-aroos">
              <h3 className="text-xl font-bold mb-6">
                {editingSubcategory ? '✏️ Modifier la sous-catégorie' : '➕ Ajouter une sous-catégorie'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom technique *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-aroos w-full"
                      placeholder="Ex: studio"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label d'affichage *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.label}
                      onChange={(e) => setFormData({...formData, label: e.target.value})}
                      className="input-aroos w-full"
                      placeholder="Ex: Studio photo"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie parente *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="input-aroos w-full"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-aroos w-full"
                    rows="3"
                    placeholder="Description de la sous-catégorie..."
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="btn-aroos">
                    {editingSubcategory ? '💾 Mettre à jour' : '➕ Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingSubcategory(null);
                      setFormData({
                        name: '',
                        label: '',
                        description: '',
                        category_id: ''
                      });
                    }}
                    className="btn-aroos-outline"
                  >
                    ❌ Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Liste des sous-catégories */}
        <div className="section-aroos animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">📁 Sous-catégories</h3>
            <button
              onClick={() => setShowForm(true)}
              className="btn-aroos"
            >
              ➕ Ajouter une sous-catégorie
            </button>
          </div>

          {subcategories.length === 0 ? (
            <div className="empty-state text-center py-8">
              <div className="empty-state-icon">📁</div>
              <p className="text-gray-600 mb-4">Aucune sous-catégorie créée</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-aroos"
              >
                Créer la première sous-catégorie
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-aroos w-full">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Nom technique</th>
                    <th>Catégorie parente</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subcategories.map((subcategory) => (
                    <tr key={subcategory.id}>
                      <td>
                        <div className="font-medium">{subcategory.label}</div>
                      </td>
                      <td>
                        <span className="badge-aroos bg-gray-500">
                          {subcategory.name}
                        </span>
                      </td>
                      <td>
                        <span className="badge-aroos bg-blue-500">
                          {subcategory.categories?.label || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {subcategory.description || 'Aucune description'}
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(subcategory)}
                            className="btn-aroos-outline btn-xs"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(subcategory.id)}
                            className="btn btn-error btn-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}












