
import Link from 'next/link';
import Image from 'next/image';
import NavItems from './NavItems';

const Navbar = () => {
  return (
    <div className="navbar  shadow-sm px-8">
      {/* Logo à gauche */}
      <div className="flex-1">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="Logo" width={132} height={132} />
        </Link>
      </div>

      {/* Liens du menu (centré) */}
      <div className=" hidden lg:flex justify-center flex-1">
        <NavItems />
      </div>

      {/* Connexion / Inscription (à droite) */}
      <div className="flex-none ml-8 space-x-4">
        <Link href="/login" className="text-gray-600 hover:text-aroosPink">Connexion</Link>
        <Link href="/register" className="text-gray-600 hover:text-aroosPink">Inscription</Link>
      </div>
    </div>
  );
};

export default Navbar;
