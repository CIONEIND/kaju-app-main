"use client";

import { useOverlayState } from "@heroui/react";
import { FileDown, Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { carregarAnalise } from "@/app/services/producao/analises/carregarAnalise";
import type { CardAnaliseDados } from "@/lib/analises/tipos";
import { EnviarAnaliseModal } from "./EnviarAnaliseModal";

function toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function CardAnaliseAcoes({
    tipo,
    item,
}: {
    tipo: string;
    item: CardAnaliseDados;
}) {
    const modal = useOverlayState();
    const [gerando, setGerando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const gerarPdfBase64 = useCallback(async () => {
        const detalhe = await carregarAnalise(tipo, item.id);
        if (!detalhe) throw new Error("Análise não encontrada.");

        const [{ pdf }, { AnalisePDF }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("./AnalisePDF"),
        ]);

        const blob = await pdf(
            <AnalisePDF detalhe={detalhe} tipo={tipo} />,
        ).toBlob();

        return toBase64(blob);
    }, [tipo, item.id]);

    async function baixarPdf() {
        setErro(null);
        setGerando(true);
        try {
            const base64 = await gerarPdfBase64();

            const link = document.createElement("a");
            link.href = base64;
            link.download = `analise-${tipo}-${item.id}.pdf`;
            link.click();
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Falha ao gerar o PDF.");
        } finally {
            setGerando(false);
        }
    }

    return (
        <>
            <div className="flex items-center gap-1">
                <button
                    aria-label={`Enviar análise ${item.id} por e-mail`}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-accent"
                    onClick={() => modal.open()}
                    title="Enviar por e-mail"
                    type="button"
                >
                    <Mail size={16} />
                </button>

                <button
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent disabled:opacity-50"
                    disabled={gerando}
                    onClick={baixarPdf}
                    title="Gerar PDF"
                    type="button"
                >
                    <FileDown size={14} />
                    {gerando ? "Gerando…" : "PDF"}
                </button>
            </div>

            {erro && (
                <p className="w-full pt-1 text-right text-[11px] text-destructive">
                    {erro}
                </p>
            )}

            <EnviarAnaliseModal
                item={item}
                pdfBase64={gerarPdfBase64}
                state={modal}
                tipo={tipo}
            />
        </>
    );
}