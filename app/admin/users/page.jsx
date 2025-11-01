"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Users, ArrowLeft, Search, Download, Edit2, X, Save, Camera, Trash2, CheckCircle } from 'lucide-react';

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    role_id: "",
    is_active: true
  });
  const [newAvatar, setNewAvatar] = useState(null);
  const [roles, setRoles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Vérifier si l'utilisateur est admin
      const { data: userData } = await supabase
        .from("users")
        .select(
          `
          *,
          roles(name, label)
        `
        )
        .eq("auth_user_id", user.id)
        .single();

      if (!userData || userData.roles?.name !== "admin") {
        router.push("/dashboard");
        return;
      }

      setUser(user);
      await loadUsers();
      await loadRoles();
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const loadUsers = async () => {
    try {
      const { data: usersData } = await supabase
        .from("users")
        .select(
          `
          *,
          roles(name, label),
          profiles(id, first_name, last_name, avatar)
        `
        )
        .order("created_at", { ascending: false });

      console.log("Utilisateurs chargés avec profils:", usersData);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data: rolesData } = await supabase
        .from("roles")
        .select("*")
        .order("name");
      
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des rôles:", error);
    }
  };

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", userId);

      await loadUsers();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };


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
      
      setNewAvatar(file);
    }
  };

  const handleAvatarDelete = async () => {
    if (!editingUser?.profiles?.[0]?.avatar) return;
    
    try {
      // Supprimer l'avatar du storage
      const { error: storageError } = await supabase.storage
        .from('profil_avatars')
        .remove([editingUser.profiles[0].avatar]);

      if (storageError) {
        console.error("Erreur lors de la suppression de l'avatar:", storageError);
        return;
      }

      // Mettre à jour le profil pour supprimer la référence
      const profileId = editingUser.profiles[0].id;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          avatar: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileId);

      if (profileError) {
        console.error("Erreur lors de la mise à jour du profil:", profileError);
        return;
      }

      // Recharger les utilisateurs
      await loadUsers();
      
      // Afficher le toast de succès
      const toast = document.createElement('div');
      toast.className = 'alert alert-success fixed top-4 right-4 z-50 shadow-lg';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Avatar supprimé avec succès !</span>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);

    } catch (error) {
      console.error("Erreur lors de la suppression de l'avatar:", error);
    }
  };

  const handleEditUser = (user) => {
    console.log("Édition de l'utilisateur:", user);
    console.log("Profil de l'utilisateur:", user.profiles);
    
    // Récupérer les données du profil
    const profile = user.profiles && user.profiles.length > 0 ? user.profiles[0] : null;
    console.log("Profil récupéré:", profile);
    console.log("ID du profil:", profile?.id);
    
    if (profile && !profile.id) {
      console.error("ERREUR: L'ID du profil est manquant !");
    }
    
    setEditingUser(user);
    setEditForm({
      email: user.email || "",
      phone: user.phone || "",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      role_id: user.role_id || "",
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    
    console.log("Formulaire d'édition initialisé:", {
      email: user.email || "",
      phone: user.phone || "",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      role_id: user.role_id || "",
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    
    setShowEditModal(true);
  };

    const handleUpdateUser = async () => {
    try {
      console.log("Données à mettre à jour:", editForm);
      console.log("Utilisateur en cours d'édition:", editingUser);
      
      // Préparer les données de mise à jour (en gérant les valeurs undefined)
      const updateData = {
        phone: editForm.phone || null,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString()
      };

      // Ajouter role_id seulement s'il n'est pas vide
      if (editForm.role_id && editForm.role_id !== "") {
        updateData.role_id = editForm.role_id;
      } else {
        updateData.role_id = null;
      }

      console.log("Données de mise à jour:", updateData);

      // Mettre à jour les informations de base de l'utilisateur
      const { error: userError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", editingUser.id);

      if (userError) {
        console.error("Erreur mise à jour user:", userError);
        throw userError;
      }

             // Gérer le profil - toujours mettre à jour ou créer
       console.log("Gestion du profil - first_name:", editForm.first_name, "last_name:", editForm.last_name);
       
       let profileId;
       
       if (editingUser.profiles && editingUser.profiles.length > 0) {
         // Mettre à jour le profil existant
         profileId = editingUser.profiles[0].id;
         console.log("Mise à jour du profil existant ID:", profileId);
         
         if (!profileId) {
           throw new Error("ID du profil manquant pour la mise à jour");
         }
         
         const { error: profileError } = await supabase
           .from("profiles")
           .update({
             first_name: editForm.first_name || "",
             last_name: editForm.last_name || "",
             updated_at: new Date().toISOString()
           })
           .eq("id", profileId);

         if (profileError) {
           console.error("Erreur mise à jour profil:", profileError);
           throw profileError;
         }
         console.log("Profil mis à jour avec succès");
       } else {
         // Créer un nouveau profil
         console.log("Création d'un nouveau profil pour l'utilisateur:", editingUser.id);
         
         const { data: newProfile, error: profileError } = await supabase
           .from("profiles")
           .insert({
             user_id: editingUser.id,
             first_name: editForm.first_name || "",
             last_name: editForm.last_name || ""
           })
           .select()
           .single();

         if (profileError) {
           console.error("Erreur création profil:", profileError);
           throw profileError;
         }
         
         profileId = newProfile.id;
         console.log("Nouveau profil créé avec succès, ID:", profileId);
       }

       // Gérer l'upload de l'avatar si un nouveau fichier est sélectionné
       if (newAvatar) {
         try {
           // Générer un nom de fichier unique
           const fileExt = newAvatar.name.split('.').pop();
           const fileName = `${editingUser.id}-${Date.now()}.${fileExt}`;
           
           // Upload du fichier vers Supabase Storage
           const { error: uploadError } = await supabase.storage
             .from('profil_avatars')
             .upload(fileName, newAvatar);

           if (uploadError) {
             console.error("Erreur lors de l'upload de l'avatar:", uploadError);
             throw uploadError;
           }

           // Mettre à jour le profil avec le nom du fichier
           const { error: avatarUpdateError } = await supabase
             .from("profiles")
             .update({ 
               avatar: fileName,
               updated_at: new Date().toISOString()
             })
             .eq("id", profileId);

           if (avatarUpdateError) {
             console.error("Erreur lors de la mise à jour de l'avatar:", avatarUpdateError);
             throw avatarUpdateError;
           }

           console.log("Avatar uploadé avec succès:", fileName);
         } catch (error) {
           console.error("Erreur lors de la gestion de l'avatar:", error);
           throw error;
         }
       }

      // Recharger les utilisateurs
      await loadUsers();
      
      // Fermer la modal
      setShowEditModal(false);
      setEditingUser(null);
             setEditForm({
         email: "",
         phone: "",
         first_name: "",
         last_name: "",
         role_id: "",
         is_active: true
       });
       setNewAvatar(null);

      // Afficher le toast de succès avec DaisyUI
      const toast = document.createElement('div');
      toast.className = 'alert alert-success fixed top-4 right-4 z-50 shadow-lg';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Utilisateur mis à jour avec succès !</span>
      `;
      document.body.appendChild(toast);
      
      // Supprimer le toast après 3 secondes
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);

    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      
      // Afficher le toast d'erreur avec DaisyUI
      const toast = document.createElement('div');
      toast.className = 'alert alert-error fixed top-4 right-4 z-50 shadow-lg';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Erreur lors de la mise à jour de l'utilisateur</span>
      `;
      document.body.appendChild(toast);
      
      // Supprimer le toast après 5 secondes
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 5000);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profiles?.[0]?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.profiles?.[0]?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.roles?.name === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.is_active === (statusFilter === "active");

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header moderne */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  Gestion des Utilisateurs
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-14">
                Gérez tous les utilisateurs de la plateforme
              </p>
            </div>
            <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm sm:text-base font-medium text-gray-700">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
        </div>

        {/* Filtres et stats */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Email, nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
              >
                <option value="all">Tous les rôles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-4 border border-pink-200">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {filteredUsers.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Utilisateurs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau moderne */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-3">
                           {user.profiles?.[0]?.avatar ? (
                             <img 
                               src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${user.profiles[0].avatar}`}
                               alt="Avatar"
                               className="w-10 h-10 rounded-full object-cover"
                             />
                           ) : (
                             <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold rounded-full">
                               {user.profiles?.[0]?.first_name?.charAt(0) || user.email?.charAt(0)}
                             </div>
                           )}
                         <div>
                           <div className="font-medium text-gray-900 text-sm">
                             {user.profiles?.[0]?.first_name} {user.profiles?.[0]?.last_name}
                           </div>
                           {!user.profiles?.[0]?.first_name && (
                             <div className="text-xs text-gray-500">Sans profil</div>
                           )}
                         </div>
                       </div>
                     </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{user.phone || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3">
                         <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                           user.roles?.name === 'admin' ? 'bg-red-100 text-red-700' :
                           user.roles?.name === 'prestataire' ? 'bg-blue-100 text-blue-700' :
                           user.roles?.name === 'couple' ? 'bg-purple-100 text-purple-700' :
                           'bg-gray-100 text-gray-700'
                         }`}>
                           {user.roles?.label || "Aucun rôle"}
                         </span>
                     </td>
                    <td className="px-4 py-3">
                       <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                         user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                       }`}>
                         {user.is_active ? "Actif" : "Inactif"}
                       </span>
                     </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex gap-2">
                         <button
                           onClick={() => handleUserStatusChange(user.id, !user.is_active)}
                           className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                             user.is_active 
                               ? "bg-red-100 text-red-700 hover:bg-red-200" 
                               : "bg-green-100 text-green-700 hover:bg-green-200"
                           }`}
                         >
                           {user.is_active ? "Désactiver" : "Activer"}
                         </button>
                         <button 
                           onClick={() => handleEditUser(user)}
                           className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                         >
                           <Edit2 className="w-3 h-3" />
                           Modifier
                         </button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Aucun utilisateur trouvé</p>
              <p className="text-sm text-gray-500 mt-1">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          )}
        </div>
      </div>

             {/* Modal moderne d'édition */}
       {showEditModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl sm:rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                   <Edit2 className="w-5 h-5 text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">
                   Modifier l'utilisateur
                 </h3>
               </div>
               <button
                 onClick={() => setShowEditModal(false)}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X className="w-5 h-5 text-gray-500" />
               </button>
             </div>

            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Email (non modifiable)
                 </label>
                 <input
                   type="email"
                   value={editForm.email}
                   disabled
                   className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Avatar
                 </label>
                 <div className="flex items-center gap-4">
                     {editingUser?.profiles?.[0]?.avatar ? (
                       <img 
                         src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${editingUser.profiles[0].avatar}`}
                         alt="Avatar actuel"
                         className="w-16 h-16 rounded-full object-cover"
                       />
                     ) : (
                       <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl rounded-full">
                         {editingUser?.profiles?.[0]?.first_name?.charAt(0) || editingUser?.email?.charAt(0)}
                       </div>
                     )}
                   <div className="flex-1 flex flex-col gap-2">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={(e) => handleAvatarChange(e)}
                       className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                     />
                     {editingUser?.profiles?.[0]?.avatar && (
                       <button
                         type="button"
                         onClick={() => handleAvatarDelete()}
                         className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors w-fit"
                       >
                         <Trash2 className="w-3 h-3" />
                         Supprimer
                       </button>
                     )}
                   </div>
                 </div>
               </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="Prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={editForm.role_id}
                  onChange={(e) => setEditForm({...editForm, role_id: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-300"
                  id="is_active"
                />
                <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Utilisateur actif
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
               <button
                 onClick={() => setShowEditModal(false)}
                 className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
               >
                 Annuler
               </button>
               <button
                 onClick={handleUpdateUser}
                 className="px-4 py-2.5 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium flex items-center gap-2"
               >
                 <Save className="w-4 h-4" />
                 Sauvegarder
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
