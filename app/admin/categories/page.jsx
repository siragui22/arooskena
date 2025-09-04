'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function AdminCategories() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
                const [categories, setCategories] = useState([]);
              const [showCategoryForm, setShowCategoryForm] = useState(false);
              const [editingCategory, setEditingCategory] = useState(null);
                const [categoryForm, setCategoryForm] = useState({
                name: '',
                label: '',
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
        .order('nom', { ascending: true });

      setCategories(categoriesData || []);

                        
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  // Gestion des catégories
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
                        if (editingCategory) {
                    // Mise à jour
                    await supabase
                      .from('categories')
                      .update({
                        name: categoryForm.name,
                        label: categoryForm.label,
                        description: categoryForm.description
                      })
                      .eq('id', editingCategory.id);
                  } else {
                    // Création
                    await supabase
                      .from('categories')
                      .insert({
                        name: categoryForm.name,
                        label: categoryForm.label,
                        description: categoryForm.description
                      });
                  }

      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        label: '',
        description: ''
      });
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      label: category.label,
      description: category.description || ''
    });
    setShowCategoryForm(true);
  };

  const handleCategoryDelete = async (categoryId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cela supprimera aussi toutes ses sous-catégories.')) {
      try {
        await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

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
                📂 Gestion des Catégories
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez les catégories et sous-catégories de la plateforme
              </p>
            </div>
            <Link href="/admin" className="btn-aroos-outline">
              ← Retour à l'Admin
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">📂</div>
            <div className="text-2xl font-bold text-gray-800">{categories.length}</div>
            <div className="text-gray-600">Catégories</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">🔗</div>
            <div className="text-2xl font-bold text-gray-800">
              <Link href="/admin/subcategories" className="text-blue-600 hover:text-blue-800">
                Gérer les sous-catégories →
              </Link>
            </div>
            <div className="text-gray-600">Sous-catégories</div>
          </div>
        </div>


          <div className="space-y-8">
            {/* Formulaire d'ajout/modification de catégorie */}
            {showCategoryForm && (
              <div className="section-aroos animate-fade-in-up">
                <div className="form-aroos">
                  <h3 className="text-xl font-bold mb-6">
                    {editingCategory ? '✏️ Modifier la catégorie' : '➕ Ajouter une catégorie'}
                  </h3>
                  
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom technique *
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          className="input-aroos w-full"
                          placeholder="Ex: photo"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label d'affichage *
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryForm.label}
                          onChange={(e) => setCategoryForm({...categoryForm, label: e.target.value})}
                          className="input-aroos w-full"
                          placeholder="Ex: Photographie"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        className="input-aroos w-full"
                        rows="3"
                        placeholder="Description de la catégorie..."
                      />
                    </div>
                    

                    
                    <div className="flex space-x-4">
                      <button type="submit" className="btn-aroos">
                        {editingCategory ? '💾 Mettre à jour' : '➕ Ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategory(null);
                          setCategoryForm({
                            name: '',
                            label: '',
                            description: ''
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

            {/* Liste des catégories */}
            <div className="section-aroos animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">📂 Catégories</h3>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="btn-aroos"
                >
                  ➕ Ajouter une catégorie
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon">📂</div>
                  <p className="text-gray-600 mb-4">Aucune catégorie créée</p>
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="btn-aroos"
                  >
                    Créer la première catégorie
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <div key={category.id} className="card-hover p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-3 bg-pink-100 text-pink-600"
                          >
                            📂
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{category.label}</h4>
                            <span className="badge-aroos bg-blue-500">
                              {category.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {category.description && (
                        <p className="text-gray-600 text-sm mb-4">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCategoryEdit(category)}
                          className="btn-aroos-outline btn-sm flex-1"
                        >
                          ✏️ Modifier
                        </button>

                        <button
                          onClick={() => handleCategoryDelete(category.id)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


      </div>
    </div>
  );
}
