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
import type { AnaliseF6PGI6 } from "@/lib/top-manager/repository/cione-f6pgi6/types";
import { consultarImpactoF6PGI6 } from "./consultarImpactoF6PGI6";
import { consultarReferenciasF6PGI6 } from "./consultarReferenciasF6PGI6";

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

  const { status, filtro: f } = resolverFiltroStatus(
    filtro,
    usuario.cdUsrTopManager,
  );

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

  /*
   * Impacto e referência só fazem sentido em análises concluídas.
   * Em rascunhos o operador está montando a análise — não há estatística.
   */
  const competencia = f.dtInicial ?? f.dtFinal;
  const [impacto, referencias] = await Promise.all([
    status === "concluida" && competencia
      ? consultarImpactoF6PGI6(competencia)
      : Promise.resolve(null),
    status === "concluida"
      ? consultarReferenciasF6PGI6()
      : Promise.resolve([]),
  ]);

  const periodo =
    status === "rascunho"
      ? "Todos os rascunhos"
      : f.dtInicial === f.dtFinal
        ? formatarDataBR(f.dtInicial ?? "")
        : `${formatarDataBR(f.dtInicial ?? "")} a ${formatarDataBR(f.dtFinal ?? "")}`;

  return {
    itens: analises.map((a: AnaliseF6PGI6) => ({
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
    lotes: lotes.map((l: { id: number; nome: string }) => ({
      valor: String(l.id),
      rotulo: l.nome,
    })),
    tipos: combo(tipos),
    silos: combo(silos),
    origens: [],
    status,
    periodo,
    resumos: resumo.slice(0, 6).map((r) => ({
      label: `${r.tipoNome ?? "—"} · ${r.loteNome ?? "—"}`,
      valor: `${num(r.consumototal)} (${r.qtdSilos} silos)`,
    })),
    impacto,
    referencias,
  };
}

export async function carregarF6PGI6(
  id: number,
): Promise<DetalheAnalise | null> {
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
      {
        label: "Competência",
        valor: a.competencia ? formatarDataBR(a.competencia) : "—",
      },
    ],
    grupos: [
      {
        titulo: "Leituras",
        itens: [
          {
            label: "Leitura inicial",
            valor: `${formatarDataBR(a.data)}${a.hora ? ` · ${a.hora}` : ""} · ${num(a.vazioInicial)} m`,
          },
          {
            label: "Leitura final",
            valor: a.dataFinal
              ? `${formatarDataBR(a.dataFinal)}${a.horaFinal ? ` · ${a.horaFinal}` : ""} · ${num(a.vazioFinal)} m`
              : "—",
          },
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
      dataInicial: a.data,
      horaInicial: a.hora,
      dataFinal: a.dataFinal ?? undefined,
      horaFinal: a.horaFinal ?? undefined,
      loteId: a.loteId,
      tipoId: a.tipoId,
      siloId: a.siloId,
      modoMedicao: a.modoMedicao,
      vazioInicial: a.vazioInicial,
      vazioFinal: a.vazioFinal,
      status: statusDoCard(a.status),
    },
  };
}