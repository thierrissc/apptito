"use client"

import React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface SignUpFormProps {
  onPasswordFocusChange: (focused: boolean) => void
  onPasswordVisibilityChange: (visible: boolean) => void
  isPasswordVisible: boolean
}

export function SignUpForm({
  onPasswordFocusChange,
  onPasswordVisibilityChange,
  isPasswordVisible,
}: SignUpFormProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/login`,
          data: {
            nome,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Este email ja esta cadastrado")
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      router.push("/auth/sign-up-success")
    } catch (err) {
      setError("Erro ao conectar. Tente novamente.")
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    onPasswordVisibilityChange(!isPasswordVisible)
  }

  return (
    <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-10 md:px-16 lg:px-20 bg-card transition-colors duration-300">
      <div className="mb-10 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/apple-icon.png"
            alt="Apptito Logo"
            width={80}
            height={80}
            className="w-20 h-20 mx-auto"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-foreground">
          Criar Conta
        </h1>
        <p className="text-muted-foreground font-medium">
          Preencha seus dados para se cadastrar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
        <div className="input-group relative w-full">
          <Label
            htmlFor="nome"
            className="block text-sm font-semibold text-muted-foreground mb-1 transition-colors text-center"
          >
            Nome
          </Label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="block w-full py-2.5 px-0 text-foreground bg-transparent border-0 border-b-2 border-input appearance-none focus:outline-none focus:ring-0 focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="input-group relative w-full">
          <Label
            htmlFor="email"
            className="block text-sm font-semibold text-muted-foreground mb-1 transition-colors text-center"
          >
            Email
          </Label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full py-2.5 px-0 text-foreground bg-transparent border-0 border-b-2 border-input appearance-none focus:outline-none focus:ring-0 focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="input-group relative w-full">
          <Label
            htmlFor="password"
            className="block text-sm font-semibold text-muted-foreground mb-1 transition-colors text-center"
          >
            Senha
          </Label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={isPasswordVisible ? "text" : "password"}
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => onPasswordFocusChange(true)}
              onBlur={() => onPasswordFocusChange(false)}
              className="block w-full py-2.5 px-0 pr-10 text-foreground bg-transparent border-0 border-b-2 border-input appearance-none focus:outline-none focus:ring-0 focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-0 top-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
            >
              {isPasswordVisible ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full rounded-full py-6 font-semibold shadow-lg bg-black text-white hover:bg-black/90"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Ja tem uma conta? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
