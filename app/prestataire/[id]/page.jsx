'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, DollarSign, Phone, Mail, Globe, BadgeCheck, Gem, MessageCircle, Image as ImageIcon, Info, Briefcase, CheckCircle } from 'lucide-react';

export default function PrestataireDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [prestataire, setPrestataire] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    if (params.id) {
      loadPrestataireDetails();
    }
  }, [params.id]);

  const loadPrestataireDetails = async () => {
    try {
      console.log('🔍 Chargement du prestataire ID:', params.id);
      const { data: prestataireData, error: prestataireError } = await supabase
        .from('prestataires')
        .select(`
          *,
          categories(id, name, label),
          adresses(
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

      if (prestataireError) {
        console.error('❌ Erreur chargement prestataire:', prestataireError);
        console.error('❌ Détails erreur:', JSON.stringify(prestataireError, null, 2));
        router.push('/prestataire');
        return;
      }

      console.log('✅ Prestataire chargé:', prestataireData);

      // Charger les données de subscription_types si subscription_id existe
      if (prestataireData?.subscription_id) {
        const { data: subscriptionData } = await supabase
          .from('subscription_types')
          .select('id, name, label, price')
          .eq('id', prestataireData.subscription_id)
          .single();
        
        if (subscriptionData) {
          prestataireData.subscription_types = subscriptionData;
        }
      }

      setPrestataire(prestataireData);

      const { data: imagesData } = await supabase
        .from('prestataire_images')
        .select('*')
        .eq('prestataire_id', params.id)
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
        text="Chargement du prestataire..." 
      />
    );
  }

  if (!prestataire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="section-aroos text-center max-w-md">
          <div className="empty-state-icon">👥</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Prestataire introuvable</h2>
          <p className="text-gray-600 mb-6">
            Ce prestataire n'existe pas ou n'est plus disponible.
          </p>
          <Link href="/prestataire" className="btn-aroos">
            ← Retour aux prestataires
          </Link>
        </div>
      </div>
    );
  }

  const address = prestataire.adresses || null;

  // Helpers de contact
  const buildContactMessage = () => {
    const lines = [
      `Bonjour ${prestataire.nom_entreprise},`,
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
    const subject = `Demande d'information - ${prestataire.nom_entreprise}`;
    const body = buildContactMessage();
    if (prestataire.email) {
      window.location.href = `mailto:${prestataire.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleWhatsApp = () => {
    const text = buildContactMessage();
    const number = (prestataire.whatsapp || '').replace(/\s|\+/g, '');
    if (number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Hero visuel immersif */}
      <section className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] overflow-hidden">
        {selectedImage ? (
          <Image src={selectedImage.url} alt={prestataire.nom_entreprise} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {prestataire.categories && (
                  <span className="badge-aroos">{prestataire.categories.label}</span>
                )}
                {prestataire.is_featured && (
                  <span className="badge-aroos bg-purple-500 flex items-center gap-1">
                    <Gem className="w-4 h-4" /> En vedette
                  </span>
                )}
                {prestataire.is_verified && (
                  <span className="badge-aroos bg-green-500 flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4" /> Vérifié
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{prestataire.nom_entreprise}</h1>
              <p className="text-white/90 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {address ? `${address.commune}, ${address.region}` : 'Localisation sur demande'}
              </p>
            </div>
            <div className="hidden md:flex gap-3">
              <button onClick={handleWhatsApp} className="btn-aroos px-5 py-2 rounded-full flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              {prestataire.email && (
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
            <li><a href="#localisation" className="text-gray-700 hover:text-pink-600 font-medium">Localisation</a></li>
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
              <li><Link href="/prestataire" className="text-pink-600 hover:text-pink-700">Prestataires</Link></li>
              <li className="text-gray-600">{prestataire.nom_entreprise}</li>
            </ul>
          </div>
        </div>

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
                    alt={prestataire.nom_entreprise}
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
                  className={`relative h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage?.id === image.id ? 'border-pink-500 scale-105' : 'border-transparent hover:border-pink-300'}`}>
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
                  <div className="shrink-0 p-2 rounded-lg bg-pink-50 text-pink-600"><Briefcase className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Catégorie</p>
                    <p className="font-medium text-gray-800">{prestataire.categories?.label || '—'}</p>
                  </div>
                </div>

                <div className="p-4 bg-white border rounded-xl flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-lg bg-pink-50 text-pink-600"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Localisation</p>
                    <p className="font-medium text-gray-800">{address ? `${address.commune}, ${address.region}` : '—'}</p>
                  </div>
                </div>

                <div className="p-4 bg-white border rounded-xl flex items-start gap-3">
                  <div className="shrink-0 p-2 rounded-lg bg-pink-50 text-pink-600"><DollarSign className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Tarifs</p>
                    <p className="font-medium text-gray-800">{(prestataire.prix_min && prestataire.prix_max) ? `${prestataire.prix_min} – ${prestataire.prix_max} FDJ` : (prestataire.prix_min ? `${prestataire.prix_min} FDJ` : 'Sur demande')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Description */}
            {prestataire.description && (
              <div id="description" className="section-aroos">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-aroosPink" />
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {prestataire.description}
                </p>
              </div>
            )}

            {/* Services */}
            {prestataire.services_inclus && prestataire.services_inclus.length > 0 && (
              <div className="section-aroos">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-aroosPink" />
                  Services inclus
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {prestataire.services_inclus.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tarifs */}
            {(prestataire.prix_min || prestataire.prix_max) && (
              <div id="tarifs" className="section-aroos">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-aroosPink" />
                  Tarifs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prestataire.prix_min && prestataire.prix_max && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-800">Fourchette de prix</h3>
                      </div>
                      <p className="text-gray-700 font-medium">
                        De {prestataire.prix_min.toLocaleString()} à {prestataire.prix_max.toLocaleString()} FDJ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                {prestataire.telephone_fixe && (
                  <a 
                    href={`tel:${prestataire.telephone_fixe}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Téléphone</p>
                      <p className="font-medium text-gray-800">{prestataire.telephone_fixe}</p>
                    </div>
                  </a>
                )}

                {prestataire.whatsapp && (
                  <button 
                    onClick={handleWhatsApp}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <p className="text-xs text-gray-600">WhatsApp</p>
                      <p className="font-medium text-gray-800">{prestataire.whatsapp}</p>
                    </div>
                  </button>
                )}

                {prestataire.email && (
                  <a 
                    href={`mailto:${prestataire.email}`}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-medium text-gray-800 text-sm break-all">{prestataire.email}</p>
                    </div>
                  </a>
                )}

                {prestataire.website && (
                  <a 
                    href={prestataire.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="text-xs text-gray-600">Site web</p>
                      <p className="font-medium text-gray-800 text-sm break-all">{prestataire.website}</p>
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
                    <button type="submit" className="btn-aroos flex-1 rounded-full flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" /> Envoyer 
                    </button>
                    <button type="button" onClick={handleWhatsApp} className="btn-aroos-outline flex-1 rounded-full flex items-center justify-center gap-2 hover:bg-green-300">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="section-aroos">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ℹ️ Informations</h3>
              <div className="space-y-2 text-sm">
                {prestataire.is_verified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span className="badge-aroos bg-green-500">
                      Vérifié
                    </span>
                  </div>
                )}
                {prestataire.subscription_types && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Abonnement:</span>
                    <span className="badge-aroos bg-purple-500">
                      {prestataire.subscription_types.label || prestataire.subscription_types.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Ajouté le:</span>
                  <span className="font-medium">
                    {new Date(prestataire.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <Link href="/prestataire" className="btn-aroos-outline">
            ← Retour à la liste des prestataires
          </Link>
        </div>
      </div>

      {/* Barre d'action mobile (WhatsApp / Email) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-3">
          <button onClick={handleWhatsApp} className="flex-1 btn-aroos rounded-full flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          {prestataire.email && (
            <button onClick={()=>handleEmailSubmit()} className="flex-1 btn-aroos-outline rounded-full flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> E-mail
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
