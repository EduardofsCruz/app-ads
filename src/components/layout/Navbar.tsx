import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMobileContent } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { usuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();

  function aoBuscar(e: React.FormEvent) {
    e.preventDefault();
    navigate(busca ? `/?busca=${encodeURIComponent(busca)}` : "/");
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetTrigger className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted lg:hidden">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent>
          <SidebarMobileContent onNavigate={() => setMenuAberto(false)} />
        </SheetContent>
      </Sheet>

      <form onSubmit={aoBuscar} className="relative hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar trailers, comidas..."
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      <div className="flex-1 sm:hidden">
        <p className="text-sm font-semibold">Câmara Food</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <Avatar className="h-9 w-9">
          <AvatarImage src={usuario?.foto} alt={usuario?.nome} />
          <AvatarFallback>{usuario?.nome?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
