import { cn } from "@/lib/utils";
import { Check, Clock, Star, MapPin } from "lucide-react";

interface WeddingBadgeProps {
  variant: "verified" | "pending" | "featured" | "category" | "location";
  children: React.ReactNode;
  className?: string;
}

export function WeddingBadge({ variant, children, className }: WeddingBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300";
  
  const variants = {
    verified: "wedding-badge-verified",
    pending: "wedding-badge-pending", 
    featured: "wedding-badge-featured",
    category: "bg-secondary/80 text-secondary-foreground border border-border/50",
    location: "bg-muted/80 text-muted-foreground border border-border/30"
  };

  const icons = {
    verified: <Check className="w-3.5 h-3.5" />,
    pending: <Clock className="w-3.5 h-3.5" />,
    featured: <Star className="w-3.5 h-3.5" />,
    category: null,
    location: <MapPin className="w-3.5 h-3.5" />
  };

  return (
    <span className={cn(baseClasses, variants[variant], className)}>
      {icons[variant]}
      {children}
    </span>
  );
}
