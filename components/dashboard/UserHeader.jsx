'use client';

import Link from 'next/link';

export default function UserHeader({ user, userData, profile }) {
  const getRoleBadgeColor = (roleName) => {
    const colors = {
      admin: 'bg-red-500',
      prestataire: 'bg-blue-500',
      entreprise: 'bg-purple-500',
      marie: 'bg-pink-500',
      editeur: 'bg-indigo-500'
    };
    return colors[roleName] || 'bg-gray-500';
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return (profile?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  };

  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  return (
    <div className="section-aroos animate-fade-in-up mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="avatar">
            {profile?.avatar ? (
              <div className="mask mask-squircle h-20 w-20 ring-4 ring-pink-200">
                <img 
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${profile.avatar}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="mask mask-squircle h-20 w-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-3xl ring-4 ring-pink-200">
                {getInitials()}
              </div>
            )}
          </div>
          
          {/* Informations utilisateur */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              {getFullName()}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center text-gray-600">
                📧 {user?.email}
              </span>
              {userData?.roles && (
                <span className={`badge-aroos ${getRoleBadgeColor(userData.roles.name)}`}>
                  {userData.roles.label || userData.roles.name}
                </span>
              )}
              {userData?.is_active && (
                <span className="text-green-600 flex items-center font-medium">
                  ● Actif
                </span>
              )}
            </div>
            {profile?.phone && (
              <div className="text-sm text-gray-600 mt-1">
                📱 {profile.phone}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard/profile" className="btn-aroos-outline">
            ✏️ Modifier mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}
