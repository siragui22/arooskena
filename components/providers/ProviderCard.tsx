import { Heart, Eye, MessageCircle, Euro } from "lucide-react";
import { WeddingBadge } from "@/components/ui/wedding-badge";
import { WeddingButton } from "@/components/ui/wedding-button";

interface Provider {
  id: string;
  nom_entreprise: string;
  description?: string;
  is_verified: boolean;
  is_featured: boolean;
  prix_min?: number;
  prix_max?: number;
  categories?: { name: string; label: string };
  subcategories?: { name: string; label: string };
  prestataire_images?: Array<{ url: string; is_main: boolean }>;
  address?: {
    adresse?: string;
    adresse_complete?: string;
    commune?: string;
  };
}

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const mainImage = provider.prestataire_images?.find(img => img.is_main) || provider.prestataire_images?.[0];
  const address = provider.address;

  return (
    <div className="wedding-card group overflow-hidden">
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage.url}
            alt={provider.nom_entreprise}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-accent/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-sm font-medium">Image à venir</p>
            </div>
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          {provider.is_featured && (
            <WeddingBadge variant="featured">⭐ En vedette</WeddingBadge>
          )}
          <div className="flex gap-2 ml-auto">
            {provider.is_verified ? (
              <WeddingBadge variant="verified">Vérifié</WeddingBadge>
            ) : (
              <WeddingBadge variant="pending">En attente</WeddingBadge>
            )}
          </div>
        </div>

        {/* Hover Heart Icon */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-white hover:scale-110 transition-all duration-300">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {provider.nom_entreprise}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {provider.categories && (
              <WeddingBadge variant="category">
                {provider.categories.label}
              </WeddingBadge>
            )}
            {provider.subcategories && (
              <WeddingBadge variant="category" className="bg-accent/60">
                {provider.subcategories.label}
              </WeddingBadge>
            )}
          </div>
        </div>

        {address && (
          <WeddingBadge variant="location" className="text-xs">
            {address.adresse_complete || address.adresse}, {address.commune}
          </WeddingBadge>
        )}

        {provider.description && (
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
            {provider.description}
          </p>
        )}

        {provider.prix_min && (
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Euro className="w-4 h-4" />
            <span>À partir de {provider.prix_min} FDJ</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-2">
            <WeddingButton variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              Détails
            </WeddingButton>
          </div>
          
          <WeddingButton size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Contacter
          </WeddingButton>
        </div>
      </div>
    </div>
  );
}
