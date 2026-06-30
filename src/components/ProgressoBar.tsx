import { Progress } from "@/components/ui/progress";

interface ProgressoBarProps {
  progresso: number;
  meta: number;
}

export function ProgressoBar({ progresso, meta }: ProgressoBarProps) {
  const percentual = Math.min(100, Math.round((progresso / meta) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">Progresso para a recompensa</span>
        <span className="font-semibold text-primary">
          {progresso % meta || (progresso > 0 ? meta : 0)}/{meta}
        </span>
      </div>
      <Progress value={percentual} />
    </div>
  );
}
