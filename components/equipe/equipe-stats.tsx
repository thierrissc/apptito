"use client";

import { Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface EquipeStatsProps {
  totalFuncionarios: number;
  totalSalarios: number;
}

export function EquipeStats({ totalFuncionarios, totalSalarios }: EquipeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
            <p className="text-2xl font-bold">{totalFuncionarios}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/20 rounded-lg">
            <DollarSign className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Folha de Pagamento</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSalarios)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
