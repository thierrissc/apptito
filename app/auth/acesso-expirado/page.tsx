'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, MessageCircle, LogOut } from 'lucide-react'

export default function AcessoExpiradoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubConta, setIsSubConta] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function handleContact() {
    window.open('https://wa.me/5500000000000?text=Olá! Meu acesso ao Apptito expirou e gostaria de renovar.', '_blank')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Clock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Expirado</CardTitle>
          <CardDescription className="text-base">
            {isSubConta
              ? 'O periodo de acesso do sistema expirou. Entre em contato com o administrador.'
              : 'Seu periodo de acesso ao sistema terminou ou ainda nao foi configurado.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isSubConta
              ? 'O plano do administrador expirou, por isso seu acesso tambem foi suspenso. Quando o administrador renovar o plano, seu acesso sera restaurado automaticamente.'
              : 'Sua conta esta ativa, porem os dias de acesso ainda nao foram adicionados ou ja expiraram. Entre em contato conosco para liberar seu acesso.'}
          </p>
          
          <div className="flex flex-col gap-3">
            {!isSubConta && (
              <Button onClick={handleContact} className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                Entrar em Contato
              </Button>
            )}
            
            <Button variant="outline" onClick={handleLogout} className="w-full gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
