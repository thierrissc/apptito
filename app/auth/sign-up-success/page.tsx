import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="text-2xl">Conta criada com sucesso!</CardTitle>
          <CardDescription>
            Verifique seu email para confirmar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Seu cadastro foi realizado com sucesso. Sua conta sera ativada em breve. 
            Enquanto isso, entre em contato conosco para acelerar a ativacao.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para o Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
