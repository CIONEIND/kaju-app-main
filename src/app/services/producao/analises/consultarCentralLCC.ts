"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneLCCService from "@/lib/top-manager/service/cione-lcc/cione-lcc.service";
import type {
  DetalheAnalise,
  FiltroCentral,
  ResultadoCentral,
} from "@/lib/analises/tipos";
import { formatarDataBR } from "@/lib/analises/numerico";
import { resolverFiltroStatus, statusDoCard } from "@/lib/analises/status-filtro";

const service = new CioneLCCService();

const num = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

export async function consultarCentralLCC(
  filtro: FiltroCentral,
): Promise<ResultadoCentral> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const { status, filtro: f } = resolverFiltroStatus(
    filtro,
    usuario.cdUsrTopManager,
  );

  const [analises, total, lotes, origens, resumo] = await Promise.all([
    service.listar(f),
    service.contar(f),
    service.listarLotes(),
    service.listarOrigens(),
    status === "rascunho"
      ? Promise.resolve({ quantidade: 0, total: 0 })
      : service.resumo({ ...f, status: "concluida" }),
  ]);

  return {
    itens: analises.map((a) => ({
      id: a.id,
      titulo: a.origemNome ?? "—",
      status: statusDoCard(a.status),
      linhas: [
        { label: "Lote", valor: a.loteNome ?? "—" },
        { label: "Origem", valor: a.origemNome ?? "—" },
        {
          label: "Data",
          valor: `${formatarDataBR(a.data)}${a.hora ? ` · ${a.hora}` : ""}`,
        },
        { label: "Responsável", valor: a.responsavelNome ?? "—" },
      ],
      metricas: [
        { label: "Viscosidade", valor: num(a.viscosidade) },
        { label: "Altura", valor: num(a.altura) },
        { label: "Temperatura", valor: num(a.temperatura) },
        { label: "Resultado", valor: num(a.resultado) },
      ],
    })),
    total,
    lotes: lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: [],
    origens: origens.map((o) => ({ valor: String(o.cdObj), rotulo: o.nome })),
    status,
    resumos:
      status === "rascunho"
        ? []
        : [
            {
              label: `Resumo geral · ${resumo.quantidade} registro${resumo.quantidade !== 1 ? "s" : ""}`,
              valor: num(resumo.total),
            },
          ],
  };
}

export async function carregarLCC(id: number): Promise<DetalheAnalise | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const a = await service.buscarPorId(id);
  if (!a) return null;

  return {
    id: a.id,
    titulo: `Análise LCC #${a.id}`,
    subtitulo: `${a.responsavelNome ?? "—"} · ${a.data}${a.hora ? ` · ${a.hora}` : ""}`,
    identificacao: [
      { label: "Lote", valor: a.loteNome ?? "—" },
      { label: "Origem", valor: a.origemNome ?? "—" },
      { label: "Responsável", valor: a.responsavelNome ?? "—" },
    ],
    grupos: [
      {
        titulo: "Medições",
        itens: [
          { label: "Viscosidade", valor: num(a.viscosidade) },
          { label: "Altura", valor: num(a.altura) },
          { label: "Temperatura", valor: num(a.temperatura) },
          { label: "Resultado", valor: num(a.resultado) },
        ],
      },
    ],
    dadosIniciais: {
      id: a.id,
      data: a.data,
      hora: a.hora,
      loteId: a.loteId,
      origemId: a.origemId,
      viscosidade: a.viscosidade,
      altura: a.altura,
      temperatura: a.temperatura,
    },
  };
}