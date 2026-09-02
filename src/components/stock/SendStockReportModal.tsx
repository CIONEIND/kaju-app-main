"use client";

import { Button, Label, Modal, type useOverlayState } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { StockPositionPDFData } from "@/components/stock/StockPositionPDF";

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

interface SendStockReportModalProps {
  data: StockPositionPDFData | null;
  state: ReturnType<typeof useOverlayState>;
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

export function SendStockReportModal({
  data,
  state,
}: SendStockReportModalProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [suggestions, setSuggestions] = useState<Recipient[]>([]);
  const [labels, setLabels] = useState<EmailLabelSuggestion[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.isOpen) {
      setRecipients([]);
      setInputValue("");
      setSubject(
        `Posição de estoque — ${new Date().toLocaleDateString("pt-BR")}`,
      );
      setBody("");
      setError(null);
      setSuccess(false);

      Promise.all([
        fetch("/api/email-recipients").then((r) => r.json()),
        fetch("/api/email-labels").then((r) => r.json()),
      ])
        .then(([recipientsData, labelsData]) => {
          if (Array.isArray(recipientsData)) setSuggestions(recipientsData);
          if (Array.isArray(labelsData)) setLabels(labelsData);
        })
        .catch(() => {});
    }
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

  async function handleSend() {
    if (!data) return;
    if (recipients.length === 0) {
      setError("Adicione ao menos um destinatário.");
      return;
    }
    if (!subject.trim()) {
      setError("O assunto é obrigatório.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Generate the stock report PDF (same template as "Exportar PDF")
      const { pdf } = await import("@react-pdf/renderer");
      const { StockPositionDocument } = await import(
        "@/components/stock/StockPositionPDF"
      );

      const blob = await pdf(
        <StockPositionDocument
          data={{ ...data, generatedAt: new Date().toISOString() }}
        />,
      ).toBlob();

      // Convert to base64
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Send email
      const sendRes = await fetch("/api/stock-position/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject, body, pdfBase64 }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.message ?? "Erro ao enviar.");

      setSuccess(true);
      setTimeout(() => state.close(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar e-mail.");
    } finally {
      setIsSending(false);
    }
  }

  const availableSuggestions = suggestions.filter(
    (item) => !recipients.includes(item.email),
  );

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                Enviar posição de estoque por e-mail
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {/* Recipients */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Destinatários
                </Label>
                <div
                  className="flex min-h-[42px] flex-wrap gap-1.5 rounded-md border border-border bg-surface-secondary px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30"
                  onClick={() => inputRef.current?.focus()}
                >
                  {recipients.map((email) => (
                    <RecipientChip
                      key={email}
                      email={email}
                      onRemove={() =>
                        setRecipients((prev) => prev.filter((r) => r !== email))
                      }
                    />
                  ))}
                  <input
                    ref={inputRef}
                    className="min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
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

                {/* Labels */}
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
                            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              allAdded
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
                                <span className="cursor-pointer opacity-60">
                                  ({lbl.members.length})
                                </span>
                                <button
                                  aria-label={`Remover etiqueta ${lbl.name}`}
                                  className="cursor-pointer ml-0.5 opacity-60 hover:opacity-100"
                                  onClick={() => {
                                    setRecipients((prev) =>
                                      prev.filter(
                                        (e) => !labelEmails.includes(e),
                                      ),
                                    );
                                  }}
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
                                onClick={() => {
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
                                  });
                                }}
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

                {/* Suggestions */}
                {availableSuggestions.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted">Recentes: </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {availableSuggestions.slice(0, 12).map((item) => (
                        <button
                          key={item.id}
                          className="cursor-pointer rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
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

              {/* Subject */}
              <div>
                <Label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="stock-email-subject"
                >
                  Assunto
                </Label>
                <input
                  id="stock-email-subject"
                  className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  onChange={(e) => setSubject(e.target.value)}
                  type="text"
                  value={subject}
                />
              </div>

              {/* Body */}
              <div>
                <Label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="stock-email-body"
                >
                  Mensagem{" "}
                  <span className="font-normal text-muted">(opcional)</span>
                </Label>
                <textarea
                  id="stock-email-body"
                  className="w-full resize-none rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escreva uma mensagem para acompanhar o relatório..."
                  rows={4}
                  value={body}
                />
              </div>

              {/* Attachment notice */}
              <div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2.5 text-xs text-primary">
                <svg
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 9l-7 7-7-7m14-4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                O relatório de posição de estoque será anexado ao e-mail em PDF.
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                  E-mail enviado com sucesso!
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onPress={() => state.close()}
                variant="secondary"
                isDisabled={isSending}
              >
                Cancelar
              </Button>
              <Button
                isDisabled={isSending || success}
                onPress={handleSend}
                variant="primary"
              >
                {isSending && (
                  <svg
                    aria-hidden="true"
                    className="mr-1.5 size-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                )}
                {isSending ? "Enviando…" : "Enviar e-mail"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
