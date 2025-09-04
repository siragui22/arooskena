'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  })

  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const generateSlug = (userId: string, first: string, last: string) => {
    return `${userId}-${first}-${last}`
      .toLowerCase()
      .replace(/\s+/g, '-')        // espaces → tirets
      .replace(/[^a-z0-9\-]/g, '') // caractères spéciaux → supprimés
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { email, password, first_name, last_name, phone } = formData

    // Étape 1 : création via Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !authData.user?.id) {
      alert(`Erreur lors de l'inscription : ${signUpError?.message || 'Utilisateur non créé'}`)
      return
    }

    const auth_user_id = authData.user.id

    // Étape 2 : vérifier si l'email existe déjà dans users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    let user_id: string

    if (existingUser) {
      user_id = existingUser.id
    } else {
      // Étape 3 : insertion dans users avec first_name et phone
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{ auth_user_id, email, phone, first_name, is_active: true }])
        .select('id')

      if (userError || !userData || userData.length === 0) {
        alert(`Erreur lors de la création du compte utilisateur : ${userError?.message || 'Utilisateur non enregistré'}`)
        return
      }

      user_id = userData[0].id
    }

    // Étape 4 : insertion dans profiles avec slug
    const slug = generateSlug(user_id, first_name, last_name)

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ user_id, first_name, last_name, slug }])

    if (profileError) {
      alert(`Erreur lors de l'enregistrement du profil : ${profileError.message}`)
      return
    }

    alert('Inscription réussie ! 🎉')
    router.push('/')
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <form onSubmit={handleSubmit} className="card w-full max-w-md bg-base-100 shadow-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center">Créer un compte</h2>

        <input name="first_name" placeholder="Prénom" className="input input-bordered w-full" onChange={handleChange} required />
        <input name="last_name" placeholder="Nom" className="input input-bordered w-full" onChange={handleChange} required />
        <input name="phone" placeholder="Téléphone" className="input input-bordered w-full" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" className="input input-bordered w-full" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Mot de passe" className="input input-bordered w-full" onChange={handleChange} required />

        <button type="submit" className="btn btn-primary w-full">S&apos;inscrire</button>
      </form>
    </div>
  )
}
