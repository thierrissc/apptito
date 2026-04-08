"use client"

import { useState } from "react"
import { GeometricCharacters } from "@/components/login/geometric-characters"
import { SignUpForm } from "@/components/login/sign-up-form"

export default function SignUpPage() {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <main className="min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-8 lg:p-12 bg-muted transition-colors duration-300">
      <div className="w-full max-w-[1100px] h-screen sm:h-auto sm:min-h-[700px] bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row sm:rounded-3xl relative">
        <div className="w-full md:w-1/2 h-[35vh] md:h-auto bg-secondary relative overflow-hidden flex items-end justify-center transition-colors duration-300">
          <GeometricCharacters
            isPasswordFocused={isPasswordFocused}
            isPasswordVisible={isPasswordVisible}
          />
        </div>

        <SignUpForm
          onPasswordFocusChange={setIsPasswordFocused}
          onPasswordVisibilityChange={setIsPasswordVisible}
          isPasswordVisible={isPasswordVisible}
        />
      </div>
    </main>
  )
}
