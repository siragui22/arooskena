"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AdminRoles() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    label: "",
    description: ""
  });
  const [editForm, setEditForm] = useState({
    name: "",
    label: "",
    description: ""
  });
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
      await loadRoles();
      setLoading(false);
    };

    checkAdmin();
  }, [router, isClient]);

  const loadRoles = async () => {
    try {
      const { data: rolesData } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      console.log("Rôles chargés:", rolesData);
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des rôles:", error);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!createForm.name || !createForm.label) {
        throw new Error("Le nom et le label sont obligatoires");
      }

      const { error } = await supabase
        .from("roles")
        .insert({
          name: createForm.name.toLowerCase(),
          label: createForm.label,
          description: createForm.description || ""
        });

      if (error) throw error;

      // Recharger les rôles
      await loadRoles();
      
      // Fermer la modal et réinitialiser le formulaire
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        label: "",
        description: ""
      });

      // Afficher le toast de succès
      showToast("Rôle créé avec succès !", "success");

    } catch (error) {
      console.error("Erreur lors de la création:", error);
      showToast("Erreur lors de la création du rôle", "error");
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setEditForm({
      name: role.name,
      label: role.label,
      description: role.description || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateRole = async () => {
    try {
      if (!editForm.name || !editForm.label) {
        throw new Error("Le nom et le label sont obligatoires");
      }

      const { error } = await supabase
        .from("roles")
        .update({
          name: editForm.name.toLowerCase(),
          label: editForm.label,
          description: editForm.description || ""
        })
        .eq("id", editingRole.id);

      if (error) throw error;

      // Recharger les rôles
      await loadRoles();
      
      // Fermer la modal et réinitialiser
      setShowEditModal(false);
      setEditingRole(null);
      setEditForm({
        name: "",
        label: "",
        description: ""
      });

      // Afficher le toast de succès
      showToast("Rôle mis à jour avec succès !", "success");

    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      showToast("Erreur lors de la mise à jour du rôle", "error");
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`)) {
      return;
    }

    try {
      // Vérifier si le rôle est utilisé par des utilisateurs
      const { data: usersWithRole } = await supabase
        .from("users")
        .select("id")
        .eq("role_id", roleId);

      if (usersWithRole && usersWithRole.length > 0) {
        showToast(`Impossible de supprimer ce rôle car ${usersWithRole.length} utilisateur(s) l'utilisent`, "error");
        return;
      }

      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      // Recharger les rôles
      await loadRoles();
      
      // Afficher le toast de succès
      showToast("Rôle supprimé avec succès !", "success");

    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast("Erreur lors de la suppression du rôle", "error");
    }
  };

  const showToast = (message, type) => {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'success' ? 'success' : 'error'} fixed top-4 right-4 z-50 shadow-lg`;
    
    const icon = type === 'success' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>`;

    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);
    
    // Supprimer le toast après 3 secondes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                🎭 Gestion des Rôles
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez les rôles et permissions de la plateforme Arooskena
              </p>
            </div>
                         <div className="flex space-x-3">
                               <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-aroos"
                >
                  ➕ Nouveau Rôle
                </button>
                <Link href="/admin" className="btn-aroos-outline">
                  ← Retour à l'Admin
                </Link>
             </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="section-aroos mb-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
                             <input
                 type="text"
                 placeholder="Nom, label..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="input-aroos w-full"
               />
            </div>
            <div className="flex items-end">
              <div className="stat-aroos w-full">
                <div className="text-2xl font-bold text-gray-800">
                  {filteredRoles.length}
                </div>
                <div className="text-gray-600">Rôles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des rôles */}
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
                  <th>Nom</th>
                  <th>Label</th>
                  <th>Description</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <th>
                      <label>
                        <input type="checkbox" className="checkbox" />
                      </label>
                    </th>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* <div className="">
                          <div className="mask mask-squircle h-12 w-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                            {role.name.charAt(0).toUpperCase()}
                          </div>
                        </div> */}
                        <div>
                          <div className="font-bold font-mono">{role.name}</div>
                          <div className="text-sm opacity-50">Identifiant unique</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs opacity-50">Nom affiché</span>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        <span className="text-sm">
                          {role.description || "Aucune description"}
                        </span>
                        {!role.description && (
                          <span className="text-xs opacity-50 block mt-1">Aucune description fournie</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {isClient 
                            ? new Date(role.created_at).toLocaleDateString("fr-FR")
                            : role.created_at
                          }
                        </span>
                        <span className="text-xs opacity-50">Date de création</span>
                      </div>
                    </td>
                    <th>
                      <div className="flex flex-col gap-2">
                                                 <button
                           onClick={() => handleEditRole(role)}
                           className="btn-aroos-outline btn-xs"
                         >
                           ✏️ Modifier
                         </button>
                         <button
                           onClick={() => handleDeleteRole(role.id, role.label)}
                           className="btn btn-error btn-xs"
                           disabled={role.name === "admin"}
                         >
                           🗑️ Supprimer
                         </button>
                      </div>
                    </th>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {filteredRoles.length === 0 && (
            <div className="empty-state text-center py-8">
              <div className="empty-state-icon">🎭</div>
              <p className="text-gray-600 mb-4">Aucun rôle trouvé</p>
            </div>
          )}
        </div>
      </div>

             {/* Modal de création */}
       {showCreateModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">
                 Créer un nouveau rôle
               </h3>
               <button
                 onClick={() => setShowCreateModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 ✕
               </button>
             </div>

                         <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Nom (unique) *
                 </label>
                 <input
                   type="text"
                   placeholder="ex: prestataire"
                   value={createForm.name}
                   onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                   className="input-aroos w-full"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Utilisé en interne (minuscules, sans espaces)
                 </p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Label (affiché) *
                 </label>
                 <input
                   type="text"
                   placeholder="ex: Prestataire"
                   value={createForm.label}
                   onChange={(e) => setCreateForm({...createForm, label: e.target.value})}
                   className="input-aroos w-full"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Description
                 </label>
                 <textarea
                   placeholder="Description du rôle..."
                   value={createForm.description}
                   onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                   className="input-aroos w-full"
                   rows="3"
                 />
               </div>
             </div>

                         <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowCreateModal(false)}
                 className="btn-aroos-outline"
               >
                 Annuler
               </button>
               <button
                 onClick={handleCreateRole}
                 className="btn-aroos"
               >
                 Créer
               </button>
             </div>
          </div>
        </div>
      )}

             {/* Modal d'édition */}
       {showEditModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">
                 Modifier le rôle
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
                   Nom (unique) *
                 </label>
                 <input
                   type="text"
                   value={editForm.name}
                   onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                   className="input-aroos w-full"
                   disabled={editingRole?.name === "admin"}
                 />
                 {editingRole?.name === "admin" && (
                   <p className="text-xs text-orange-600 mt-1">
                     Le rôle admin ne peut pas être modifié
                   </p>
                 )}
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Label (affiché) *
                 </label>
                                    <input
                     type="text"
                     value={editForm.label}
                     onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                     className="input-aroos w-full"
                   />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Description
                 </label>
                 <textarea
                   value={editForm.description}
                   onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                   className="input-aroos w-full"
                   rows="3"
                 />
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
                 onClick={handleUpdateRole}
                 className="btn-aroos"
                 disabled={editingRole?.name === "admin"}
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
