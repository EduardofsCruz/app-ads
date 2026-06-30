import { NavLink, Outlet } from "react-router-dom";
import { Home, Trophy, Store, User } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-camara-bg">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:pb-6">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}

function MobileTabBar() {
  const { usuario } = useAuth();
  const items = [
    { to: "/", label: "Início", icon: Home },
    { to: "/fidelidade", label: "Fidelidade", icon: Trophy },
    ...(usuario?.tipo === "empreendedor"
      ? [{ to: "/trailer/dashboard", label: "Trailer", icon: Store }]
      : []),
    { to: "/perfil", label: "Perfil", icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
