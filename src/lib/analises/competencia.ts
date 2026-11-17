/** Data local no formato YYYY-MM-DD */
export function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Converte "YYYY-MM-DD" + "HH:mm" em Date local */
export function paraData(data: string, hora?: string): Date {
  return new Date(`${data}T${hora ?? "00:00"}:00`);
}

/** Soma dias a uma data ISO */
export function somarDias(dataISO: string, dias: number): string {
  const d = paraData(dataISO);
  d.setDate(d.getDate() + dias);
  return isoLocal(d);
}

/**
 * A competência é o dia da LEITURA INICIAL.
 * O consumo pertence ao dia em que o processamento começou.
 */
export function competenciaDaAnalise(
  dataInicial: string,
  horaInicial?: string,
): string {
  return dataInicial;
}

/**
 * Detecta se a leitura final atravessou a meia-noite
 * em relação à leitura inicial.
 */
export function atravessouMeiaNoite(
  dataInicial: string,
  horaInicial: string | undefined,
  dataFinal: string,
  horaFinal: string | undefined,
): boolean {
  const ini = paraData(dataInicial, horaInicial);
  const fim = paraData(dataFinal, horaFinal);
  return isoLocal(ini) !== isoLocal(fim);
}

/**
 * A abertura do dia seguinte herda a leitura final como leitura inicial.
 * A competência avança um dia.
 */
export interface AberturaHerdada {
  competencia: string;
  data: string;
  hora: string;
  vazioInicial: number;
  modoMedicao: "vazio" | "produto";
}

export function montarAbertura(
  dataFinal: string,
  horaFinal: string | undefined,
  vazioFinal: number,
  modoMedicao: "vazio" | "produto",
): AberturaHerdada {
  const competencia = somarDias(dataFinal, 1);
  return {
    competencia,
    data: competencia,
    hora: "00:00",
    vazioInicial: vazioFinal,
    modoMedicao,
  };
}