'use client';

import Link from 'next/link';
import Image from 'next/image';
import NavItems from '@/components/NavItems';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Heart, Briefcase } from 'lucide-react';

const Navbar = () => {
  const { user, loading, signOut, userRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const profileMenuRef = useRef(null);

  // Fermer le menu du profil si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fonction pour fermer le menu mobile
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100 sticky top-0 z-50">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group cursor-pointer">
              <div className="relative">
                <Image 
                  src="/logo.svg" 
                  alt="Logo" 
                  width={100} 
                  height={32}
                  className="w-20 h-auto sm:w-24 md:w-28 lg:w-32 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>
          </div>

          {/* Navigation Desktop uniquement */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-4 xl:px-8">
            <div className="flex items-center space-x-4 xl:space-x-8">
              <NavItems />
            </div>
          </div>

          {/* Menu Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? (
              <div className="flex gap-2">
                <div className="w-32 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-24 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-24 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              // Utilisateur connecté - Menu avec avatar
              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-10 h-10 bg-gradient-to-r from-pink-400 to-orange-300 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 cursor-pointer"
                >
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <Link 
                      href={
                        userRole === 'admin' ? '/admin' : 
                        userRole === 'entreprise' ? '/Mon-Studio' : 
                        userRole === 'prestataire' ? '/dashboard-prestataire' : 
                        '/dashboard-wedding'
                      }
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-orange-50 hover:text-pink-600 transition-all duration-200 cursor-pointer group"
                    >
                      <span className="w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        {userRole === 'admin' ? <Crown className="w-4 h-4 text-white" /> : 
                         userRole === 'entreprise' ? <Briefcase className="w-4 h-4 text-white" /> : 
                         userRole === 'prestataire' ? <Briefcase className="w-4 h-4 text-white" /> : 
                         <Heart className="w-4 h-4 text-white" />}
                      </span>
                      <span>
                        {userRole === 'admin' ? 'Espace Admin' : 
                         userRole === 'entreprise' ? 'Mon Studio' : 
                         userRole === 'prestataire' ? 'Espace Pro' : 
                         'Mon Mariage'}
                      </span>
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button 
                      onClick={() => { signOut(); setIsProfileMenuOpen(false); }} 
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer group"
                    >
                      <span className="w-8 h-8 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </span>
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Utilisateur NON connecté - 3 boutons modernes
              <>
                {/* Espace Prestataires */}
                <Link
                  href="/Studio-Arooskena"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-600 transition-all duration-200 group"
                >
                  <Briefcase className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Espace Prestataires</span>
                </Link>

                {/* Connexion */}
                <Link
                  href="/sign-in"
                  className="px-5 py-2 text-sm font-semibold text-pink-600 hover:text-pink-700 border border-pink-200 hover:border-pink-300 rounded-lg hover:bg-pink-50 transition-all duration-200"
                >
                  Connexion
                </Link>

                {/* Inscription */}
                <Link
                  href="/sign-up"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-orange-300 hover:from-pink-500 hover:to-orange-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Menu mobile/tablet */}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-orange-50 hover:text-pink-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300 cursor-pointer active:scale-95"
              aria-expanded={isMobileMenuOpen}
              aria-label="Menu principal"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile moderne */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-screen opacity-100 visible' 
            : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}>
          <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-4 sm:pb-6 space-y-2 sm:space-y-3 bg-gradient-to-b from-white to-pink-50/30 backdrop-blur-md border-t border-pink-100 overflow-y-auto max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)]">
            {/* Liens de navigation */}
            <div className="space-y-1">
              <MobileNavItems pathname={pathname} closeMobileMenu={closeMobileMenu} />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {user && (
                  <>
                    {/* Séparateur */}
                    <div className="border-t border-pink-200 my-1.5 sm:my-2"></div>
                    
                    {/* Dashboard Link */}
                    <Link
                      href={
                        userRole === 'admin' ? '/admin' : 
                        userRole === 'entreprise' ? '/Mon-Studio' : 
                        userRole === 'prestataire' ? '/dashboard-prestataire' : 
                        '/dashboard-wedding'
                      }
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 cursor-pointer group active:scale-98 transition-all"
                    >
                      <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-400 to-orange-300 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        {userRole === 'admin' ? <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : 
                         userRole === 'entreprise' ? <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : 
                         userRole === 'prestataire' ? <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : 
                         <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                      </span>
                      <span className="font-semibold text-sm sm:text-base text-gray-900">
                        {userRole === 'admin' ? 'Espace Admin' : 
                         userRole === 'entreprise' ? 'Mon Studio' : 
                         userRole === 'prestataire' ? 'Espace Pro' : 
                         'Mon Mariage'}
                      </span>
                    </Link>
                    
                    {/* Déconnexion */}
                    <button 
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                      className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-100 text-red-600 transition-all duration-200 cursor-pointer group active:scale-98"
                    >
                      <span className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </span>
                      <span className="font-semibold text-sm sm:text-base">Se déconnecter</span>
                    </button>
                  </>
                )}
                
                {!user && (
                  <>
                    {/* Séparateur */}
                    <div className="border-t border-pink-200 my-1.5 sm:my-2"></div>
                    
                    <div className="space-y-1.5 sm:space-y-2">
                      {/* Espace Prestataires */}
                      <Link 
                        href="/Studio-Arooskena" 
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 font-medium bg-white hover:bg-pink-50 active:bg-pink-50 border border-gray-200 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer active:scale-98"
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>Espace Prestataires</span>
                      </Link>
                      
                      {/* Connexion */}
                      <Link 
                        href="/sign-in" 
                        onClick={closeMobileMenu}
                        className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-pink-600 font-semibold bg-white hover:bg-pink-50 active:bg-pink-50 border border-pink-200 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer active:scale-98 text-center"
                      >
                        Connexion
                      </Link>
                      
                      {/* Inscription */}
                      <Link 
                        href="/sign-up" 
                        onClick={closeMobileMenu}
                        className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-lg sm:rounded-xl hover:from-pink-500 hover:to-orange-400 active:from-pink-500 active:to-orange-400 transition-all duration-300 shadow-md cursor-pointer active:scale-98 text-center"
                      >
                        Inscription
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Composant pour les liens de navigation mobile
const MobileNavItems = ({ pathname, closeMobileMenu }) => {
  // Liens publics uniquement (pas de dashboard ici)
  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/reception', label: 'Lieux de Réception' },
    { href: '/prestataire', label: 'Prestataires' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <div className="space-y-0.5 sm:space-y-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMobileMenu}
            className={`flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer active:scale-98 ${
              isActive
                ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 shadow-sm'
                : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50 active:bg-pink-50'
            }`}
          >
            <span className="flex-1">{link.label}</span>
            {isActive && (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-pink-400 to-orange-300 rounded-full animate-pulse flex-shrink-0"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default Navbar;

