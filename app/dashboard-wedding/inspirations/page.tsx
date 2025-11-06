'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, Plus, X, Heart, Download, Trash2,
  Sparkles, Camera, Cake, Flower2, Users as UsersIcon,
  Car, Music, Home, Image as ImageIcon, Search
} from 'lucide-react';

export default function InspirationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState(null);
  const [inspirations, setInspirations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspirationForm, setInspirationForm] = useState({
    title: '',
    image_url: '',
    source_url: '',
    category: 'decoration',
    notes: '',
    is_favorite: false
  });
  const [uploadMode, setUploadMode] = useState('url'); // 'url' ou 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: 'all', label: 'Tout', icon: Sparkles },
    { id: 'decoration', label: 'Décoration', icon: Sparkles },
    { id: 'tenue', label: 'Tenue', icon: Heart },
    { id: 'coiffure', label: 'Coiffure', icon: Sparkles },
    { id: 'maquillage', label: 'Maquillage', icon: Sparkles },
    { id: 'fleurs', label: 'Fleurs', icon: Flower2 },
    { id: 'gateau', label: 'Gâteau', icon: Cake },
    { id: 'theme', label: 'Thème', icon: ImageIcon },
    { id: 'autre', label: 'Autre', icon: ImageIcon }
  ];

  const fetchInspirationsData = useCallback(async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/sign-in');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (!userData) return;

    const { data: weddingData } = await supabase
      .from('weddings')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'planification')
      .single();

    if (weddingData) {
      setWedding(weddingData);

      const { data: inspirationsData } = await supabase
        .from('wedding_inspirations')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      setInspirations(inspirationsData || []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchInspirationsData();
  }, [fetchInspirationsData]);

  const handleFileUpload = async (file) => {
    setUploading(true);

    // Créer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${wedding.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('wedding-inspirations')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    setUploading(false);

    if (error) {
      alert('Erreur lors de l\'upload: ' + error.message);
      return null;
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('wedding-inspirations')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleAddInspiration = async (e) => {
    e.preventDefault();

    let imageUrl = '';
    let sourceUrl = '';

    if (uploadMode === 'upload' && selectedFile) {
      // Upload de fichier
      imageUrl = await handleFileUpload(selectedFile);
      if (!imageUrl) return;
    } else if (uploadMode === 'url' && inspirationForm.source_url) {
      // URL externe
      sourceUrl = inspirationForm.source_url;
      imageUrl = inspirationForm.source_url; // Pour compatibilité
    } else {
      alert('Veuillez ajouter une image ou une URL');
      return;
    }

    const { error } = await supabase
      .from('wedding_inspirations')
      .insert([{
        wedding_id: wedding.id,
        title: inspirationForm.title,
        image_url: imageUrl,
        source_url: sourceUrl || null,
        category: inspirationForm.category,
        notes: inspirationForm.notes,
        is_favorite: inspirationForm.is_favorite
      }]);

    if (error) {
      alert('Erreur lors de l\'ajout de l\'inspiration');
      return;
    }

    setShowAddModal(false);
    setInspirationForm({
      title: '',
      image_url: '',
      source_url: '',
      category: 'decoration',
      notes: '',
      is_favorite: false
    });
    setSelectedFile(null);
    setUploadMode('url');
    fetchInspirationsData();
  };

  const handleToggleFavorite = async (id, currentFavorite) => {
    const { error } = await supabase
      .from('wedding_inspirations')
      .update({ is_favorite: !currentFavorite })
      .eq('id', id);

    if (!error) {
      setInspirations(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_favorite: !currentFavorite } : item
        )
      );
    }
  };

  const handleDeleteInspiration = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inspiration ?')) return;

    const { error } = await supabase
      .from('wedding_inspirations')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchInspirationsData();
      setSelectedImage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun mariage trouvé</p>
          <button
            onClick={() => router.push('/dashboard-wedding/new')}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full"
          >
            Créer un mariage
          </button>
        </div>
      </div>
    );
  }

  const filteredInspirations = inspirations.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = searchQuery === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const favoriteCount = inspirations.filter(i => i.is_favorite).length;

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard-wedding')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour au dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Mood Board
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                <span className="block sm:inline">{wedding.title}</span>
                <span className="hidden sm:inline"> • </span>
                <span className="block sm:inline">{inspirations.length} inspiration(s) • {favoriteCount} favori(s)</span>
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Plus size={20} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                    filterCategory === cat.id
                      ? 'bg-gradient-to-r from-pink-400 to-orange-300 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
                  }`}
                >
                  <Icon size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredInspirations.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredInspirations.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={item.source_url || item.image_url}
                    alt={item.title || 'Inspiration'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="16">Image non disponible</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="font-bold text-xs sm:text-sm mb-1">{item.title || 'Sans titre'}</h3>
                  {item.notes && (
                    <p className="text-xs line-clamp-2 opacity-90">{item.notes}</p>
                  )}
                </div>

                {/* Favorite Badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item.id, item.is_favorite);
                  }}
                  className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full transition-all ${
                    item.is_favorite
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/90 text-gray-600 hover:bg-pink-500 hover:text-white'
                  }`}
                >
                  <Heart size={14} className="sm:w-4 sm:h-4" fill={item.is_favorite ? 'currentColor' : 'none'} />
                </button>

                {/* Category Badge */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <span className="px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-sm text-[10px] sm:text-xs font-medium text-gray-700 rounded-full">
                    {categories.find(c => c.id === item.category)?.label || item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center">
            <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune inspiration</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterCategory !== 'all'
                ? 'Aucune inspiration ne correspond à vos filtres'
                : 'Commencez à créer votre mood board en ajoutant vos premières inspirations'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter une inspiration
            </button>
          </div>
        )}
      </div>

      {/* Add Inspiration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 my-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Ajouter une inspiration</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFile(null);
                  setUploadMode('url');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddInspiration} className="space-y-4">
              {/* Tabs: URL ou Upload */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    uploadMode === 'url'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔗 URL Externe
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    uploadMode === 'upload'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📤 Upload
                </button>
              </div>

              {/* Mode URL */}
              {uploadMode === 'url' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    URL de l&apos;image *
                  </label>
                  <input
                    type="url"
                    value={inspirationForm.source_url}
                    onChange={(e) => setInspirationForm({ ...inspirationForm, source_url: e.target.value })}
                    placeholder="https://pinterest.com/pin/..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm break-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Collez l&apos;URL depuis Pinterest, Instagram, etc.</p>
                  
                  {inspirationForm.source_url && (
                    <div className="mt-3 aspect-video relative rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={inspirationForm.source_url}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mode Upload */}
              {uploadMode === 'upload' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Choisir une image *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 transition-colors bg-gray-50"
                    >
                      {selectedFile ? (
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-pink-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">Cliquez pour choisir</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu&apos;à 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-3 aspect-video relative rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={inspirationForm.title}
                  onChange={(e) => setInspirationForm({ ...inspirationForm, title: e.target.value })}
                  placeholder="ex: Décoration table d'honneur"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Catégorie *
                </label>
                <select
                  value={inspirationForm.category}
                  onChange={(e) => setInspirationForm({ ...inspirationForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  required
                >
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes
                </label>
                <textarea
                  value={inspirationForm.notes}
                  onChange={(e) => setInspirationForm({ ...inspirationForm, notes: e.target.value })}
                  placeholder="Ajoutez des détails, des idées..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={inspirationForm.is_favorite}
                  onChange={(e) => setInspirationForm({ ...inspirationForm, is_favorite: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-300"
                />
                <label htmlFor="favorite" className="text-sm text-gray-700">
                  Marquer comme favori
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Upload...
                    </>
                  ) : (
                    'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-2 sm:p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedImage.source_url || selectedImage.image_url}
                alt={selectedImage.title || 'Inspiration'}
                className="w-full max-h-[80vh] object-contain rounded-xl sm:rounded-2xl"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="%23111827"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="20">Image non disponible</text></svg>';
                }}
              />

              {/* Actions Bar */}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleToggleFavorite(selectedImage.id, selectedImage.is_favorite)}
                  className={`p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all ${
                    selectedImage.is_favorite
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/90 text-gray-700 hover:bg-pink-500 hover:text-white'
                  }`}
                >
                  <Heart size={18} className="sm:w-5 sm:h-5" fill={selectedImage.is_favorite ? 'currentColor' : 'none'} />
                </button>
                <a
                  href={selectedImage.source_url || selectedImage.image_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={18} className="sm:w-5 sm:h-5" />
                </a>
                <button
                  onClick={() => handleDeleteInspiration(selectedImage.id)}
                  className="p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full text-red-600 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-gray-700 hover:text-white transition-all"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Info Bar */}
              {(selectedImage.title || selectedImage.notes) && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-xl sm:rounded-b-2xl">
                  <div className="text-white">
                    {selectedImage.title && (
                      <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{selectedImage.title}</h3>
                    )}
                    {selectedImage.notes && (
                      <p className="text-sm sm:text-base text-white/90 line-clamp-2">{selectedImage.notes}</p>
                    )}
                    <div className="mt-2">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-medium rounded-full">
                        {categories.find(c => c.id === selectedImage.category)?.label || selectedImage.category}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
