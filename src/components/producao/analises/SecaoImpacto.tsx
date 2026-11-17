import type { ImpactoEstatisticas } from "@/lib/analises/tipos";

const n = (v: number, c: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });

export function SecaoImpacto({ dados }: { dados: ImpactoEstatisticas }) {
    const rotuloTipo = dados.acumulado
        ? `Total por tipo no período (${dados.periodo})`
        : `Total por tipo (${dados.periodo})`;
    const rotuloGeral = dados.acumulado
        ? `Total geral acumulado (${dados.periodo})`
        : `Total geral processado (${dados.periodo})`;

    return (
        <section className="rounded-xl border border-border bg-surface p-5">
            <header className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        *
                    </span>
                    Impacto nas estatísticas de produção
                </h3>
                <p className="mt-1.5 text-xs text-muted">
                    {dados.acumulado
                        ? "Como as análises do período alteram os totais e a abertura do dia seguinte."
                        : "Como as análises do dia alteram os totais e a abertura do dia seguinte."}
                </p>
            </header>

            <dl className="divide-y divide-border">
                {/* Um bloco por tipo processado no período */}
                <div className="py-2.5">
                    <dt className="mb-2 text-sm font-medium text-foreground">
                        {rotuloTipo}
                    </dt>
                    <dd className="space-y-2">
                        {dados.tipos.map((t) => (
                            <div key={t.tipoId}>
                                <div className="flex items-center justify-between gap-4 pl-3">
                                    <span className="text-sm text-muted">
                                        {t.tipoNome}
                                    </span>
                                    <span className="text-sm tabular-nums text-foreground">
                                        {n(t.volume, 2)} m³ / {n(t.peso, 2)} kg
                                    </span>
                                </div>
                                {/* Barra de participação no total */}
                                <div className="mt-1 flex items-center gap-2 pl-3">
                                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, t.participacao))}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-[11px] tabular-nums text-muted">
                                        {n(t.participacao, 1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-sm text-muted">{rotuloGeral}</dt>
                    <dd className="text-sm tabular-nums text-foreground">
                        +{n(dados.totalGeral.volume, 2)} m³ / +{n(dados.totalGeral.peso, 2)} kg
                    </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-2.5 font-medium">
                    <dt className="text-sm text-muted">
                        Abertura do dia seguinte (saldo)
                    </dt>
                    <dd className="text-sm tabular-nums text-primary">
                        {n(dados.abertura.volume, 2)} m³ / {n(dados.abertura.peso, 2)} kg
                    </dd>
                </div>
            </dl>

            {/* Quebra por dia — só os dias com produção */}
            {dados.acumulado && dados.dias.length > 0 && (
                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Produção por dia
                        </h4>
                        <span className="text-[11px] text-muted">
                            {dados.diasComProducao} de {dados.diasNoPeriodo} dias com produção
                        </span>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-secondary text-xs text-muted">
                                    <th className="px-3 py-1.5 text-left font-medium">Dia</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Volume</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Peso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {dados.dias.map((d) => (
                                    <tr key={d.data}>
                                        <td className="px-3 py-1.5 text-foreground">
                                            {d.dataBR}
                                        </td>
                                        <td className="px-3 py-1.5 text-right tabular-nums text-foreground">
                                            {n(d.volume, 2)} m³
                                        </td>
                                        <td className="px-3 py-1.5 text-right tabular-nums text-foreground">
                                            {n(d.peso, 2)} kg
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {dados.diasComProducao < dados.diasNoPeriodo && (
                        <p className="mt-2 text-[11px] text-muted">
                            Os dias sem produção no período não aparecem na lista.
                        </p>
                    )}
                </div>
            )}

            <p className="mt-4 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-muted">
                O saldo de {n(dados.abertura.vazio, 2)} m de vazio permanece no silo e
                entra como abertura do próximo dia.
            </p>
        </section>
    );
}