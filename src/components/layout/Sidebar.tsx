import { NavLink } from "react-router-dom";
import { Home, Trophy, Store, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  somenteEmpreendedor?: boolean;
}

const ITEMS: NavItem[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/fidelidade", label: "Fidelidade", icon: Trophy },
  { to: "/trailer/dashboard", label: "Meu Trailer", icon: Store, somenteEmpreendedor: true },
  { to: "/perfil", label: "Perfil", icon: User },
];

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { usuario } = useAuth();
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {ITEMS.filter((item) => !item.somenteEmpreendedor || usuario?.tipo === "empreendedor").map(
        (item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-camara-text/70 hover:bg-muted hover:text-camara-text",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg">
          🌭
        </div>
        <div>
          <p className="text-base font-bold leading-none">Câmara Food</p>
          <p className="text-xs text-muted-foreground">Esplanada dos Ministérios</p>
        </div>
      </div>
      <SidebarLinks />
    </aside>
  );
}

export function SidebarMobileContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-1 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg">
          🌭
        </div>
        <div>
          <p className="text-base font-bold leading-none">Câmara Food</p>
          <p className="text-xs text-muted-foreground">Esplanada dos Ministérios</p>
        </div>
      </div>
      <SidebarLinks onNavigate={onNavigate} />
    </div>
  );
}
