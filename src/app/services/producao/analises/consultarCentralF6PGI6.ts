"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import type {
  DetalheAnalise,
  FiltroCentral,
  ResultadoCentral,
} from "@/lib/analises/tipos";

const service = new CioneF6PGI6Service();

const num = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

const combo = (lista: { cdObj: number; nome: string }[]) =>
  lista.map((i) => ({ valor: String(i.cdObj), rotulo: i.nome }));

export async function consultarCentralF6PGI6(
  filtro: FiltroCentral,
): Promise<ResultadoCentral> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [analises, total, lotes, tipos, silos, resumo] = await Promise.all([
    service.listar(filtro),
    service.contar(filtro),
    service.listarLotes(),
    service.listarTipos(),
    service.listarSilos(),
    service.resumo(filtro),
  ]);

  return {
    itens: analises.map((a) => ({
      id: a.id,
      titulo: a.tipoNome ?? "—",
      linhas: [
        { label: "Lote", valor: a.loteNome ?? "—" },
        { label: "Silo", valor: a.siloNome ?? "—" },
        { label: "Data", valor: `${a.data}${a.hora ? ` · ${a.hora}` : ""}` },
        { label: "Responsável", valor: a.responsavelNome ?? "—" },
      ],
      metricas: [
        { label: "Cubagem", valor: num(a.cubagem) },
        { label: "Consumo", valor: num(a.consumo) },
      ],
    })),
    total,
    lotes: lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: combo(tipos),
    silos: combo(silos),
    resumos: resumo.slice(0, 6).map((r) => ({
      label: `${r.tipoNome ?? "—"} · ${r.loteNome ?? "—"}`,
      valor: `${num(r.consumototal)} (${r.qtdSilos} silos)`,
    })),
  };
}

export async function carregarF6PGI6(id: number): Promise<DetalheAnalise | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const a = await service.buscarPorId(id);
  if (!a) return null;

  return {
    id: a.id,
    titulo: `Análise F6PGI6 #${a.id}`,
    subtitulo: `${a.responsavelNome ?? "—"} · ${a.data}${a.hora ? ` · ${a.hora}` : ""}`,
    identificacao: [
      { label: "Lote", valor: a.loteNome ?? "—" },
      { label: "Silo", valor: a.siloNome ?? "—" },
      { label: "Tipo", valor: a.tipoNome ?? "—" },
      { label: "Responsável", valor: a.responsavelNome ?? "—" },
    ],
    grupos: [
      {
        titulo: "Medições",
        itens: [
          { label: "Cubagem", valor: num(a.cubagem) },
          { label: "Consumo", valor: num(a.consumo) },
        ],
      },
    ],
    dadosIniciais: {
      id: a.id,
      data: a.data,
      hora: a.hora,
      loteId: a.loteId,
      siloId: a.siloId,
      tipoId: a.tipoId,
      cubagem: a.cubagem,
      consumo: a.consumo,
    },
  };
}