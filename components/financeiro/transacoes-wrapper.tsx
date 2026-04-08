"use client";

import { useRouter } from "next/navigation";
import { TransacoesList } from "./transacoes-list";
import type { Transacao } from "@/lib/types";

interface TransacoesWrapperProps {
  transacoes: Transacao[];
}

export function TransacoesWrapper({ transacoes }: TransacoesWrapperProps) {
  const router = useRouter();

  return (
    <TransacoesList 
      transacoes={transacoes} 
      onUpdate={() => router.refresh()} 
    />
  );
}
