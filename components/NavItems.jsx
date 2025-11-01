'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavItems = () => {
  const pathname = usePathname();

  // Liens de navigation (pas de dashboard ici, c'est dans le menu avatar)
  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/reception', label: 'Lieux de Réception' },
    { href: '/prestataire', label: 'Prestataires' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <div className="flex items-center space-x-3 lg:space-x-4 xl:space-x-6">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3 lg:px-4 py-2 text-xs lg:text-sm xl:text-base font-medium transition-all duration-300 group rounded-lg cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-pink-600 bg-gradient-to-r from-pink-50 to-orange-50 shadow-sm'
                : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
            }`}
          >
            <span>{link.label}</span>
            
            {/* Indicateur actif */}
            <span
              className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-400 to-orange-300 transform transition-all duration-300 rounded-full ${
                isActive
                  ? 'scale-x-100 opacity-100'
                  : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
              }`}
            />
            
            {/* Point indicateur pour l'état actif */}
            {isActive && (
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gradient-to-r from-pink-400 to-orange-300 rounded-full animate-pulse"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default NavItems;
