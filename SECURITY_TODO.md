# 🔒 TODO SÉCURITÉ - AROOSKENA

## 📋 PHASE 2: RENFORCEMENT SÉCURITÉ

---

## ✅ ÉTAPE 2.1: Validation avec Zod

### Fichiers à créer:

#### `lib/validations/wedding.ts`
```typescript
import { z } from 'zod';

// Schéma pour créer un mariage
export const createWeddingSchema = z.object({
  title: z.string().min(3, "Titre trop court").max(255),
  wedding_date: z.string().datetime(),
  estimated_guests: z.number().int().positive().max(10000),
  max_budget: z.number().positive().optional(),
});

// Schéma pour ajouter une dépense
export const createExpenseSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  estimated_amount: z.number().positive().optional(),
  actual_amount: z.number().positive().optional(),
  payment_status: z.enum(['non_paye', 'acompte', 'solde', 'complet']),
  notes: z.string().max(1000).optional(),
  wedding_id: z.string().uuid(),
  budget_category_id: z.string().uuid(),
});

// Schéma pour ajouter une tâche
export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  status: z.enum(['a_faire', 'en_cours', 'termine']),
  priority: z.enum(['basse', 'moyenne', 'haute', 'critique']),
  due_date: z.string().datetime().optional(),
  wedding_id: z.string().uuid(),
});
```

#### `lib/validations/user.ts`
```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

export const signUpSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
});
```

#### `lib/validations/prestataire.ts`
```typescript
import { z } from 'zod';

export const createPrestataireSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  price_range: z.enum(['€', '€€', '€€€', '€€€€']).optional(),
});
```

---

## ✅ ÉTAPE 2.2: API Routes Sécurisées

### Structure à créer:
```
app/api/
├── wedding/
│   ├── route.ts              # GET wedding
│   ├── [id]/route.ts         # GET, PATCH, DELETE wedding
│   ├── expenses/route.ts     # POST expense
│   └── tasks/route.ts        # POST task
├── prestataires/
│   ├── route.ts              # GET all
│   └── [id]/route.ts         # GET detail
└── admin/
    ├── users/route.ts        # Admin only
    └── stats/route.ts        # Admin only
```

### Exemple d'API Route sécurisée:

#### `app/api/wedding/expenses/route.ts`
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createExpenseSchema } from '@/lib/validations/wedding';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 20)) { // 20 requêtes/minute
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // 2. Authentification
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Validation des données
    const body = await request.json();
    const validated = createExpenseSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validated.error.errors },
        { status: 400 }
      );
    }

    // 4. Vérifier ownership du wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('user_id')
      .eq('id', validated.data.wedding_id)
      .single();
    
    if (!wedding) {
      return NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      );
    }

    // 5. Vérifier que le user est propriétaire
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (wedding.user_id !== userData?.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not your wedding' },
        { status: 403 }
      );
    }

    // 6. Insérer avec RLS
    const { data, error } = await supabase
      .from('wedding_expenses')
      .insert([validated.data])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## ✅ ÉTAPE 2.3: Rate Limiting

### Fichier à créer: `lib/rate-limit.ts`
```typescript
import { LRUCache } from 'lru-cache';

// Cache pour stocker les compteurs de requêtes
const rateLimit = new LRUCache<string, number>({
  max: 500, // Nombre max d'IPs à tracker
  ttl: 60 * 1000, // 1 minute TTL
});

export interface RateLimitConfig {
  limit: number; // Nombre de requêtes max
  window: number; // Fenêtre de temps en ms
}

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60 * 1000
): boolean {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / window)}`;
  
  const count = (rateLimit.get(key) as number) || 0;
  
  if (count >= limit) {
    return false; // Limite atteinte
  }
  
  rateLimit.set(key, count + 1);
  return true; // OK
}

// Rate limiting spécifique par type d'action
export const rateLimits = {
  auth: { limit: 5, window: 15 * 60 * 1000 }, // 5 tentatives / 15 min
  createExpense: { limit: 20, window: 60 * 1000 }, // 20 / min
  createTask: { limit: 20, window: 60 * 1000 },
  upload: { limit: 10, window: 60 * 1000 }, // 10 uploads / min
  admin: { limit: 100, window: 60 * 1000 }, // Plus généreux pour admin
};
```

---

## ✅ ÉTAPE 2.4: Middleware Amélioré

### Fichier à modifier: `middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // 1. Rate limiting global
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip, 100)) { // 100 requêtes/min global
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // 2. Créer client Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 3. Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Protéger /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Vérifier rôle admin
    const { data: userData } = await supabase
      .from('users')
      .select('roles(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (userData?.roles?.name !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 5. Protéger /dashboard-wedding
  if (request.nextUrl.pathname.startsWith('/dashboard-wedding')) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // 6. Protéger /dashboard-prestataire
  if (request.nextUrl.pathname.startsWith('/dashboard-prestataire')) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('roles(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (userData?.roles?.name !== 'prestataire') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## ✅ ÉTAPE 2.5: Headers de Sécurité

### Fichier à modifier: `next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... config existante

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## ✅ ÉTAPE 2.6: Sanitization des Inputs

### Fichier à créer: `lib/sanitize.ts`
```typescript
import DOMPurify from 'isomorphic-dompurify';

/**
 * Nettoyer les inputs HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Nettoyer les strings simples
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprimer < et >
    .slice(0, 10000); // Limiter la longueur
}

/**
 * Valider et nettoyer un email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Valider et nettoyer un URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
```

### Utilisation dans les composants:
```tsx
import { sanitizeString, sanitizeHtml } from '@/lib/sanitize';

function MyForm() {
  const handleSubmit = (data) => {
    const cleaned = {
      name: sanitizeString(data.name),
      description: sanitizeHtml(data.description),
    };
    
    // Envoyer les données nettoyées
  };
}
```

---

## ✅ ÉTAPE 2.7: Sécuriser les Uploads

### Fichier à créer: `lib/upload-security.ts`
```typescript
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Vérifier le type MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé. Utilisez JPG, PNG, WEBP ou GIF.',
    };
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Maximum 5MB.',
    };
  }

  // Vérifier l'extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
    return {
      valid: false,
      error: 'Extension de fichier invalide.',
    };
  }

  return { valid: true };
}

// Générer un nom de fichier sécurisé
export function generateSecureFileName(userId: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${userId}_${timestamp}_${random}.${ext}`;
}
```

---

## 📋 CHECKLIST DE SÉCURITÉ

### Avant de déployer en production:

- [ ] ✅ Toutes les validations Zod en place
- [ ] ✅ API routes créées pour mutations sensibles
- [ ] ✅ Rate limiting configuré
- [ ] ✅ Middleware avec vérification de rôles
- [ ] ✅ Headers de sécurité ajoutés
- [ ] ✅ Sanitization des inputs
- [ ] ✅ Upload sécurisé
- [ ] ✅ RLS Supabase configuré et testé
- [ ] ✅ Aucun secret dans le code frontend
- [ ] ✅ HTTPS activé
- [ ] ✅ Logs d'erreur configurés (Sentry)
- [ ] ✅ Backup automatique DB
- [ ] ✅ Tests de sécurité effectués

---

## 🔐 TESTS DE SÉCURITÉ

### Tests à effectuer:

1. **SQL Injection**
   - Essayer d'injecter du SQL dans les inputs
   
2. **XSS**
   - Essayer d'injecter `<script>alert('XSS')</script>`
   
3. **CSRF**
   - Tester des requêtes depuis un autre domaine
   
4. **Rate Limiting**
   - Envoyer 100 requêtes rapidement
   
5. **Authorization**
   - Essayer d'accéder aux données d'un autre utilisateur
   - Essayer d'accéder à /admin sans être admin
   
6. **File Upload**
   - Essayer d'uploader un fichier .exe renommé en .jpg
   - Essayer d'uploader un fichier > 5MB

---

**🔒 Sécurité avant tout | 🛡️ Protection des données | ✅ Conformité RGPD**
