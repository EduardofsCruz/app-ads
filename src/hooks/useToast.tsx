import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, PartyPopper, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  titulo: string;
  descricao?: string;
  variante?: "default" | "sucesso" | "celebracao";
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-pop-in flex items-start gap-3 rounded-xl border border-border bg-background p-4 shadow-lg",
              t.variante === "celebracao" && "border-primary/30 bg-primary/5",
            )}
          >
            {t.variante === "celebracao" ? (
              <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.titulo}</p>
              {t.descricao && <p className="text-sm text-muted-foreground">{t.descricao}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
