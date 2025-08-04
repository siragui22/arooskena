'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavItems = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/reception', label: 'Lieux de Réception' },
    { href: '/prestataire', label: 'Prestataires' },
    
  ];

  return (
    <div className="flex gap-6">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-md font-medium ${
            pathname === href ? 'text-aroosPink font-bold' : 'text-pink-600 hover:text-aroosPink'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

export default NavItems;
