'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, MessageSquare, Twitter, Linkedin } from 'lucide-react';

const FooterComponent = () => {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="bg-[#000000] text-gray-300 font-sans">
      <footer className="container mx-auto px-10 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10">
          
          {/* 1. Identité & présentation */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/logo.svg" alt="Arooskena Logo" width={150} height={50} />
              {/* <span className="font-bold text-2xl text-white">Arooskena</span> */}
            </Link>
            <p className="text-base max-w-sm mb-6">
              La première plateforme à Djibouti dédiée à l’organisation de mariages.
            </p>
            <div className="flex space-x-4 mb-6">
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-pink-200"><Twitter /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Linkedin /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Instagram /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Facebook /></a>
            </div>
            <button 
              onClick={scrollToTop}
              className="mt-4 px-4 py-2 border border-gray-400 rounded-md text-sm inline-flex items-center gap-2 hover:bg-pink-200/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              RETOUR EN HAUT
            </button>
          </div>

          {/* 2. Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4">Informations</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/footer/about" className="hover:text-white hover:underline">À propos</Link>
              <Link href="/footer/about-us" className="hover:text-white hover:underline">Qui sommes-nous ?</Link>
              <Link href="/footer/prestataires" className="hover:text-white hover:underline">Prestataires</Link>
              <Link href="/footer/how-it-works" className="hover:text-white hover:underline">Comment ça marche ?</Link>
              <Link href="/footer/conseils" className="hover:text-white hover:underline">Conseils & Inspirations</Link>
              <Link href="/footer/contact" className="hover:text-white hover:underline">Contactez-nous</Link>
            </div>
          </div>

          {/* 3. Légal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Légal</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/footer/mentions-legales" className="hover:text-white hover:underline">Mentions légales</Link>
              <Link href="/footer/politique-confidentialite" className="hover:text-white hover:underline">Politique de confidentialité</Link>
              <Link href="/footer/cgu" className="hover:text-white hover:underline">Conditions d'utilisation</Link>
              <Link href="/footer/faq" className="hover:text-white hover:underline">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>
      <div className="bg-[#b8860b]">
        <div className="container mx-auto px-10 py-3 text-center text-black text-sm text-bold">
          <p>Copyright © {new Date().getFullYear()} arooskena.com, Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

// We need to export this as a default export to be used in layout.jsx
export default FooterComponent;

// This is the page component for /footer
const FooterPage = () => {
  return <FooterComponent />;
};
