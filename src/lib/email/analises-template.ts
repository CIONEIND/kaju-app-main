import type { CardAnaliseDados, FiltroCentral } from "@/lib/analises/tipos";

export interface DadosEmailAnalises {
  titulo: string;
  itens: CardAnaliseDados[];
  resumos?: { label: string; valor: string }[];
  filtro: FiltroCentral;
  observacao?: string;
  usuario: string;
}

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function montarHtmlAnalises(dados: DadosEmailAnalises): string {
  const periodo =
    [dados.filtro.dtInicial, dados.filtro.dtFinal].filter(Boolean).join(" a ") ||
    "todo o período";

  const cabecalho = [
    "ID",
    "Tipo",
    ...dados.itens[0].linhas.map((l) => l.label),
    ...dados.itens[0].metricas.map((m) => m.label),
  ]
    .map(
      (h) =>
        `<th style="padding:8px 10px;background:#f5f5f5;text-align:left;font-size:12px;text-transform:uppercase;color:#666;">${esc(h)}</th>`,
    )
    .join("");

  const linhas = dados.itens
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:600;">#${i.id}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;">${esc(i.titulo)}</td>
      ${i.linhas.map((l) => `<td style="padding:8px 10px;border-bottom:1px solid #eee;">${esc(l.valor)}</td>`).join("")}
      ${i.metricas.map((m) => `<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${esc(m.valor)}</td>`).join("")}
    </tr>`,
    )
    .join("");

  const resumos = (dados.resumos ?? [])
    .map(
      (r) => `<tr>
      <td style="padding:8px 10px;color:#666;">${esc(r.label)}</td>
      <td style="padding:8px 10px;text-align:right;font-weight:600;">${esc(r.valor)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #eee;">
      <p style="margin:0;font-size:11px;letter-spacing:.14em;color:#999;text-transform:uppercase;">Kaju App · Produção</p>
      <h1 style="margin:4px 0 0;font-size:20px;">Análises ${esc(dados.titulo)}</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#666;">Período: ${esc(periodo)} · ${dados.itens.length} registro(s) · gerado por ${esc(dados.usuario)}</p>
    </div>
    ${dados.observacao ? `<div style="padding:14px 24px;background:#fafafa;border-bottom:1px solid #eee;font-size:13px;">${esc(dados.observacao)}</div>` : ""}
    <div style="padding:16px 24px;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr>${cabecalho}</tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    ${resumos ? `<div style="padding:0 24px 20px;"><table style="width:100%;font-size:13px;border-collapse:collapse;">${resumos}</table></div>` : ""}
    <div style="padding:14px 24px;border-top:1px solid #eee;font-size:11px;color:#999;">
      Enviado automaticamente pelo Kaju App. Não responda este e-mail.
    </div>
  </div>
</body></html>`;
}