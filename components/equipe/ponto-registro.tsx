"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEffectiveUserId } from "@/lib/get-effective-user";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Funcionario } from "@/lib/types";

interface PontoRegistroProps {
  funcionarios: Funcionario[];
}

interface RegistroPonto {
  id: string;
  funcionario_id: string;
  tipo: "entrada" | "saida_almoco" | "volta_almoco" | "saida";
  data_hora: string;
}

export function PontoRegistro({ funcionarios }: PontoRegistroProps) {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const hoje = new Date().toISOString().split("T")[0];

  const fetchRegistros = async () => {
    setLoading(true);
    
    const userInfo = await getEffectiveUserId();
    if (!userInfo) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("ponto_registros")
      .select("*")
      .eq("user_id", userInfo.effectiveUserId)
      .gte("data_hora", `${hoje}T00:00:00`)
      .lte("data_hora", `${hoje}T23:59:59`)
      .order("data_hora", { ascending: false });

    if (data) setRegistros(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistros();
    const channel = supabase
      .channel('ponto_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ponto_registros' },
        () => {
          fetchRegistros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const registrarPonto = async (funcionarioId: string, tipo: RegistroPonto["tipo"]) => {
    const userInfo = await getEffectiveUserId();
    if (!userInfo) return;

    const { error } = await supabase.from("ponto_registros").insert({
      user_id: userInfo.effectiveUserId,
      funcionario_id: funcionarioId,
      tipo,
      data_hora: new Date().toISOString(),
    });

    if (!error) {
      fetchRegistros();
    }
  };

  const getUltimoRegistro = (funcionarioId: string) => {
    return registros.find(r => r.funcionario_id === funcionarioId);
  };

  const getProximoTipo = (funcionarioId: string): RegistroPonto["tipo"] | null => {
    const registrosFuncionario = registros.filter(r => r.funcionario_id === funcionarioId);
    if (registrosFuncionario.length === 0) return "entrada";
    
    const ultimo = registrosFuncionario[0];
    switch (ultimo.tipo) {
      case "entrada": return "saida_almoco";
      case "saida_almoco": return "volta_almoco";
      case "volta_almoco": return "saida";
      case "saida": return null;
      default: return "entrada";
    }
  };

  const tipoConfig = {
    entrada: { label: "Entrada", icon: LogIn, color: "text-success" },
    saida_almoco: { label: "Saída Almoço", icon: Coffee, color: "text-warning" },
    volta_almoco: { label: "Volta Almoço", icon: Coffee, color: "text-blue-600" },
    saida: { label: "Saída", icon: LogOut, color: "text-destructive" },
  };

  const getInitials = (nome: string) => {
    return nome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatHora = (dataHora: string) => {
    return new Date(dataHora).toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Carregando registros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Registro de Ponto - {new Date().toLocaleDateString("pt-BR")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionarios.map((funcionario) => {
            const proximoTipo = getProximoTipo(funcionario.id);
            const registrosFuncionario = registros.filter(r => r.funcionario_id === funcionario.id);

            return (
              <div key={funcionario.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(funcionario.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{funcionario.nome}</h4>
                    <p className="text-sm text-muted-foreground">{funcionario.cargo}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {registrosFuncionario.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum registro hoje</p>
                  ) : (
                    registrosFuncionario.reverse().map((registro) => {
                      const config = tipoConfig[registro.tipo];
                      const Icon = config.icon;
                      return (
                        <div key={registro.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                          <span className="font-medium">{formatHora(registro.data_hora)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {proximoTipo ? (
                  <Button
                    onClick={() => registrarPonto(funcionario.id, proximoTipo)}
                    className="w-full"
                    size="sm"
                  >
                    {(() => {
                      const config = tipoConfig[proximoTipo];
                      const Icon = config.icon;
                      return (
                        <>
                          <Icon className="h-4 w-4 mr-2" />
                          Registrar {config.label}
                        </>
                      );
                    })()}
                  </Button>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Jornada Completa
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
