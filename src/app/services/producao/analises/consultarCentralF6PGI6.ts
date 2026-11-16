"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import { formatarDataBR } from "@/lib/analises/numerico";
import {
  resolverFiltroStatus,
  statusDoCard,
} from "@/lib/analises/status-filtro";
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

export async function consultarCentralF6PGI6(
  filtro: FiltroCentral,
): Promise<ResultadoCentral> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const { status, filtro: f } = resolverFiltroStatus(
    filtro,
    usuario.cdUsrTopManager,
  );

  const combo = (lista: { cdObj: number; nome: string }[]) =>
    lista.map((i) => ({ valor: String(i.cdObj), rotulo: i.nome }));

  /* Resumo nunca mistura rascunho: em "rascunhos" ele é omitido */
  const [analises, total, lotes, tipos, silos, resumo] = await Promise.all([
    service.listar(f),
    service.contar(f),
    service.listarLotes(),
    service.listarTipos(),
    service.listarSilos(),
    status === "rascunho"
      ? Promise.resolve([])
      : service.resumo({ ...f, status: "concluida" }),
  ]);

  /* Período efetivamente aplicado — a UI mostra isso ao usuário */
  const periodo =
    status === "rascunho"
      ? "Todos os rascunhos"
      : f.dtInicial === f.dtFinal
        ? formatarDataBR(f.dtInicial ?? "")
        : `${formatarDataBR(f.dtInicial ?? "")} a ${formatarDataBR(f.dtFinal ?? "")}`;

  return {
    itens: analises.map((a) => ({
      id: a.id,
      titulo: a.tipoNome ?? "—",
      status: statusDoCard(a.status),
      linhas: [
        { label: "Lote", valor: a.loteNome ?? "—" },
        { label: "Silo", valor: a.siloNome ?? "—" },
        {
          label: "Data",
          valor: `${formatarDataBR(a.data)}${a.hora ? ` · ${a.hora}` : ""}`,
        },
        { label: "Responsável", valor: a.responsavelNome ?? "—" },
      ],
      metricas: [
        { label: "Vazio inicial", valor: num(a.vazioInicial) },
        { label: "Vazio final", valor: num(a.vazioFinal) },
        { label: "Volume consumido (m³)", valor: num(a.volumeConsumido) },
        { label: "Peso consumido (kg)", valor: num(a.pesoConsumido) },
      ],
    })),
    total,
    lotes: lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: combo(tipos),
    silos: combo(silos),
    origens: [],
    status,
    periodo,
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

  /* Rascunho de outra pessoa não é acessível: 0 = rascunho */
  if (a.status === 0 && a.responsavelCdUsr !== usuario.cdUsrTopManager) {
    return null;
  }

  return {
    id: a.id,
    titulo: `Análise F6PGI6 #${a.id}`,
    subtitulo: `${a.responsavelNome ?? "—"} · ${formatarDataBR(a.data)}${a.hora ? ` · ${a.hora}` : ""}`,
    identificacao: [
      { label: "Lote", valor: a.loteNome ?? "—" },
      { label: "Tipo", valor: a.tipoNome ?? "—" },
      { label: "Silo", valor: a.siloNome ?? "—" },
      { label: "Responsável", valor: a.responsavelNome ?? "—" },
      {
        label: "Modo de medição",
        valor: a.modoMedicao === "produto" ? "Produto" : "Vazio",
      },
    ],
    grupos: [
      {
        titulo: "Leituras",
        itens: [
          { label: "Vazio inicial (m)", valor: num(a.vazioInicial) },
          { label: "Vazio final (m)", valor: num(a.vazioFinal) },
        ],
      },
      {
        titulo: "Volumes",
        itens: [
          { label: "Volume inicial (m³)", valor: num(a.volumeInicial) },
          { label: "Volume final (m³)", valor: num(a.volumeFinal) },
          { label: "Volume consumido (m³)", valor: num(a.volumeConsumido) },
        ],
      },
      {
        titulo: "Pesos",
        itens: [
          { label: "Peso inicial (kg)", valor: num(a.pesoInicial) },
          { label: "Peso final (kg)", valor: num(a.pesoFinal) },
          { label: "Peso consumido (kg)", valor: num(a.pesoConsumido) },
        ],
      },
    ],
    dadosIniciais: {
      id: a.id,
      data: a.data,
      hora: a.hora,
      loteId: a.loteId,
      tipoId: a.tipoId,
      siloId: a.siloId,
      modoMedicao: a.modoMedicao,
      competencia: a.competencia ?? undefined,
      vazioInicial: a.vazioInicial,
      vazioFinal: a.vazioFinal,
      status: statusDoCard(a.status),
    },
  };
} 