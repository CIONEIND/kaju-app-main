"use client";

import { Button, Label, Modal, type useOverlayState } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { enviarAnaliseUnica } from "@/app/services/producao/analises/enviarAnaliseUnica";
import type { CardAnaliseDados } from "@/lib/analises/tipos";

type Formato = "corpo" | "corpo_pdf";

const FORMATOS: { valor: Formato; rotulo: string }[] = [
    { valor: "corpo", rotulo: "Somente no corpo" },
    { valor: "corpo_pdf", rotulo: "Corpo + PDF" },
];

interface Recipient {
    id: string;
    email: string;
    label?: string | null;
}

interface EmailLabelSuggestion {
    id: string;
    name: string;
    members: { recipient: { email: string } }[];
}

function RecipientChip({
    email,
    onRemove,
}: {
    email: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
            {email}
            <button
                aria-label={`Remover ${email}`}
                className="ml-0.5 rounded-full opacity-70 hover:opacity-100"
                onClick={onRemove}
                type="button"
            >
                <svg
                    aria-hidden="true"
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                >
                    <path
                        d="M6 18L18 6M6 6l12 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </span>
    );
}

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
    const [recipients, setRecipients] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<Recipient[]>([]);
    const [labels, setLabels] = useState<EmailLabelSuggestion[]>([]);

    const [assunto, setAssunto] = useState("");
    const [obs, setObs] = useState("");
    const [formato, setFormato] = useState<Formato>("corpo");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [ok, setOk] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!state.isOpen) return;

        setRecipients([]);
        setInputValue("");
        setAssunto("");
        setObs("");
        setFormato("corpo");
        setErro(null);
        setOk(false);

        Promise.all([
            fetch("/api/email-recipients").then((r) => r.json()),
            fetch("/api/email-labels").then((r) => r.json()),
        ])
            .then(([recipientsData, labelsData]) => {
                if (Array.isArray(recipientsData)) setSuggestions(recipientsData);
                if (Array.isArray(labelsData)) setLabels(labelsData);
            })
            .catch(() => { });
    }, [state.isOpen]);

    function addRecipient(email: string) {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@")) return;
        if (!recipients.includes(trimmed)) {
            setRecipients((prev) => [...prev, trimmed]);
        }
        setInputValue("");
    }

    function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addRecipient(inputValue);
        } else if (
            e.key === "Backspace" &&
            inputValue === "" &&
            recipients.length > 0
        ) {
            setRecipients((prev) => prev.slice(0, -1));
        }
    }

    function handleInputBlur() {
        if (inputValue.trim()) addRecipient(inputValue);
    }

    async function enviar() {
        if (recipients.length === 0) {
            setErro("Adicione ao menos um destinatário.");
            return;
        }

        setErro(null);
        setOk(false);
        setEnviando(true);

        try {
            const anexo = formato === "corpo_pdf" ? await pdfBase64() : undefined;

            const r = await enviarAnaliseUnica({
                tipo,
                id: item.id,
                destinatarios: recipients,
                observacao: obs.trim() || undefined,
                assunto: assunto.trim() || undefined,
                pdfBase64: anexo,
            });

            if (!r.ok) {
                setErro(r.erro);
                return;
            }

            setOk(true);
            setTimeout(() => state.close(), 1500);
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Falha no envio.");
        } finally {
            setEnviando(false);
        }
    }

    const availableSuggestions = suggestions.filter(
        (item) => !recipients.includes(item.email),
    );

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
                            {/* Destinatários */}
                            <div>
                                <Label className="mb-1.5 block text-sm font-medium">
                                    Destinatários
                                </Label>
                                <div
                                    className="flex min-h-10.5 flex-wrap gap-1.5 rounded-md border border-border bg-surface-secondary px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30"
                                    onClick={() => inputRef.current?.focus()}
                                >
                                    {recipients.map((email) => (
                                        <RecipientChip
                                            key={email}
                                            email={email}
                                            onRemove={() =>
                                                setRecipients((prev) =>
                                                    prev.filter((r) => r !== email),
                                                )
                                            }
                                        />
                                    ))}
                                    <input
                                        ref={inputRef}
                                        className="min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                                        onBlur={handleInputBlur}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        placeholder={
                                            recipients.length === 0
                                                ? "Digite o e-mail e pressione Enter ou vírgula"
                                                : "Adicionar outro..."
                                        }
                                        type="email"
                                        value={inputValue}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-muted">
                                    Pressione{" "}
                                    <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">
                                        Enter
                                    </kbd>{" "}
                                    ou{" "}
                                    <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">
                                        ,
                                    </kbd>{" "}
                                    para adicionar cada e-mail.
                                </p>

                                {/* Etiquetas */}
                                {labels.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-xs text-muted">Etiquetas: </span>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {labels.map((lbl) => {
                                                const labelEmails = lbl.members.map(
                                                    (m) => m.recipient.email,
                                                );
                                                const allAdded =
                                                    labelEmails.length > 0 &&
                                                    labelEmails.every((e) => recipients.includes(e));

                                                return (
                                                    <span
                                                        key={lbl.id}
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${allAdded
                                                            ? "border-accent/40 bg-accent/10 text-accent"
                                                            : "border-border bg-surface-secondary text-foreground"
                                                            }`}
                                                        title={labelEmails.join(", ")}
                                                    >
                                                        <svg
                                                            aria-hidden="true"
                                                            className="size-3 shrink-0"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                            <path
                                                                d="M6 6h.008v.008H6V6z"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>

                                                        {allAdded ? (
                                                            <>
                                                                {lbl.name}
                                                                <span className="opacity-60">
                                                                    ({lbl.members.length})
                                                                </span>
                                                                <button
                                                                    aria-label={`Remover etiqueta ${lbl.name}`}
                                                                    className="ml-0.5 opacity-60 hover:opacity-100"
                                                                    onClick={() =>
                                                                        setRecipients((prev) =>
                                                                            prev.filter(
                                                                                (e) => !labelEmails.includes(e),
                                                                            ),
                                                                        )
                                                                    }
                                                                    type="button"
                                                                >
                                                                    <svg
                                                                        aria-hidden="true"
                                                                        className="size-3"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth={2.5}
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            d="M6 18L18 6M6 6l12 12"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="flex items-center gap-1.5 hover:text-accent"
                                                                onClick={() =>
                                                                    setRecipients((prev) => {
                                                                        const next = [...prev];
                                                                        labelEmails.forEach((email) => {
                                                                            const trimmed = email
                                                                                .trim()
                                                                                .toLowerCase();
                                                                            if (!next.includes(trimmed))
                                                                                next.push(trimmed);
                                                                        });
                                                                        return next;
                                                                    })
                                                                }
                                                                type="button"
                                                            >
                                                                {lbl.name}
                                                                <span className="opacity-60">
                                                                    ({lbl.members.length})
                                                                </span>
                                                            </button>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Recentes */}
                                {availableSuggestions.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-xs text-muted">Recentes: </span>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {availableSuggestions.slice(0, 12).map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                                                    onClick={() => addRecipient(item.email)}
                                                    type="button"
                                                >
                                                    {item.label
                                                        ? `${item.label} (${item.email})`
                                                        : item.email}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Assunto */}
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

                            {/* Mensagem */}
                            <div>
                                <Label className="mb-1.5 block text-sm font-medium">
                                    Mensagem{" "}
                                    <span className="font-normal text-muted">(opcional)</span>
                                </Label>
                                <textarea
                                    className={`${campo} resize-none`}
                                    onChange={(e) => setObs(e.target.value)}
                                    rows={3}
                                    value={obs}
                                />
                            </div>

                            {/* Formato */}
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