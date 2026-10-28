"use client";

import { Button, Label, Modal, type useOverlayState } from "@heroui/react";
import { useState } from "react";
import type { CardAnaliseDados } from "@/lib/analises/tipos";
import { enviarAnaliseUnica } from "@/app/services/producao/analises/enviarAnaliseUnica";

type Formato = "corpo" | "corpo_pdf";

const FORMATOS: { valor: Formato; rotulo: string }[] = [
    { valor: "corpo", rotulo: "Somente no corpo" },
    { valor: "corpo_pdf", rotulo: "Corpo + PDF" },
];

export function EnviarAnaliseModal({
    tipo,
    item,
    state,
    pdfBase64,
}: {
    tipo: string;
    item: CardAnaliseDados;
    state: ReturnType<typeof useOverlayState>;
    pdfBase64: () => Promise<string>;
}) {
    const [emails, setEmails] = useState("");
    const [obs, setObs] = useState("");
    const [assunto, setAssunto] = useState("");
    const [formato, setFormato] = useState<Formato>("corpo");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [ok, setOk] = useState(false);

    async function enviar() {
        setErro(null);
        setEnviando(true);
        try {
            const anexo = formato === "corpo_pdf" ? await pdfBase64() : undefined;

            const r = await enviarAnaliseUnica({
                tipo,
                id: item.id,
                destinatarios: emails.split(/[,;\n]/),
                observacao: obs.trim() || undefined,
                assunto: assunto.trim() || undefined,
                pdfBase64: anexo,
            });

            if (!r.ok) return setErro(r.erro);

            setOk(true);
            setTimeout(() => state.close(), 1500);
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Falha no envio.");
        } finally {
            setEnviando(false);
        }
    }

    const campo =
        "w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

    return (
        <Modal state={state}>
            <Modal.Backdrop variant="blur">
                <Modal.Container size="md">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>Enviar análise #{item.id}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="space-y-4">
                            <p className="text-sm text-muted">{item.titulo}</p>

                            <div>
                                <Label className="mb-1.5 block text-sm font-medium">
                                    Destinatários
                                </Label>
                                <textarea
                                    className={campo}
                                    onChange={(e) => setEmails(e.target.value)}
                                    placeholder="email1@cione.com.br, email2@cione.com.br"
                                    rows={3}
                                    value={emails}
                                />
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-sm font-medium">
                                    Assunto{" "}
                                    <span className="font-normal text-muted">(opcional)</span>
                                </Label>
                                <input
                                    className={campo}
                                    onChange={(e) => setAssunto(e.target.value)}
                                    placeholder={`Análise ${tipo} #${item.id}`}
                                    type="text"
                                    value={assunto}
                                />
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-sm font-medium">
                                    Mensagem{" "}
                                    <span className="font-normal text-muted">(opcional)</span>
                                </Label>
                                <textarea
                                    className={campo}
                                    onChange={(e) => setObs(e.target.value)}
                                    rows={3}
                                    value={obs}
                                />
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-sm font-medium">
                                    Formato
                                </Label>
                                <div className="flex gap-1 rounded-lg border border-border bg-surface-secondary p-1">
                                    {FORMATOS.map((f) => (
                                        <button
                                            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${formato === f.valor
                                                ? "bg-accent text-white"
                                                : "text-muted hover:text-foreground"
                                                }`}
                                            key={f.valor}
                                            onClick={() => setFormato(f.valor)}
                                            type="button"
                                        >
                                            {f.rotulo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {erro && (
                                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {erro}
                                </p>
                            )}
                            {ok && (
                                <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                                    E-mail enviado com sucesso!
                                </p>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onPress={() => state.close()} variant="secondary">
                                Cancelar
                            </Button>
                            <Button
                                isDisabled={enviando || ok}
                                onPress={enviar}
                                variant="primary"
                            >
                                {enviando ? "Enviando…" : "Enviar"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}