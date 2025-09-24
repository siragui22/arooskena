"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

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
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
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
  }, [router, isClient]);

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
         <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                👥 Gestion des Utilisateurs
              </h1>
              <p className="text-gray-600 text-lg"> 
                Gérez les utilisateurs de la plateforme Arooskena
              </p>
            </div>
                                                   <Link href="/admin" className="btn-aroos-outline">
                ← Retour à l'Admin
              </Link>
          </div>
        </div>

                {/* Filtres et recherche */}
        <div className="section-aroos mb-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Email, nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-aroos w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-aroos w-full"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-aroos w-full"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="stat-aroos w-full">
                <div className="text-2xl font-bold text-gray-800">
                  {filteredUsers.length}
                </div>
                <div className="text-gray-600">Utilisateurs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="section-aroos animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <th>
                      <label>
                        <input type="checkbox" className="checkbox" />
                      </label>
                    </th>
                                         <td>
                       <div className="flex items-center gap-3">
                         <div className="avatar">
                           {user.profiles?.[0]?.avatar ? (
                             <div className="mask mask-squircle h-12 w-12">
                               <img 
                                 src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${user.profiles[0].avatar}`}
                                 alt="Avatar"
                                 className="w-full h-full object-cover"
                               />
                             </div>
                           ) : (
                             <div className="mask mask-squircle h-12 w-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                               {user.profiles?.[0]?.first_name?.charAt(0) ||
                                 user.email?.charAt(0)}
                             </div>
                           )}
                         </div>
                         <div>
                           <div className="font-bold">
                             {user.profiles?.[0]?.first_name} {user.profiles?.[0]?.last_name}
                           </div>
                           <div className="text-sm opacity-50">
                             {user.profiles?.[0]?.first_name ? "" : "Sans profil"}
                           </div>
                         </div>
                       </div>
                     </td>
                    <td >{user.email}</td>
                    <td >
                      {user.phone || "N/A"}
                      <br />
                    </td>
                    
                                         <td>
                       <div className="flex items-center gap-2">
                         <span className={`badge ${
                           user.roles?.name === 'admin' ? 'badge-error' :
                           user.roles?.name === 'prestataire' ? 'badge-warning' :
                           user.roles?.name === 'couple' ? 'badge-info' :
                           'badge-ghost'
                         }`}>
                           {user.roles?.label || "Aucun rôle"}
                         </span>
                       </div>
                     </td>
                                         <td>
                       <span className={`badge-aroos ${
                         user.is_active ? "bg-green-500" : "bg-red-500"
                       }`}>
                         {user.is_active ? "Actif" : "Inactif"}
                       </span>
                     </td>
                    <td>
                      {isClient 
                        ? new Date(user.created_at).toLocaleDateString("fr-FR")
                        : user.created_at
                      }
                    </td>
                                         <td>
                       <div className="flex space-x-2">
                         <button
                           onClick={() =>
                             handleUserStatusChange(user.id, !user.is_active)
                           }
                           className={`btn btn-xs ${
                             user.is_active ? "btn-error" : "btn-success"
                           }`}
                         >
                           {user.is_active ? "Désactiver" : "Activer"}
                         </button>
                         <button 
                           onClick={() => handleEditUser(user)}
                           className="btn-aroos-outline btn-xs"
                         >
                           ✏️ Modifier
                         </button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
              {/* foot */}
  
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="empty-state text-center py-8">
              <div className="empty-state-icon">👥</div>
              <p className="text-gray-600 mb-4">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>

             {/* Modal d'édition */}
       {showEditModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">
                 Modifier l'utilisateur
               </h3>
               <button
                 onClick={() => setShowEditModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 ✕
               </button>
             </div>

            <div className="space-y-4">
                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Email (non modifiable)
                 </label>
                 <input
                   type="email"
                   value={editForm.email}
                   disabled
                   className="input-aroos w-full bg-gray-100"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Avatar
                 </label>
                 <div className="flex items-center gap-4">
                   <div className="avatar">
                     {editingUser?.profiles?.[0]?.avatar ? (
                       <div className="mask mask-squircle h-16 w-16">
                         <img 
                           src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${editingUser.profiles[0].avatar}`}
                           alt="Avatar actuel"
                           className="w-full h-full object-cover"
                         />
                       </div>
                     ) : (
                       <div className="mask mask-squircle h-16 w-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl">
                         {editingUser?.profiles?.[0]?.first_name?.charAt(0) ||
                           editingUser?.email?.charAt(0)}
                       </div>
                     )}
                   </div>
                   <div className="flex flex-col gap-2">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={(e) => handleAvatarChange(e)}
                       className="file-input file-input-bordered w-full max-w-xs"
                     />
                     {editingUser?.profiles?.[0]?.avatar && (
                       <button
                         type="button"
                         onClick={() => handleAvatarDelete()}
                         className="btn btn-error btn-xs"
                       >
                         🗑️ Supprimer l'avatar
                       </button>
                     )}
                   </div>
                 </div>
               </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="input-aroos w-full"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="input-aroos w-full"
                    placeholder="Prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="input-aroos w-full"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  value={editForm.role_id}
                  onChange={(e) => setEditForm({...editForm, role_id: e.target.value})}
                  className="input-aroos w-full"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Utilisateur actif
                  </span>
                </label>
              </div>
            </div>

                         <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowEditModal(false)}
                 className="btn-aroos-outline"
               >
                 Annuler
               </button>
               <button
                 onClick={handleUpdateUser}
                 className="btn-aroos"
               >
                 Sauvegarder
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
