import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { WeddingButton } from "@/components/ui/wedding-button";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyVerified: boolean;
  onVerifiedChange: (checked: boolean) => void;
  categories: Array<{ id: string; name: string; label: string }>;
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  showOnlyVerified,
  onVerifiedChange,
  categories,
  activeFilter,
  onFilterChange
}: SearchFiltersProps) {
  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto">
        <div className="relative flex-1 w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un prestataire..."
            className="wedding-search pl-12 pr-4 py-4 text-base w-full"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* Verified Only Filter */}
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-md rounded-xl px-6 py-4 border border-border/50">
          <Checkbox
            id="verified-only"
            checked={showOnlyVerified}
            onCheckedChange={(checked) => onVerifiedChange(checked as boolean)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label 
            htmlFor="verified-only"
            className="text-sm font-medium cursor-pointer select-none"
          >
            Vérifiés uniquement
          </label>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-3 justify-center max-w-5xl">
          <WeddingButton
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
            className="gap-2"
          >
            <span>🏠</span>
            Tous
          </WeddingButton>
          
          {categories.map((category) => (
            <WeddingButton
              key={category.id}
              variant={activeFilter === category.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(category.id)}
              className="gap-2"
            >
              <span>🏢</span>
              {category.label}
            </WeddingButton>
          ))}
        </div>
      </div>
    </div>
  );
}
