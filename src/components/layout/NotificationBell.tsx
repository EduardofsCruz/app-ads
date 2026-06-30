import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listarTodasNotificacoes } from "@/lib/services/notificacoes";
import { CATEGORIAS } from "@/lib/types";
import type { NotificacaoPush } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoPush[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listarTodasNotificacoes().then(setNotificacoes);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const relevantes = notificacoes.filter(
    (n) => !n.segmentacao_preferencia || usuario?.preferencias_alimentares.includes(n.segmentacao_preferencia),
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {relevantes.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </button>
      {aberto && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-background p-2 shadow-lg">
          <p className="px-2 py-1.5 text-sm font-semibold">Notificações patrocinadas</p>
          <div className="max-h-80 overflow-y-auto">
            {relevantes.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                Nenhuma notificação por aqui ainda.
              </p>
            )}
            {relevantes.map((n) => {
              const categoria = CATEGORIAS.find((c) => c.value === n.segmentacao_preferencia);
              return (
                <div key={n.id} className={cn("rounded-lg p-2.5 hover:bg-muted")}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{n.titulo}</p>
                    {categoria && <span className="text-base leading-none">{categoria.emoji}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                  {n.segmentacao_horario && (
                    <p className="mt-1 text-xs text-secondary">{n.segmentacao_horario}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
