import type { CardAnaliseDados, FiltroCentral } from "@/lib/analises/tipos";

export interface DadosEmailAnalises {
  titulo: string;
  itens: CardAnaliseDados[];
  resumos?: { label: string; valor: string }[];
  filtro: FiltroCentral;
  observacao?: string;
  usuario: string;
}

const INK = "#0f1621";
const BRAND = "#1e3a5f";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const SURFACE = "#f8fafc";

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "2026-10-05" -> "05/10/2026", sem Date e sem fuso. */
function dataBR(iso?: string): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

function periodoTexto(filtro: FiltroCentral): string {
  const ini = dataBR(filtro.dtInicial);
  const fim = dataBR(filtro.dtFinal);
  if (ini && fim) return `${ini} a ${fim}`;
  return ini || fim || "todo o período";
}

export function montarHtmlAnalises(dados: DadosEmailAnalises): string {
  const primeiro = dados.itens[0];
  const colunas = primeiro
    ? [
        "ID",
        "Tipo",
        ...primeiro.linhas.map((l) => l.label),
        ...primeiro.metricas.map((m) => m.label),
      ]
    : [];

  const th = (texto: string, alinhamento: "left" | "right" = "left") =>
    `<th align="${alinhamento}" style="padding:9px 12px;background:${SURFACE};border-bottom:1px solid ${LINE};text-align:${alinhamento};font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};white-space:nowrap;">${esc(texto)}</th>`;

  const td = (
    texto: string,
    opcoes: { alinhamento?: "left" | "right"; destaque?: boolean } = {},
  ) =>
    `<td align="${opcoes.alinhamento ?? "left"}" style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:${opcoes.alinhamento ?? "left"};font-size:12px;color:${opcoes.destaque ? INK : "#334155"};font-weight:${opcoes.destaque ? 700 : 400};">${esc(texto)}</td>`;

  const cabecalho = colunas.map((c, i) => th(c, i === 0 ? "left" : "left")).join("");

  const linhas = dados.itens
    .map((item) => {
      const id = `<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:700;color:${BRAND};white-space:nowrap;">#${item.id}</td>`;
      const titulo = td(item.titulo, { destaque: true });
      const campos = item.linhas
        .map((l) => td(l.valor))
        .join("");
      const metricas = item.metricas
        .map((m) => td(m.valor, { alinhamento: "right", destaque: true }))
        .join("");

      return `<tr>${id}${titulo}${campos}${metricas}</tr>`;
    })
    .join("");

  const resumoBloco =
    dados.resumos && dados.resumos.length > 0
      ? `
    <tr><td style="padding:22px 28px 0;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Resumo</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid ${LINE};border-radius:10px;border-collapse:separate;">
        ${dados.resumos
          .map(
            (r) => `<tr>
          <td style="padding:10px 14px;font-size:12px;color:${MUTED};border-bottom:1px solid ${LINE};">${esc(r.label)}</td>
          <td align="right" style="padding:10px 14px;font-size:14px;font-weight:700;color:${INK};border-bottom:1px solid ${LINE};white-space:nowrap;">${esc(r.valor)}</td>
        </tr>`,
          )
          .join("")}
      </table>
    </td></tr>`
      : "";

  const observacaoBloco = dados.observacao
    ? `
    <tr><td style="padding:20px 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:6px;">
        <tr><td style="padding:12px 14px;font-size:13px;line-height:1.55;color:#78350f;">
          <strong style="display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#b45309;margin-bottom:4px;">Observação</strong>
          ${esc(dados.observacao)}
        </td></tr>
      </table>
    </td></tr>`
    : "";

  const tabelaBloco =
    dados.itens.length > 0
      ? `
    <tr><td style="padding:24px 28px 6px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};margin-bottom:10px;">Registros</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
        <thead><tr>${cabecalho}</tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;border-collapse:separate;overflow:hidden;">

      <tr><td style="background:${INK};padding:20px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;background:#ffffff;border-radius:8px;font-size:16px;font-weight:800;color:${INK};">K</td>
                <td style="padding-left:10px;" valign="middle">
                  <div style="font-size:14px;font-weight:700;color:#ffffff;line-height:1.2;">Kaju</div>
                  <div style="font-size:11px;color:#94a3b8;line-height:1.3;">Operações</div>
                </td>
              </tr></table>
            </td>
            <td align="right" valign="middle">
              <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Relatório</div>
              <div style="font-size:12px;font-weight:700;color:#ffffff;margin-top:2px;">Produção</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:26px 28px 0;">
        <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Relatório de análises</div>
        <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;color:${BRAND};font-weight:700;">${esc(dados.titulo)}</h1>
        <div style="margin-top:8px;font-size:13px;color:${MUTED};line-height:1.5;">
          Período: <strong style="color:#334155;">${esc(periodoTexto(dados.filtro))}</strong>
          · ${dados.itens.length} registro${dados.itens.length !== 1 ? "s" : ""}
          · gerado por ${esc(dados.usuario)}
        </div>
      </td></tr>

      ${observacaoBloco}
      ${resumoBloco}
      ${tabelaBloco}

      <tr><td style="padding:20px 28px;background:${SURFACE};border-top:1px solid ${LINE};">
        <div style="font-size:11px;line-height:1.5;color:#94a3b8;">
          Enviado automaticamente pelo Kaju App em ${new Date().toLocaleDateString("pt-BR")}. Não responda este e-mail.
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}