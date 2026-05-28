import { Link } from "react-router-dom";
import { Wallet, Map, Bike, Gift, ArrowRight } from "lucide-react";

const shortcuts = [
  {
    to: "/caixa",
    label: "Controle de Caixa",
    description: "Lançamentos diários e exportação para Excel.",
    icon: Wallet,
    accent: "from-[var(--color-brand-green)]/15 to-transparent",
    iconColor: "text-[var(--color-brand-green)]",
  },
  {
    to: "/rotas",
    label: "Rotas Mensais",
    description: "Roteiros de entrega por bairro.",
    icon: Map,
    accent: "from-[var(--color-brand-blue)]/15 to-transparent",
    iconColor: "text-[var(--color-brand-blue)]",
  },
  {
    to: "/frota",
    label: "Controle de Frota",
    description: "Troca de óleo e manutenção das motos.",
    icon: Bike,
    accent: "from-[var(--color-brand-green)]/15 to-transparent",
    iconColor: "text-[var(--color-brand-green)]",
  },
  {
    to: "/cartoes",
    label: "Cartões de Aniversário",
    description: "Gere cartões promocionais para WhatsApp.",
    icon: Gift,
    accent: "from-[var(--color-brand-blue)]/15 to-transparent",
    iconColor: "text-[var(--color-brand-blue)]",
  },
] as const;

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um módulo para começar.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.to}
              to={s.to}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-md no-underline"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative flex items-start gap-4">
                <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-base text-foreground">{s.label}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
