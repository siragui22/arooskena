'use client';

import Link from 'next/link';
import Image from 'next/image';
import NavItems from '@/components/NavItems';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.warn('Erreur lors de la récupération de l\'utilisateur:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Écouter les changements d'authentification
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.warn('Erreur lors de l\'écoute des changements d\'authentification:', error);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="navbar shadow-sm px-8">
      {/* Logo à gauche */}
      <div className="flex-1">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="Logo" width={132} height={132} />
        </Link>
      </div>

      {/* Liens du menu (centré) */}
      <div className="hidden lg:flex justify-center flex-1">
        <NavItems />
      </div>

      {/* Connexion / Inscription / Profil (à droite) */}
      <div className="flex-none ml-8 space-x-4 items-center flex">
        {!loading && (
          <>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Bonjour, {user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-aroosPink"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="text-gray-600 hover:text-aroosPink">Connexion</button>
                </Link>
                <Link href="/sign-up">
                  <button className="text-gray-600 hover:text-aroosPink">Inscription</button>
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;

