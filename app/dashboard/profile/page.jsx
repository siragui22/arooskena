'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    location: '',
    website: ''
  });
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      setUser(user);

      // Récupérer le profil utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        setProfile(profileData);
        
        // Pré-remplir le formulaire
        setFormData({
          first_name: profileData?.first_name || userData?.first_name || '',
          last_name: profileData?.last_name || '',
          phone: userData?.phone || '',
          bio: profileData?.bio || '',
          location: profileData?.location || '',
          website: profileData?.website || ''
        });
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Mettre à jour la table users
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({
            first_name: formData.first_name,
            phone: formData.phone
          })
          .eq('id', userData.id);

        // Mettre à jour la table profiles
        await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            bio: formData.bio,
            location: formData.location,
            website: formData.website
          })
          .eq('user_id', userData.id);

        alert('Profil mis à jour avec succès ! ✅');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
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
                Mon Profil
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez vos informations personnelles
              </p>
            </div>
            <Link href="/dashboard" className="btn-aroos-outline">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations du profil */}
          <div className="lg:col-span-2">
            <div className="form-aroos animate-fade-in-up">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="icon-aroos mr-3">👤</span>
                Informations personnelles
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Prénom *</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="input input-bordered input-aroos"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Nom *</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="input input-bordered input-aroos"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Téléphone</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input input-bordered input-aroos"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Localisation</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input input-bordered input-aroos"
                    placeholder="Djibouti, Ville..."
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Site web</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input input-bordered input-aroos"
                    placeholder="https://..."
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="textarea textarea-bordered input-aroos h-24"
                    placeholder="Parlez-nous un peu de vous..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-aroos"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="loader-aroos w-4 h-4 mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      'Sauvegarder les modifications'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations du compte */}
            <div className="section-aroos animate-slide-in-right">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="icon-aroos mr-2">📧</span>
                Informations du compte
              </h3>
              <div className="space-y-3">
                <div className="notification-aroos">
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="notification-aroos">
                  <label className="text-sm text-gray-600">Rôle</label>
                  <p className="font-medium capitalize">{profile?.role || 'couple'}</p>
                </div>
                <div className="notification-aroos">
                  <label className="text-sm text-gray-600">Membre depuis</label>
                  <p className="font-medium">
                    {new Date(user?.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="section-aroos animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="icon-aroos mr-2">⚙️</span>
                Actions rapides
              </h3>
              <div className="space-y-3">
                <button className="btn-aroos-outline w-full">
                  🔐 Changer le mot de passe
                </button>
                <button className="btn-aroos-outline w-full">
                  📥 Télécharger mes données
                </button>
                <button className="btn btn-error btn-sm w-full">
                  🗑️ Supprimer mon compte
                </button>
              </div>
            </div>

            {/* Statistiques du profil */}
            <div className="section-aroos animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="icon-aroos mr-2">📊</span>
                Statistiques
              </h3>
              <div className="space-y-4">
                <div className="counter-aroos">
                  <div className="counter-aroos-number">100%</div>
                  <div className="text-gray-600">Profil complété</div>
                </div>
                
                <div className="progress-aroos h-2">
                  <div className="progress-aroos-fill" style={{ width: '100%' }}></div>
                </div>
                
                <div className="text-sm text-gray-600">
                  Tous les champs obligatoires sont remplis
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
