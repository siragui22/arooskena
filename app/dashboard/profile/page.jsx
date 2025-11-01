"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import UserHeader from "@/components/dashboard/UserHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

export default function UserProfile() {
  // ===== ÉTATS LOCAUX =====
  const [user, setUser] = useState(null);           // Utilisateur connecté (auth)
  const [userData, setUserData] = useState(null);   // Données utilisateur (table users)
  const [profile, setProfile] = useState(null);     // Profil utilisateur (table profiles)
  const [loading, setLoading] = useState(true);     // État de chargement
  const [saving, setSaving] = useState(false);      // État de sauvegarde
  const [avatar, setAvatar] = useState(null);       // Nouvel avatar sélectionné
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: ""
  });
  
  const router = useRouter();

  // ===== CHARGEMENT INITIAL =====
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Fonction pour charger le profil utilisateur
  const loadUserProfile = async () => {
    try {
      // 1. Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }
      setUser(user);

      // 2. Récupérer l'utilisateur depuis la table users (contient le téléphone + rôle)
      const { data: userData } = await supabase
        .from("users")
        .select(`
          id, 
          phone,
          is_active,
          roles(name, label)
        `)
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) {
        throw new Error("Utilisateur non trouvé");
      }
      setUserData(userData);

      // 3. Charger ou créer le profil (contient first_name et last_name)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.id)
        .single();

      if (!profileData) {
        // Créer un nouveau profil si il n'existe pas
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            user_id: userData.id,
            first_name: '',
            last_name: ''
          })
          .select()
          .single();
        
        setProfile(newProfile);
        setFormData({ 
          first_name: '', 
          last_name: '', 
          phone: userData.phone || '' 
        });
      } else {
        // Utiliser le profil existant
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone: userData.phone || ""
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  // ===== GESTION DES CHAMPS =====
  // Mise à jour des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion de la sélection d'un nouvel avatar
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximum : 5MB");
        return;
      }
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert("Veuillez sélectionner un fichier image valide");
        return;
      }
      
      setAvatar(file);
    }
  };

  // ===== SAUVEGARDE =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile || !userData) return;
    
    try {
      setSaving(true);
      
      // 1. Mettre à jour le profil (first_name, last_name)
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Mettre à jour l'utilisateur (phone)
      const { error: userError } = await supabase
        .from("users")
        .update({
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq("id", userData.id);

      if (userError) throw userError;

      // 3. Gérer l'upload de l'avatar si sélectionné
      if (avatar) {
        // Supprimer l'ancien avatar s'il existe
        if (profile.avatar) {
          await supabase.storage.from('profil_avatars').remove([profile.avatar]);
        }

        // Upload du nouvel avatar
        const fileName = `${profile.id}-${Date.now()}.${avatar.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('profil_avatars')
          .upload(fileName, avatar);

        if (uploadError) throw uploadError;

        // Mettre à jour le profil avec le nom du fichier
        const { error: avatarUpdateError } = await supabase
          .from("profiles")
          .update({ 
            avatar: fileName,
            updated_at: new Date().toISOString()
          })
          .eq("id", profile.id);

        if (avatarUpdateError) throw avatarUpdateError;
      }

      // Mettre à jour l'état local
      setProfile(updatedProfile);
      setUserData(prev => ({ ...prev, phone: formData.phone }));
      setAvatar(null);
      
      // Afficher le message de succès
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ===== AFFICHAGE =====
  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg" 
        text="Chargement de votre profil..." 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* En-tête utilisateur */}
        <UserHeader user={user} userData={userData} profile={profile} />
        
        {/* Message de succès */}
        {showSuccessMessage && (
          <div className="section-aroos mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-4">✅</span>
                <div>
                  <h3 className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:from-pink-500 hover:to-orange-400 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg">Profil mis à jour !</h3>
                  <p className="text-green-700">
                    Vos informations ont été sauvegardées avec succès.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="btn-aroos-outline btn-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/dashboard" className="btn-aroos-outline">
            ← Retour au Dashboard
          </Link>
        </div>

        {/* Formulaire principal */}
        <div className="section-aroos max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="icon-aroos mr-3">✏️</span>
                Modifier mes informations
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Mettez à jour vos informations personnelles
              </p>
            </div>
            {userData?.roles && (
              <span className={`badge-aroos ${
                userData.roles.name === 'admin' ? 'bg-red-500' :
                userData.roles.name === 'prestataire' ? 'bg-blue-500' :
                userData.roles.name === 'entreprise' ? 'bg-purple-500' :
                userData.roles.name === 'marie' ? 'bg-pink-500' :
                'bg-gray-500'
              }`}>
                {userData.roles.label || userData.roles.name}
              </span>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section Avatar */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border-2 border-pink-200">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                📸 Photo de profil
              </label>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Affichage de l'avatar actuel */}
                <div className="avatar">
                  <div className="mask mask-squircle h-24 w-24 ring-4 ring-pink-300">
                    {profile?.avatar ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${profile.avatar}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                        {profile?.first_name?.charAt(0) || user?.email?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sélection d'un nouvel avatar */}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-purple-600 file:text-white hover:file:from-pink-600 hover:file:to-purple-700 file:cursor-pointer"
                  />
                  {avatar && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      ✅ Nouveau fichier: {avatar.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Formats acceptés: JPG, PNG, GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="input-aroos w-full"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="input-aroos w-full"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-aroos w-full"
                placeholder="+253 XX XX XX XX"
              />
            </div>

            {/* Email (lecture seule) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="input-aroos w-full bg-gray-50 cursor-not-allowed opacity-75"
              />
              <p className="text-xs text-gray-500 mt-1">
                🔒 L'email ne peut pas être modifié
              </p>
            </div>

            {/* Bouton de sauvegarde */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-aroos"
              >
                {saving ? "💾 Sauvegarde..." : "💾 Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
