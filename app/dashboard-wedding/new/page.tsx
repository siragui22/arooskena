'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Users, DollarSign, Heart, ArrowLeft, Sparkles } from 'lucide-react';

export default function NewWeddingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    wedding_date: '',
    estimated_guests: '',
    max_budget: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateSlug = (title: string, userId: string) => {
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${title}-${userId.substring(0, 8)}-${randomId}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        alert('Vous devez être connecté pour créer un mariage');
        router.push('/sign-in');
        return;
      }

      // Get user from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (userError || !userData) {
        alert('Erreur lors de la récupération de votre profil');
        setLoading(false);
        return;
      }

      // Get free subscription type
      const { data: freeSubscription, error: subscriptionError } = await supabase
        .from('wedding_subscription_types')
        .select('id')
        .eq('name', 'free')
        .single();

      if (subscriptionError || !freeSubscription) {
        alert('Erreur lors de la récupération du plan gratuit');
        setLoading(false);
        return;
      }

      // Generate slug
      const slug = generateSlug(formData.title, userData.id);

      // Create wedding
      const { data: weddingData, error: weddingError } = await supabase
        .from('weddings')
        .insert([{
          user_id: userData.id,
          title: formData.title,
          wedding_date: formData.wedding_date,
          estimated_guests: formData.estimated_guests ? parseInt(formData.estimated_guests) : null,
          max_budget: formData.max_budget ? parseFloat(formData.max_budget) : null,
          slug: slug,
          subscription_id: freeSubscription.id,
          status: 'planification'
        }])
        .select()
        .single();

      if (weddingError || !weddingData) {
        console.error('Wedding creation error:', weddingError);
        alert('Erreur lors de la création du mariage: ' + (weddingError?.message || 'Erreur inconnue'));
        setLoading(false);
        return;
      }

      // Create default budget categories
      const defaultCategories = [
        { name: 'Restauration', label: 'Restauration', icon: 'Cake', color: '#F59E0B', display_order: 1 },
        { name: 'Décoration', label: 'Décoration', icon: 'Flower2', color: '#EC4899', display_order: 2 },
        { name: 'Photographie', label: 'Photographie', icon: 'Camera', color: '#8B5CF6', display_order: 3 },
        { name: 'Musique', label: 'Musique & Animation', icon: 'Music', color: '#3B82F6', display_order: 4 },
        { name: 'Transport', label: 'Transport', icon: 'Car', color: '#10B981', display_order: 5 },
        { name: 'Lieu', label: 'Lieu de réception', icon: 'Home', color: '#EF4444', display_order: 6 },
        { name: 'Faveurs', label: 'Faveurs & Cadeaux', icon: 'Gift', color: '#F97316', display_order: 7 },
        { name: 'Autre', label: 'Autre', icon: 'Sparkles', color: '#6B7280', display_order: 8 }
      ];

      const budgetCategories = defaultCategories.map(cat => ({
        wedding_id: weddingData.id,
        name: cat.name,
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        display_order: cat.display_order,
        allocated_budget: null
      }));

      await supabase
        .from('wedding_budget_categories')
        .insert(budgetCategories);

      alert('🎉 Mariage créé avec succès !');
      router.push('/dashboard-wedding');
    } catch (error) {
      console.error('Error creating wedding:', error);
      alert('Une erreur inattendue est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-orange-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Créez votre mariage
          </h1>
          <p className="text-gray-600">
            Commencez à planifier le plus beau jour de votre vie
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Titre du mariage <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="ex: Mariage de Amina & Youssouf"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ce titre sera visible uniquement par vous
              </p>
            </div>

            {/* Wedding Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Date du mariage <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  name="wedding_date"
                  value={formData.wedding_date}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Estimated Guests */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nombre d'invités estimé
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="estimated_guests"
                  value={formData.estimated_guests}
                  onChange={handleChange}
                  placeholder="ex: 150"
                  min="1"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Vous pourrez modifier ce nombre plus tard
              </p>
            </div>

            {/* Max Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Budget maximum (DJF)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="max_budget"
                  value={formData.max_budget}
                  onChange={handleChange}
                  placeholder="ex: 75000"
                  min="0"
                  step="1000"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Définissez un budget global pour mieux gérer vos dépenses
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex gap-3">
                <Sparkles className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Plan Gratuit</h4>
                  <p className="text-sm text-blue-700">
                    Vous commencez avec le plan gratuit. Vous pourrez passer à un plan premium à tout moment pour débloquer plus de fonctionnalités.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer mon mariage 🎉'}
              </button>
            </div>
          </form>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              <DollarSign className="text-pink-600" size={20} />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Budget</h4>
            <p className="text-xs text-gray-600">Suivez vos dépenses</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Tâches</h4>
            <p className="text-xs text-gray-600">Organisez tout</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Sparkles className="text-purple-600" size={20} />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">Inspirations</h4>
            <p className="text-xs text-gray-600">Créez votre mood board</p>
          </div>
        </div>
      </div>
    </div>
  );
}
