"use client"
import { useState } from "react"
import { supabase } from '../../lib/supabaseClient'
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
    } else {
      alert("Connexion réussie ✅")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-full max-w-md shadow-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Connexion</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="E-mail"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-sm">
          Pas encore inscrit ? <Link href="/signup" className="link">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
