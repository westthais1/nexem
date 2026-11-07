import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getTriEstimate, type TriBucket } from "@/lib/tri.functions";

function pct(b: TriBucket) {
  return b.total === 0 ? "—" : `${Math.round(b.taxa * 100)}%`;
}

export function TriSimulator() {
  const triFn = useServerFn(getTriEstimate);
  const { data, isPending, error } = useQuery({
    queryKey: ["tri-estimate"],
    queryFn: () => triFn(),
    retry: false,
  });

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 card-glow md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">TRI</span>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Simulador de Nota TRI Inteligente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimativa baseada no seu histórico real de questões respondidas no Simulado.
          </p>
        </div>
        {data && data.status !== "sem_dados" && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
              data.status === "chute"
                ? "border-warning/60 bg-warning/10 text-warning"
                : data.status === "consistente"
                  ? "border-success/50 bg-success/10 text-success"
                  : "border-border bg-background/40 text-muted-foreground"
            }`}
          >
            {data.status === "chute" ? (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            ) : data.status === "consistente" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            )}
            {data.rotuloStatus}
          </div>
        )}
      </div>

      {isPending ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Calculando sua nota TRI estimada…
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>
      ) : !data || data.status === "sem_dados" ? (
        <p className="mt-6 text-sm text-muted-foreground">{data?.diagnostico}</p>
      ) : (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <p className="text-xs text-muted-foreground">Nota TRI simulada</p>
              <p className="mt-1 text-4xl font-semibold text-foreground">
                {data.nota}
                <span className="text-lg text-muted-foreground">/1000</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.totalTentativas} {data.totalTentativas === 1 ? "questão respondida" : "questões respondidas"}
              </p>

              <div className="mt-5 space-y-3">
                {[
                  { label: "Fáceis", b: data.faceis },
                  { label: "Médias", b: data.medias },
                  { label: "Difíceis", b: data.dificeis },
                ].map(({ label, b }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/90">{label}</span>
                      <span className="text-muted-foreground">
                        {pct(b)} <span className="text-xs">({b.acertos}/{b.total})</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${Math.round(b.taxa * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/30 p-5">
              <h3 className="text-sm font-medium text-foreground">Evolução da Nota TRI (últimos 7 dias)</h3>
              <div className="mt-4 h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.serieSemanal} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="dia"
                      tickFormatter={(v: string) => v.slice(8) + "/" + v.slice(5, 7)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 1000]}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        color: "hsl(var(--foreground))",
                        fontSize: 12,
                      }}
                      formatter={(v) => [v ?? "—", "Nota TRI"] as [string | number, string]}
                    />
                    <Line
                      type="monotone"
                      dataKey="nota"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div
            className={`mt-5 rounded-2xl border p-5 ${
              data.status === "chute" ? "border-warning/60 bg-warning/10" : "border-primary/30 bg-primary/5"
            }`}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span aria-hidden="true">🧠</span> Diagnóstico da TRI
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-foreground/85">{data.diagnostico}</p>
          </div>
        </>
      )}
    </section>
  );
}
