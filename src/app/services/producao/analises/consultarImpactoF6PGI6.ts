"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import { formatarDataBR } from "@/lib/analises/numerico";
import type { AnaliseF6PGI6 } from "@/lib/top-manager/repository/cione-f6pgi6/types";
import type {
  ImpactoDia,
  ImpactoEstatisticas,
  ImpactoTipo,
} from "@/lib/analises/tipos";

const service = new CioneF6PGI6Service();

interface Soma {
  volume: number;
  peso: number;
}

const somaLista = (lista: AnaliseF6PGI6[]): Soma =>
  lista.reduce<Soma>(
    (acc: Soma, a: AnaliseF6PGI6) => ({
      volume: acc.volume + (a.volumeConsumido ?? 0),
      peso: acc.peso + (a.pesoConsumido ?? 0),
    }),
    { volume: 0, peso: 0 },
  );

/** Diferença em dias entre duas datas ISO, inclusiva */
function diasNoIntervalo(inicio: string, fim: string): number {
  const a = new Date(`${inicio}T00:00:00`);
  const b = new Date(`${fim}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

/**
 * Impacto das análises concluídas de um período nas estatísticas.
 *
 * Agrupa por tipo e por dia. Dias sem produção não entram na lista —
 * o operador vê apenas os dias que realmente tiveram análise, e o
 * contador `diasComProducao` mostra quantos foram.
 */
export async function consultarImpactoF6PGI6(
  dtInicial: string,
  dtFinal?: string,
): Promise<ImpactoEstatisticas | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const fim = dtFinal ?? dtInicial;

  const doPeriodo: AnaliseF6PGI6[] = await service.listar({
    dtInicial,
    dtFinal: fim,
    status: "concluida",
  });
  if (doPeriodo.length === 0) return null;

  /* Agrupa por tipo — todos os tipos do período entram */
  const porTipo = new Map<number, AnaliseF6PGI6[]>();
  for (const a of doPeriodo) {
    const chave = a.tipoId ?? 0;
    const lista = porTipo.get(chave);
    if (lista) lista.push(a);
    else porTipo.set(chave, [a]);
  }

  const totalGeral = somaLista(doPeriodo);

  const tipos: ImpactoTipo[] = Array.from(porTipo.entries())
    .map(([tipoId, lista]) => {
      const soma = somaLista(lista);
      return {
        tipoId,
        tipoNome: lista[0].tipoNome ?? "—",
        volume: soma.volume,
        peso: soma.peso,
        participacao:
          totalGeral.volume > 0
            ? (soma.volume / totalGeral.volume) * 100
            : 0,
      };
    })
    .sort((a, b) => b.volume - a.volume);

  /*
   * Agrupa por dia — só os dias com produção entram.
   * A data vem de `competencia` quando existir, senão de `data`.
   */
  const porDia = new Map<string, AnaliseF6PGI6[]>();
  for (const a of doPeriodo) {
    const chave = a.competencia ?? a.data;
    if (!chave) continue;
    const lista = porDia.get(chave);
    if (lista) lista.push(a);
    else porDia.set(chave, [a]);
  }

  const dias: ImpactoDia[] = Array.from(porDia.entries())
    .map(([data, lista]) => {
      const soma = somaLista(lista);
      /* Tipos daquele dia, para o detalhamento */
      const tiposDoDia = new Map<string, Soma>();
      for (const a of lista) {
        const nome = a.tipoNome ?? "—";
        const atual = tiposDoDia.get(nome) ?? { volume: 0, peso: 0 };
        tiposDoDia.set(nome, {
          volume: atual.volume + (a.volumeConsumido ?? 0),
          peso: atual.peso + (a.pesoConsumido ?? 0),
        });
      }
      return {
        data,
        dataBR: formatarDataBR(data),
        volume: soma.volume,
        peso: soma.peso,
        tipos: Array.from(tiposDoDia.entries()).map(([tipoNome, s]) => ({
          tipoNome,
          volume: s.volume,
          peso: s.peso,
        })),
      };
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  /*
   * A abertura é a última leitura final do período — o saldo que sobra
   * no silo e entra como abertura do dia seguinte.
   */
  const ultima = doPeriodo[0];

  const periodo =
    dtInicial === fim
      ? formatarDataBR(dtInicial)
      : `${formatarDataBR(dtInicial)} a ${formatarDataBR(fim)}`;

  return {
    periodo,
    tipos,
    dias,
    totalGeral,
    abertura: {
      volume: ultima.volumeFinal ?? 0,
      peso: ultima.pesoFinal ?? 0,
      vazio: ultima.vazioFinal ?? 0,
    },
    acumulado: dtInicial !== fim,
    diasComProducao: dias.length,
    diasNoPeriodo: diasNoIntervalo(dtInicial, fim),
  };
}