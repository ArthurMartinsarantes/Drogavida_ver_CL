import { NavLink, useLocation } from "react-router-dom";
import { Wallet, Map, Bike, Gift, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import drogaVidaLogo from "@/assets/droga-vida-logo.png";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/caixa", label: "Controle de Caixa", icon: Wallet, exact: false },
  { to: "/rotas", label: "Rotas Mensais", icon: Map, exact: false },
  { to: "/frota", label: "Controle de Frota", icon: Bike, exact: false },
  { to: "/cartoes", label: "Cartões de Aniversário", icon: Gift, exact: false },
] as const;

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
        <img
          src={drogaVidaLogo}
          alt="Logo da Droga Vida"
          className="h-10 w-10 shrink-0 object-contain"
          loading="eager"
          draggable={false}
        />
        <div className="leading-tight">
          <div className="font-display font-bold text-base">Droga Vida</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Sistema Interno
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors no-underline",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-brand-green)]" />
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
        v0.1 · interno
      </div>
    </aside>
  );
}
