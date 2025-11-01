'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function StudioSetup() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/sign-in?redirect=/Studio-Arooskena/setup')
        return
      }

      // Vérifier le rôle
      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (!userData || !['entreprise', 'prestataire', 'admin'].includes(userData.roles?.name)) {
        router.push('/dashboard')
        return
      }

      // Récupérer le type depuis l'URL et rediriger
      const type = searchParams.get('type')
      
      if (type === 'prestataire') {
        router.push('/Studio-Arooskena/setup/prestataire')
        return
      }
      
      if (type === 'lieu') {
        router.push('/Studio-Arooskena/setup/lieu')
        return
      }
      
      // Si pas de type valide, rediriger vers onboarding
      router.push('/Studio-Arooskena/onboarding')
    }

    redirect()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="text-gray-600">Redirection...</p>
      </div>
    </div>
  )
}
