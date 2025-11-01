'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, CircleDollarSign, Phone, Mail, Globe, BadgeCheck, Gem, MessageCircle, Image as ImageIcon, Info } from 'lucide-react';

export default function ReceptionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [lieu, setLieu] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    if (params.id) {
      loadLieuDetails();
    }
  }, [params.id]);

  const loadLieuDetails = async () => {
    try {
      // Charger les détails du lieu avec toutes les relations
      const { data: lieuData, error: lieuError } = await supabase
        .from('lieux_reception')
        .select(`
          *,
          lieu_types(id, name, label, description),
          lieu_subscription_types(id, name, label, price),
          adresses!lieux_reception_adresse_id_fkey(
            id,
            adresse_complete,
            commune,
            region,
            pays,
            quartiers
          )
        `)
        .eq('id', params.id)
        .single();

      if (lieuError) {
        console.error('❌ Erreur chargement lieu:', lieuError);
        router.push('/reception');
        return;
      }

      setLieu(lieuData);

      // Charger les images
      const { data: imagesData } = await supabase
        .from('lieu_reception_images')
        .select('*')
        .eq('lieu_reception_id', params.id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: false });

      setImages(imagesData || []);
      if (imagesData && imagesData.length > 0) {
        setSelectedImage(imagesData[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg" 
        text="Chargement du lieu..." 
      />
    );
  }

  if (!lieu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="section-aroos text-center max-w-md">
          <div className="empty-state-icon">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lieu introuvable</h2>
          <p className="text-gray-600 mb-6">
            Ce lieu de réception n'existe pas ou n'est plus disponible.
          </p>
          <Link href="/reception" className="btn-aroos">
            ← Retour aux lieux
          </Link>
        </div>
      </div>
    );
  }

  const address = lieu.adresses || null;

  // Helpers de contact
  const buildContactMessage = () => {
    const lines = [
      `Bonjour ${lieu.nom_lieu},`,
      '',
      contact.message,
      '',
      `Nom: ${contact.name}`,
      `Email: ${contact.email}`,
      contact.phone ? `Téléphone: ${contact.phone}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleEmailSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const subject = `Demande d'information - ${lieu.nom_lieu}`;
    const body = buildContactMessage();
    if (lieu.email) {
      window.location.href = `mailto:${lieu.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleWhatsApp = () => {
    const text = buildContactMessage();
    const number = (lieu.whatsapp || '').replace(/\s|\+/g, '');
    if (number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Hero visuel immersive */}
      <section className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] overflow-hidden">
        {selectedImage ? (
          <Image src={selectedImage.url} alt={lieu.nom_lieu} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {lieu.lieu_types && (
                  <span className="badge-aroos">{lieu.lieu_types.label}</span>
                )}
                {lieu.is_featured && (
                  <span className="badge-aroos bg-purple-500 flex items-center gap-1">
                    <Gem className="w-4 h-4 " /> En vedette
                  </span>
                )}
                {lieu.is_verified && (
                  <span className="badge-aroos bg-green-500 flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4" /> Vérifié
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{lieu.nom_lieu}</h1>
              <p className="text-white/90 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {address ? `${address.commune}, ${address.region}` : 'Localisation sur demande'}
              </p>
            </div>
            <div className="hidden md:flex gap-3">
              <button onClick={handleWhatsApp} className="btn-aroos px-5 py-2 rounded-full flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              {lieu.email && (
                <button onClick={(e)=>handleEmailSubmit(e)} className="btn-aroos-outline px-5 py-2 rounded-full flex items-center gap-2">
                  <Mail className="w-4 h-4" /> E-mail
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation de sections */}
      <nav className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="container mx-auto px-4">
          <ul className="flex gap-4 overflow-x-auto py-3 text-sm">
            <li><a href="#presentation" className="text-gray-700 hover:text-pink-600 font-medium">Présentation</a></li>
            <li><a href="#description" className="text-gray-700 hover:text-pink-600 font-medium">Description</a></li>
            <li><a href="#photos" className="text-gray-700 hover:text-pink-600 font-medium">Photos</a></li>
            <li><a href="#tarifs" className="text-gray-700 hover:text-pink-600 font-medium">Tarifs</a></li>
            <li><a href="#capacite" className="text-gray-700 hover:text-pink-600 font-medium">Capacité</a></li>
            <li><a href="#contact" className="text-gray-700 hover:text-pink-600 font-medium">Contact</a></li>
          </ul>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 pb-28 md:pb-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/" className="text-pink-600 hover:text-pink-700">Accueil</Link></li>
              <li><Link href="/reception" className="text-pink-600 hover:text-pink-700">Lieux de réception</Link></li>
              <li className="text-gray-600">{lieu.nom_lieu}</li>
            </ul>
          </div>
        </div>

        {/* Header remplacé par le Hero au-dessus */}

        {/* Galerie d'images */}
        {images.length > 0 && (
          <div id="photos" className="section-aroos mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-aroosPink" />
              Galerie photos
            </h2>
            
            {/* Image principale */}
            <div className="mb-4">
              <div className="relative w-full h-96 rounded-lg overflow-hidden">
                {selectedImage && (
                  <Image
                    src={selectedImage.url}
                    alt={lieu.nom_lieu}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>

            {/* Miniatures */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`relative h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImage?.id === image.id 
                      ? 'border-pink-500 scale-105' 
                      : 'border-transparent hover:border-pink-300'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`Photo ${image.id}`}
                    fill
                    className="object-cover"
                  />
                  {image.is_main && (
                    <div className="absolute top-1 right-1 bg-pink-500 text-white text-xs px-1 rounded">
                      ⭐
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Présentation */}
            <section id="presentation" className="section-aroos">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Présentation</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border rounded-xl flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-lg bg-pink-50 text-pink-600"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Localisation</p>
                    <p className="font-medium text-gray-800">{address ? `${address.commune}, ${address.region}` : '—'}</p>
                  </div>
                </div>

                <div className="p-4 bg-white border rounded-xl flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-lg bg-pink-50 text-pink-600"><Users className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Capacité</p>
                    <p className="font-medium text-gray-800">{(lieu.capacite_min && lieu.capacite_max) ? `${lieu.capacite_min} à ${lieu.capacite_max} pers.` : 'Sur demande'}</p>
                  </div>
                </div>

                <div className="p-4 bg-white border rounded-xl flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-lg bg-pink-50 text-pink-600"><CircleDollarSign className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Tarifs</p>
                    <p className="font-medium text-gray-800">{(lieu.prix_min && lieu.prix_max) ? `${lieu.prix_min} – ${lieu.prix_max} FDJ` : (lieu.prix_min ? `${lieu.prix_min} FDJ` : 'Sur demande')}</p>
                  </div>
                </div>
              </div>
            </section>
            {/* Description */}
            {lieu.description && (
              <div id="description" className="section-aroos">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-aroosPink" />
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {lieu.description}
                </p>
              </div>
            )}

            {/* Capacité et Prix */}
            <div id="tarifs" className="section-aroos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-aroosPink" />
                Capacité et Tarifs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lieu.capacite_min && lieu.capacite_max && (
                  <div id="capacite" className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">Capacité</h3>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {lieu.capacite_min} à {lieu.capacite_max} personnes
                    </p>
                  </div>
                )}

                {lieu.prix_min && lieu.prix_max && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CircleDollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-800">Tarif global</h3>
                    </div>
                    <p className="text-gray-700 font-medium">
                      De {lieu.prix_min.toLocaleString()} à {lieu.prix_max.toLocaleString()} FDJ
                    </p>
                  </div>
                )}

                {lieu.prix_par_personne && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CircleDollarSign className="w-5 h-5 text-pink-600" />
                      <h3 className="font-semibold text-gray-800">Prix par personne</h3>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {lieu.prix_par_personne.toLocaleString()} FDJ/personne
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse */}
            {address && (
              <div id="localisation" className="section-aroos">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-aroosPink" />
                  Localisation
                </h2>
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border-2 border-pink-200">
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">Adresse:</span> {address.adresse_complete || address.adresse}
                    </p>
                    {address.quartiers && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Quartier:</span> {address.quartiers}
                      </p>
                    )}
                    <p className="text-gray-700">
                      <span className="font-semibold">Commune:</span> {address.commune}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Région:</span> {address.region}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Pays:</span> {address.pays}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Carte de contact sticky */}
            <div id="contact" className="section-aroos sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-aroosPink" />
                Contact
              </h3>
              <div className="space-y-3">
                {lieu.telephone_fixe && (
                  <a 
                    href={`tel:${lieu.telephone_fixe}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Téléphone</p>
                      <p className="font-medium text-gray-800">{lieu.telephone_fixe}</p>
                    </div>
                  </a>
                )}

                {lieu.whatsapp && (
                  <button 
                    onClick={handleWhatsApp}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <p className="text-xs text-gray-600">WhatsApp</p>
                      <p className="font-medium text-gray-800">{lieu.whatsapp}</p>
                    </div>
                  </button>
                )}

                {lieu.email && (
                  <a 
                    href={`mailto:${lieu.email}`}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-medium text-gray-800 text-sm break-all">{lieu.email}</p>
                    </div>
                  </a>
                )}

                {lieu.website && (
                  <a 
                    href={lieu.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="text-xs text-gray-600">Site web</p>
                      <p className="font-medium text-gray-800 text-sm break-all">{lieu.website}</p>
                    </div>
                  </a>
                )}

                {/* Formulaire de contact */}
                <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom *</label>
                    <input type="text" required className="input-aroos w-full" placeholder="Votre nom complet"
                      value={contact.name} onChange={(e)=>setContact({ ...contact, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Votre email *</label>
                    <input type="email" required className="input-aroos w-full" placeholder="votre@email.com"
                      value={contact.email} onChange={(e)=>setContact({ ...contact, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Votre téléphone</label>
                    <input type="tel" className="input-aroos w-full" placeholder="+253 XX XX XX XX"
                      value={contact.phone} onChange={(e)=>setContact({ ...contact, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Votre message *</label>
                    <textarea required rows="4" className="input-aroos w-full" placeholder="Décrivez votre projet de mariage..."
                      value={contact.message} onChange={(e)=>setContact({ ...contact, message: e.target.value })} />
                </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-aroos flex-1 rounded-full flex items-center justify-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4" /> Envoyer 
                    </button>
                    <button type="button" onClick={handleWhatsApp} className="btn-aroos-outline flex-1 rounded-full flex items-center justify-center gap-2 cursor-pointer hover:bg-green-300">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="section-aroos">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-aroosPink" />
                Informations
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`badge-aroos ${lieu.is_active ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {lieu.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {lieu.lieu_subscription_types && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Abonnement:</span>
                    <span className="badge-aroos bg-purple-500">
                      {lieu.lieu_subscription_types.label || lieu.lieu_subscription_types.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Ajouté le:</span>
                  <span className="font-medium">
                    {new Date(lieu.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <Link href="/reception" className="btn-aroos-outline">
            ← Retour à la liste des lieux
          </Link>
        </div>
      </div>

      {/* Barre d'action mobile (WhatsApp / Email) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-3">
          <button onClick={handleWhatsApp} className="flex-1 btn-aroos rounded-full flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          {lieu.email && (
            <button onClick={()=>handleEmailSubmit()} className="flex-1 btn-aroos-outline rounded-full flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> E-mail
            </button>
          )}
        </div>
      </div>
    </div>
  );
}