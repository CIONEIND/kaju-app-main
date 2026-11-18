"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF5PGI6Service from "@/lib/top-manager/service/cione-f5pgi6/cione-f5pgi6.service";
import type {
  CardAnaliseDados,
  DetalheAnalise,
  FiltroCentral,
  ResultadoCentral,
} from "@/lib/analises/tipos";
import { dataBR, dataHoraBR } from "@/lib/analises/data";

const service = new CioneF5PGI6Service();

function fmt(v: number | null): string {
  return v === null || v === undefined
    ? "—"
    : v.toFixed(2).replace(".", ",");
}

function statusDe(n: number): "concluida" | "rascunho" {
  return n === 0 ? "rascunho" : "concluida";
}

function toCard(
  a: Awaited<ReturnType<CioneF5PGI6Service["listar"]>>[number],
): CardAnaliseDados {
  return {
    id: a.id,
    titulo: `Lote ${a.loteNome ?? "—"} · ${dataBR(a.data)} ${a.hora}`,
    status: statusDe(a.status),
    linhas: [
      { label: "Silo", valor: a.siloNome ?? "—" },
      { label: "Tipo", valor: a.tipoNome ?? "—" },
      { label: "Origem", valor: a.origemNome ?? "—" },
      { label: "Responsável", valor: a.responsavelNome ?? "—" },
    ],
    metricas: [
      { label: "Média amêndoa", valor: fmt(a.mediaAmendoa) },
      { label: "Média casca", valor: fmt(a.mediaCasca) },
    ],
  };
}

export async function consultarCentralF5PGI6(
  filtro: FiltroCentral,
): Promise<ResultadoCentral> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return { itens: [], total: 0, lotes: [], tipos: [] };
  }
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [itens, total, lotes, tipos] = await Promise.all([
    service.listar(filtro),
    service.contar(filtro),
    service.listarLotes(),
    service.listarTipos(),
  ]);

  return {
    itens: itens.map(toCard),
    total,
    lotes: lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: tipos.map((t) => ({ valor: String(t.cdObj), rotulo: t.nome })),
  };
}

export async function carregarF5PGI6(
  id: number,
): Promise<DetalheAnalise | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario) return null;
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const a = await service.buscarPorId(id);
  if (!a) return null;

  return {
    id: a.id,
    titulo: `F5PGI6 — ${dataBR(a.data)} ${a.hora}`,
    subtitulo: `Lote ${a.loteNome ?? "—"} · ${a.siloNome ?? "—"}`,
    identificacao: [
      { label: "Lote", valor: a.loteNome ?? "—" },
      { label: "Silo", valor: a.siloNome ?? "—" },
      { label: "Tipo", valor: a.tipoNome ?? "—" },
      { label: "Origem", valor: a.origemNome ?? "—" },
      { label: "Responsável", valor: a.responsavelNome ?? "—" },
    ],
    grupos: [
      {
        titulo: "Umidade da amêndoa",
        itens: [
          { label: "Teste 1", valor: fmt(a.t1Amendoa) },
          { label: "Teste 2", valor: fmt(a.t2Amendoa) },
          { label: "Teste 3", valor: fmt(a.t3Amendoa) },
          { label: "Média", valor: fmt(a.mediaAmendoa) },
        ],
      },
      {
        titulo: "Umidade da casca",
        itens: [
          { label: "Teste 1", valor: fmt(a.t1Casca) },
          { label: "Teste 2", valor: fmt(a.t2Casca) },
          { label: "Teste 3", valor: fmt(a.t3Casca) },
          { label: "Média", valor: fmt(a.mediaCasca) },
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
      origemId: a.origemId,
      t1Amendoa: a.t1Amendoa,
      t2Amendoa: a.t2Amendoa,
      t3Amendoa: a.t3Amendoa,
      t1Casca: a.t1Casca,
      t2Casca: a.t2Casca,
      t3Casca: a.t3Casca,
      status: statusDe(a.status),
    },
  };
}