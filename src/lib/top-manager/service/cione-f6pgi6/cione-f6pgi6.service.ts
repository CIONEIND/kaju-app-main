import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import CioneF6PGI6Repository from "../../repository/cione-f6pgi6/cione-f6pgi6.repository";
import {
  salvarAnaliseF6PGI6Schema,
  type SalvarAnaliseF6PGI6SchemaType,
} from "./schemas";
import type { FiltroAnaliseF6PGI6 } from "../../repository/cione-f6pgi6/types";
import { buscarParametrosAnalise } from "@/lib/analises/parametros";
import {
  calcularConsumo,
  calcularLeitura,
  ErroCalculoSilo,
  type ResultadoCalculo,
} from "@/lib/analises/calculo-silo";
import {
  atravessouMeiaNoite,
  montarAbertura,
  somarDias,
} from "@/lib/analises/competencia";

function toSqlDateTime(data: string, hora?: string): string {
  return `${data} ${hora ?? "00:00"}:00`;
}

/** Arredonda para a escala da coluna */
function escala(valor: number | null, casas: number): number | null {
  if (valor === null) return null;
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/** Resultado de um salvamento, com a próxima análise quando houver */
export interface ResultadoSalvar {
  id: number;
  proximaAnaliseId: number | null;
  proximaCompetencia: string | null;
}

export default class CioneF6PGI6Service {
  private db: Knex = topManager;

  listar(filtro: FiltroAnaliseF6PGI6 = {}, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listar(filtro, tsx);
  }

  contar(filtro: FiltroAnaliseF6PGI6 = {}, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.contar(filtro, tsx);
  }

  buscarPorId(id: number, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.buscarPorId(id, tsx);
  }

  resumo(filtro: FiltroAnaliseF6PGI6 = {}, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.resumo(filtro, tsx);
  }

  listarLotes(tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listarLotes(tsx);
  }

  listarTipos(tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listarTipos(tsx);
  }

  listarSilos(tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listarSilos(tsx);
  }

  buscarRascunhoAberto(
    siloCdObj: number,
    tipoAnaliseCdObj?: number,
    tsx: Knex = this.db,
  ) {
    return CioneF6PGI6Repository.buscarRascunhoAberto(
      siloCdObj,
      tipoAnaliseCdObj,
      tsx,
    );
  }

  private validar(dto: SalvarAnaliseF6PGI6SchemaType) {
    const v = salvarAnaliseF6PGI6Schema.safeParse(dto);
    if (!v.success) {
      throw new Error(v.error.issues[0]?.message ?? "Dados inválidos.");
    }
    return v.data;
  }

  /** 0 = rascunho · 1 = concluída */
  private statusNum(s?: "rascunho" | "concluida"): number {
    return s === "rascunho" ? 0 : 1;
  }

  /** 0 = vazio · 1 = produto */
  private modoNum(m: "vazio" | "produto"): number {
    return m === "produto" ? 1 : 0;
  }

  /**
   * Resolve a geometria e o peso específico vigentes e aplica o motor
   * nas duas leituras do ciclo, devolvendo as colunas calculadas.
   */
  private async calcularCiclo(v: SalvarAnaliseF6PGI6SchemaType) {
  const data = new Date(`${v.dataInicial}T${v.horaInicial ?? "00:00"}:00`);
  const { geometria, peso } = await buscarParametrosAnalise(
    v.siloId,
    v.tipoId,
    data,
  );

    const temInicial = v.vazioInicial !== null && v.vazioInicial !== undefined;
    const temFinal = v.vazioFinal !== null && v.vazioFinal !== undefined;

    const inicial: ResultadoCalculo | null = temInicial
      ? calcularLeitura({
          geometria,
          valorMedido: v.vazioInicial as number,
          modo: v.modoMedicao,
          pesoEspecifico: peso.valorKgM3,
        })
      : null;

    const final: ResultadoCalculo | null = temFinal
      ? calcularLeitura({
          geometria,
          valorMedido: v.vazioFinal as number,
          modo: v.modoMedicao,
          pesoEspecifico: peso.valorKgM3,
        })
      : null;

    const consumo =
      inicial && final
        ? calcularConsumo(inicial, final, peso.valorKgM3)
        : null;

    return {
      VolumeInicial: escala(inicial?.volumeTotal ?? null, 4),
      VolumeFinal: escala(final?.volumeTotal ?? null, 4),
      PesoInicial: escala(inicial?.pesoKg ?? null, 3),
      PesoFinal: escala(final?.pesoKg ?? null, 3),
      VolumeConsumido: escala(consumo?.volumeConsumido ?? null, 4),
      PesoConsumido: escala(consumo?.pesoConsumido ?? null, 3),
    };
  }

private async montarLinha(v: SalvarAnaliseF6PGI6SchemaType) {
    let calculo: Awaited<ReturnType<typeof this.calcularCiclo>>;
    try {
      calculo = await this.calcularCiclo(v);
    } catch (e) {
      if (e instanceof ErroCalculoSilo) throw new Error(e.message);
      throw e;
    }

    return {
      DataHoraInicial: toSqlDateTime(v.dataInicial, v.horaInicial) as unknown as Date,
      DataHoraFinal: v.dataFinal
        ? (toSqlDateTime(v.dataFinal, v.horaFinal) as unknown as Date)
        : null,
      Responsavel: v.responsavelCdUsr,
      Lote: v.loteId,
      Silo: v.siloId,
      Tipo: v.tipoId,
      VazioInicial: v.vazioInicial ?? null,
      VazioFinal: v.vazioFinal ?? null,
      Competencia: v.dataInicial as unknown as Date,
      ModoMedicao: this.modoNum(v.modoMedicao),
      Status: this.statusNum(v.status),
      ...calculo,
    };
  }

  /**
   * Abre a próxima análise em rascunho quando a leitura final
   * atravessa a meia-noite. A leitura inicial é herdada da final,
   * para que o saldo do silo continue com consumo registrado.
   *
   * Não abre quando:
   * - a análise ainda é rascunho;
   * - não há leitura final;
   * - a leitura final não cruzou a meia-noite;
   * - já existe um rascunho aberto para o mesmo silo e tipo.
   */
  private async abrirProximaSeNecessario(
    v: SalvarAnaliseF6PGI6SchemaType,
    tsx: Knex,
  ): Promise<{ id: number; competencia: string } | null> {
    if (v.status === "rascunho") return null;
    if (v.vazioFinal === null || v.vazioFinal === undefined) return null;

    const cruzou = atravessouMeiaNoite(
      v.dataInicial,
      v.horaInicial,
      v.dataFinal ?? v.dataInicial,
      v.horaFinal,
    );
    if (!cruzou) return null;

    /* Já existe uma próxima aberta para este silo e tipo? Não duplica */
    const existente = await CioneF6PGI6Repository.buscarRascunhoAberto(
      v.siloId,
      v.tipoId,
      tsx,
    );
    if (existente) {
      return {
        id: existente.id,
        competencia: existente.competencia ?? somarDias(v.dataInicial, 1),
      };
    }

    const abertura = montarAbertura(
      v.dataInicial,
      v.horaInicial,
      v.vazioFinal,
      v.modoMedicao,
    );

    const proximoId = await CioneF6PGI6Repository.inserir(
      {
        DataHoraInicial: abertura.data + " " + abertura.hora as unknown as Date,
        DataHoraFinal: null,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Silo: v.siloId,
        Tipo: v.tipoId,
        VazioInicial: abertura.vazioInicial,
        VazioFinal: null,
        Competencia: abertura.competencia as unknown as Date,
        ModoMedicao: this.modoNum(abertura.modoMedicao),
        VolumeInicial: null,
        VolumeFinal: null,
        PesoInicial: null,
        PesoFinal: null,
        VolumeConsumido: null,
        PesoConsumido: null,
        Status: 0,
      },
      tsx,
    );

    return { id: proximoId, competencia: abertura.competencia };
  }

  async criar(
    dto: SalvarAnaliseF6PGI6SchemaType,
    tsx: Knex = this.db,
  ): Promise<ResultadoSalvar> {
    const v = this.validar(dto);
    const linha = await this.montarLinha(v);
    const id = await CioneF6PGI6Repository.inserir(linha, tsx);

    const proxima = await this.abrirProximaSeNecessario(v, tsx);

    return {
      id,
      proximaAnaliseId: proxima?.id ?? null,
      proximaCompetencia: proxima?.competencia ?? null,
    };
  }

  async atualizar(
    id: number,
    dto: SalvarAnaliseF6PGI6SchemaType,
    tsx: Knex = this.db,
  ): Promise<ResultadoSalvar> {
    const v = this.validar(dto);
    const linha = await this.montarLinha(v);

    const afetadas = await CioneF6PGI6Repository.atualizar(id, linha, tsx);
    if (!afetadas) throw new Error("Análise não encontrada.");

    const proxima = await this.abrirProximaSeNecessario(v, tsx);

    return {
      id,
      proximaAnaliseId: proxima?.id ?? null,
      proximaCompetencia: proxima?.competencia ?? null,
    };
  }
}