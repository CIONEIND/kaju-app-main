"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { PageHeader, PageShell } from "@/components/ui/page";

interface LabelMember {
  recipient: { id: string; email: string; label: string | null };
}

interface EmailLabel {
  id: string;
  name: string;
  createdAt: string;
  members: LabelMember[];
}

// ─── Label editor panel ───────────────────────────────────────────────────────

function LabelEditor({
  label,
  onSaved,
  onCancel,
}: {
  label: EmailLabel | null;
  onSaved: (saved: EmailLabel) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(label?.name ?? "");
  const [emails, setEmails] = useState<string[]>(
    label?.members.map((m) => m.recipient.email) ?? [],
  );
  const [inputValue, setInputValue] = useState("");
  const [knownRecipients, setKnownRecipients] = useState<
    { id: string; email: string }[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/email-recipients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setKnownRecipients(data);
      })
      .catch(() => {});
  }, []);

  function addEmail(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    if (!emails.includes(trimmed)) setEmails((prev) => [...prev, trimmed]);
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Informe um nome para a etiqueta.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const url = label ? `/api/email-labels/${label.id}` : "/api/email-labels";
      const res = await fetch(url, {
        method: label ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar.");
      onSaved(data as EmailLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  const suggestions = knownRecipients.filter((r) => !emails.includes(r.email));

  return (
    <div className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="label-name">
          Nome da etiqueta
        </label>
        <input
          id="label-name"
          autoFocus
          className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Diretoria, Compradores SP…"
          type="text"
          value={name}
        />
      </div>

      {/* Emails */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">E-mails</label>
        <div
          className="flex min-h-[44px] flex-wrap gap-1.5 cursor-text rounded-md border border-border bg-surface-secondary px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30"
          onClick={() => inputRef.current?.focus()}
        >
          {emails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white"
            >
              {email}
              <button
                aria-label={`Remover ${email}`}
                className="ml-0.5 opacity-70 hover:opacity-100"
                onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
                type="button"
              >
                <svg aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            onBlur={() => { if (inputValue.trim()) addEmail(inputValue); }}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={emails.length === 0 ? "Digite o e-mail e pressione Enter" : "Adicionar outro…"}
            type="email"
            value={inputValue}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          Pressione{" "}
          <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Enter</kbd>{" "}
          ou{" "}
          <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">,</kbd>{" "}
          para adicionar cada e-mail.
        </p>

        {suggestions.length > 0 && (
          <div className="mt-2">
            <span className="text-xs text-muted">Contatos conhecidos: </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {suggestions.slice(0, 20).map((r) => (
                <button
                  key={r.id}
                  className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => addEmail(r.email)}
                  type="button"
                >
                  {r.email}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button isDisabled={isSaving} onPress={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button isDisabled={isSaving} onPress={handleSave} variant="primary">
          {isSaving && (
            <svg aria-hidden="true" className="mr-1.5 size-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          )}
          {isSaving ? "Salvando…" : label ? "Salvar alterações" : "Criar etiqueta"}
        </Button>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  label,
  state,
  onDeleted,
}: {
  label: EmailLabel | null;
  state: ReturnType<typeof useOverlayState>;
  onDeleted: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.isOpen) setError(null);
  }, [state.isOpen]);

  async function handleDelete() {
    if (!label) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/email-labels/${label.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Erro ao remover.");
      }
      onDeleted(label.id);
      state.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Remover etiqueta</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                Tem certeza que deseja remover a etiqueta{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{label?.name}&rdquo;
                </span>
                ? Os contatos não serão removidos.
              </p>
              {error && (
                <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button isDisabled={isDeleting} onPress={state.close} variant="secondary">
                Cancelar
              </Button>
              <Button isDisabled={isDeleting} onPress={handleDelete} variant="danger">
                {isDeleting ? "Removendo…" : "Remover"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmailLabelsPage() {
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState<EmailLabel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingLabel, setDeletingLabel] = useState<EmailLabel | null>(null);
  const deleteModalState = useOverlayState();

  useEffect(() => {
    fetch("/api/email-labels")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLabels(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  function handleSaved(saved: EmailLabel) {
    setLabels((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
    });
    setEditingLabel(null);
    setIsCreating(false);
  }

  function handleDeleted(id: string) {
    setLabels((prev) => prev.filter((l) => l.id !== id));
    setDeletingLabel(null);
  }

  const showForm = isCreating || editingLabel !== null;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Configurações"
        title="Etiquetas de e-mail"
        description="Agrupe destinatários em etiquetas para envio rápido de pedidos por e-mail."
        actions={
          !showForm ? (
            <Button onPress={() => setIsCreating(true)} variant="primary">
              + Nova etiqueta
            </Button>
          ) : undefined
        }
      />

      {/* Form panel */}
      {showForm && (
        <div className="kaju-panel rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            {editingLabel ? `Editar "${editingLabel.name}"` : "Nova etiqueta"}
          </h2>
          <LabelEditor
            label={editingLabel}
            onSaved={handleSaved}
            onCancel={() => {
              setEditingLabel(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}

      {/* Label list */}
      {isLoading ? (
        <div className="kaju-panel rounded-xl divide-y divide-border">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="space-y-2">
                <div className="kaju-skeleton h-4 w-32 rounded" />
                <div className="kaju-skeleton h-3 w-48 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="kaju-skeleton h-8 w-16 rounded-md" />
                <div className="kaju-skeleton h-8 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : labels.length === 0 ? (
        <div className="kaju-panel flex flex-col items-center justify-center gap-3 rounded-xl py-16 text-center">
          <svg aria-hidden="true" className="size-10 text-muted opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6h.008v.008H6V6z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-muted">Nenhuma etiqueta criada ainda.</p>
          {!showForm && (
            <Button onPress={() => setIsCreating(true)} size="sm" variant="secondary">
              Criar primeira etiqueta
            </Button>
          )}
        </div>
      ) : (
        <div className="kaju-panel rounded-xl divide-y divide-border overflow-hidden">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{label.name}</p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {label.members.length === 0
                    ? "Sem contatos"
                    : label.members
                        .slice(0, 4)
                        .map((m) => m.recipient.email)
                        .join(", ") +
                      (label.members.length > 4
                        ? ` +${label.members.length - 4}`
                        : "")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-muted">
                  {label.members.length} contato{label.members.length !== 1 ? "s" : ""}
                </span>
                <Button
                  isDisabled={showForm && editingLabel?.id !== label.id}
                  onPress={() => {
                    setIsCreating(false);
                    setEditingLabel(label);
                  }}
                  size="sm"
                  variant="secondary"
                >
                  Editar
                </Button>
                <Button
                  onPress={() => {
                    setDeletingLabel(label);
                    deleteModalState.open();
                  }}
                  size="sm"
                  variant="danger"
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        label={deletingLabel}
        state={deleteModalState}
        onDeleted={handleDeleted}
      />
    </PageShell>
  );
}
