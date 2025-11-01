/** @type {import('tailwindcss').Config} */
module.exports = {

  
  // Chemins de contenu fusionnés pour tous les types de projets
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // Préfixe pour les classes (optionnel)
  prefix: "",
  
  theme: {
    // Configuration du container responsive
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    
    extend: {
      // Système de couleurs fusionné
      colors: {
        // Couleurs personnalisées Arooskena
        'aroosPink': '#FF69B4',
        
        // Système de couleurs basé sur les variables CSS
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Couleurs de mariage personnalisées
        wedding: {
          gold: "hsl(var(--wedding-gold))",
          rose: "hsl(var(--wedding-rose))",
          pearl: "hsl(var(--wedding-pearl))",
          charcoal: "hsl(var(--wedding-charcoal))",
        },
      },
      
      // Border radius personnalisés
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // Animations personnalisées
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  
  // Plugins fusionnés
  plugins: [
    require("daisyui"),
    require("tailwindcss-animate")
  ],
  
  // Configuration DaisyUI
  daisyui: {
    themes: [
      {
        // Thème personnalisé Arooskena
        arooskena: {
          "primary": "#FF69B4",
          "secondary": "#FF1493",
          "accent": "#FFB6C1",
          "neutral": "#2a323c",
          "base-100": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      // Thème de base pour le mode clair
      "light",
    ],
  },
};
