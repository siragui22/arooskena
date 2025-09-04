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
          profiles(first_name, last_name, avatar)
        `
        )
        .order("created_at", { ascending: false });

      setUsers(usersData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
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

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await supabase
        .from("users")
        .update({ role_id: newRoleId })
        .eq("id", userId);

      await loadUsers();
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
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
                <option value="couple">Couples</option>
                <option value="prestataire">Prestataires</option>
                <option value="admin">Admins</option>
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
            <table className="table-aroos w-full">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center">
                        <div className="profile-avatar w-8 h-8 text-sm">
                          {user.profiles?.[0]?.first_name?.charAt(0) ||
                            user.email?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">
                            {user.profiles?.[0]?.first_name}{" "}
                            {user.profiles?.[0]?.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role_id || ""}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className="input-aroos text-sm"
                      >
                        <option value="">Sélectionner un rôle</option>
                        <option value="couple">maries</option>
                        <option value="prestataire">Prestataire</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className={`badge-aroos ${
                          user.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {user.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
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
                        <button className="btn-aroos-outline btn-xs">
                          ✏️ Modifier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
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
    </div>
  );
}
