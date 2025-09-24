"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function UserProfile() {
  // ===== ÉTATS LOCAUX =====
  const [user, setUser] = useState(null);           // Utilisateur connecté (auth)
  const [userData, setUserData] = useState(null);   // Données utilisateur (table users)
  const [profile, setProfile] = useState(null);     // Profil utilisateur (table profiles)
  const [loading, setLoading] = useState(true);     // État de chargement
  const [saving, setSaving] = useState(false);      // État de sauvegarde
  const [avatar, setAvatar] = useState(null);       // Nouvel avatar sélectionné
  
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

      // 2. Récupérer l'utilisateur depuis la table users (contient le téléphone)
      const { data: userData } = await supabase
        .from("users")
        .select("id, phone")
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
      alert("Profil mis à jour !");

    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ===== AFFICHAGE =====
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                👤 Mon Profil
              </h1>
              <p className="text-gray-600 text-lg">
                Modifiez vos informations personnelles
              </p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 border border-purple-500 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white transition-colors">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        {/* Formulaire principal */}
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Photo de profil
              </label>
              <div className="flex items-center gap-6">
                {/* Affichage de l'avatar actuel */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.avatar ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${profile.avatar}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.first_name?.charAt(0) || user?.email?.charAt(0)
                  )}
                </div>
                
                {/* Sélection d'un nouvel avatar */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {avatar && (
                    <p className="text-sm text-blue-600 mt-2">
                      Nouveau fichier: {avatar.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés: JPG, PNG, GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Email (lecture seule) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Bouton de sauvegarde */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
