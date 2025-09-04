import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// En mode développement, on peut utiliser des valeurs par défaut
if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co')) {
  console.warn('⚠️ Variables d\'environnement Supabase non configurées. Utilisez des valeurs par défaut pour le développement.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
