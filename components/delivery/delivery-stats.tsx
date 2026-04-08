"use client";

import { Bike, CheckCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface DeliveryStatsProps {
  pendentes: number;
  entreguesHoje: number;
  totalHoje: number;
}

export function DeliveryStats({ pendentes, entreguesHoje, totalHoje }: DeliveryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-warning/20 rounded-lg">
            <Bike className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pedidos em Andamento</p>
            <p className="text-2xl font-bold">{pendentes}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entregues Hoje</p>
            <p className="text-2xl font-bold">{entreguesHoje}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Faturamento Delivery Hoje</p>
            <p className="text-2xl font-bold">{formatCurrency(totalHoje)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
