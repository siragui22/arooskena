'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Camera, User, Mail, Phone, MapPin, Save, X } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/sign-in');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*, profiles(*)')
      .eq('auth_user_id', authUser.id)
      .single();

    console.log('User data fetched:', userData);

    if (userData) {
      setUser(userData);
      // profiles peut être un array, prendre le premier
      const profileData = Array.isArray(userData.profiles) ? userData.profiles[0] : userData.profiles;
      setProfile(profileData);
      
      setFormData({
        first_name: profileData?.first_name || '',
        last_name: profileData?.last_name || '',
        phone: userData.phone || ''
      });
      
      if (profileData?.avatar) {
        setPreviewUrl(profileData.avatar);
      }
    }

    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar;

      // Upload avatar if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profil_avatars')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Erreur lors de l\'upload de l\'avatar: ' + uploadError.message);
          setSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profil_avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update user phone
      if (formData.phone !== user.phone) {
        console.log('Updating phone for user:', user.id, 'New phone:', formData.phone);
        
        const { error: userError } = await supabase
          .from('users')
          .update({ phone: formData.phone })
          .eq('id', user.id);

        if (userError) {
          console.error('Phone update error:', userError);
          alert('Erreur lors de la mise à jour du téléphone: ' + userError.message);
          setSaving(false);
          return;
        }
        
        console.log('Phone updated successfully');
      }

      // Update or create profile
      if (profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            avatar: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (profileError) {
          alert('Erreur lors de la mise à jour du profil');
          setSaving(false);
          return;
        }
      } else {
        // Create profile if doesn't exist
        const slug = `${formData.first_name.toLowerCase()}-${formData.last_name.toLowerCase()}-${Date.now()}`;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: user.id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            avatar: avatarUrl,
            slug: slug
          }]);

        if (profileError) {
          alert('Erreur lors de la création du profil');
          setSaving(false);
          return;
        }
      }

      alert('Profil mis à jour avec succès !');
      router.push('/dashboard-wedding');
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard-wedding')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour au dashboard
          </button>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Mon Profil
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gérez vos informations personnelles
          </p>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-orange-300 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-pink-400 to-orange-300 rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition-all"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Cliquez sur l&apos;icône pour changer votre photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Votre prénom"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Votre nom"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;email ne peut pas être modifié
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+253 XX XX XX XX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard-wedding')}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
