'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const NavItems = () => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Récupérer le rôle de l'utilisateur
        const { data: userData } = await supabase
          .from('users')
          .select(`
            *,
            roles(name, label)
          `)
          .eq('auth_user_id', user.id)
          .single();
        
        if (userData) {
          setUserRole(userData.roles?.name);
        }
      }
    };

    checkUser();
  }, []);

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/reception', label: 'Lieux de Réception' },
    { href: '/prestataire', label: 'Prestataires' },
  ];

  // Ajouter le lien dashboard selon le rôle
  if (user) {
    if (userRole === 'admin') {
      links.push({ href: '/admin', label: 'Admin', icon: '👑' });
    } else if (userRole === 'prestataire') {
      links.push({ href: '/dashboard-prestataire', label: 'Mon Espace',  });
    } else {
      links.push({ href: '/dashboard', label: 'Mon Dashboard',  });
    }
  }

  return (
    <div className="flex gap-6">
      {links.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`text-md font-medium transition-all duration-200 hover:scale-105 ${
            pathname === href 
              ? 'text-aroosPink font-bold border-b-2 border-aroosPink' 
              : 'text-gray-700 hover:text-aroosPink'
          }`}
        >
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </Link>
      ))}
    </div>
  );
};

export default NavItems;
