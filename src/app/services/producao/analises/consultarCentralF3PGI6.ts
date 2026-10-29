// src/app/services/producao/analises/consultarCentralF3PGI6.ts
"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";
import type {
  DetalheAnalise,
  FiltroCentral,
  ResultadoCentral,
} from "@/lib/analises/tipos";
import { formatarDataBR } from "@/lib/analises/numerico";
import { resolverFiltroStatus, statusDoCard } from "@/lib/analises/status-filtro";


const service = new CioneF3PGI6Service();

const num = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
export async function consultarCentralF3PGI6(
  filtro: FiltroCentral,
): Promise<ResultadoCentral> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const { status, filtro: f } = resolverFiltroStatus(
    filtro,
    usuario.cdUsrTopManager,
  );

  const [analises, total, lotes, tipos] = await Promise.all([
    service.listar(f),
    service.contar(f),
    service.listarLotes(),
    service.listarTipos(),
  ]);

  return {
    itens: analises.map((a) => ({
      id: a.id,
      titulo: a.tipoNome ?? "—",
      status: statusDoCard(a.status),
      linhas: [
        { label: "Lote", valor: a.loteNome ?? "—" },
        {
          label: "Data",
          valor: `${formatarDataBR(a.data)}${a.hora ? ` · ${a.hora}` : ""}`,
        },
        { label: "Responsável", valor: a.responsavelNome ?? "—" },
      ],
      metricas: [
        { label: "Média amêndoa", valor: num(a.mediaAmendoa) },
        { label: "Média casca", valor: num(a.mediaCasca) },
      ],
    })),
    total,
    lotes: lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: tipos.map((t) => ({ valor: String(t.cdObj), rotulo: t.nome })),
    origens: [],
    status,
  };
}
export async function carregarF3PGI6(id: number): Promise<DetalheAnalise | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const a = await service.buscarPorId(id);
  if (!a) return null;

  const trio = (t1: number | null, t2: number | null, t3: number | null, m: number | null) => [
    { label: "Teste 1", valor: num(t1) },
    { label: "Teste 2", valor: num(t2) },
    { label: "Teste 3", valor: num(t3) },
    { label: "Média", valor: num(m) },
  ];

  return {
    id: a.id,
    titulo: `Análise F3PGI6 #${a.id}`,
    subtitulo: `${a.responsavelNome ?? "—"} · ${formatarDataBR(a.data)}${a.hora ? ` · ${a.hora}` : ""}`,
    identificacao: [
      { label: "Lote", valor: a.loteNome ?? "—" },
      { label: "Tipo", valor: a.tipoNome ?? "—" },
      { label: "Responsável", valor: a.responsavelNome ?? "—" },
    ],
    grupos: [
      { titulo: "Amêndoa", itens: trio(a.t1Amendoa, a.t2Amendoa, a.t3Amendoa, a.mediaAmendoa) },
      { titulo: "Casca", itens: trio(a.t1Casca, a.t2Casca, a.t3Casca, a.mediaCasca) },
    ],
    dadosIniciais: {
      id: a.id,
      data: a.data,
      hora: a.hora,
      loteId: a.loteId,
      tipoId: a.tipoId,
      t1Amendoa: a.t1Amendoa,
      t2Amendoa: a.t2Amendoa,
      t3Amendoa: a.t3Amendoa,
      t1Casca: a.t1Casca,
      t2Casca: a.t2Casca,
      t3Casca: a.t3Casca,
    },
  };
}