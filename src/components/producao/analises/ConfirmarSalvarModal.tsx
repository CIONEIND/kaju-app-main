"use client";

import { Button, Modal, type useOverlayState } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export interface LinhaResumo {
    label: string;
    valor: string;
}

export interface ConfirmarSalvarModalProps {
    state: ReturnType<typeof useOverlayState>;
    editando: boolean;
    resumo: LinhaResumo[];
    enviando: boolean;
    onConfirmar: () => void;
}

export function ConfirmarSalvarModal({
    state,
    editando,
    resumo,
    enviando,
    onConfirmar,
}: ConfirmarSalvarModalProps) {
    return (
        <Modal state={state}>
            <Modal.Backdrop
                isDismissable={!enviando}
                variant="blur"
            >
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        {!enviando && <Modal.CloseTrigger />}

                        <Modal.Header>
                            <Modal.Heading>
                                {editando ? "Salvar alterações?" : "Salvar análise?"}
                            </Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="space-y-4">
                            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                <p className="leading-relaxed">
                                    {editando
                                        ? "A análise passa a contar como concluída e fica visível para a equipe."
                                        : "Ao confirmar, a análise deixa de ser rascunho, passa a contar nos totais e fica visível para a equipe."}
                                </p>
                            </div>

                            <dl className="space-y-1.5 rounded-lg bg-surface-secondary p-3">
                                {resumo.map((r) => (
                                    <div
                                        className="flex items-start justify-between gap-3 text-sm"
                                        key={r.label}
                                    >
                                        <dt className="shrink-0 text-muted">{r.label}</dt>
                                        <dd className="truncate text-right font-medium text-foreground">
                                            {r.valor}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <p className="text-xs text-muted">
                                Confira os dados acima. Se algo estiver errado, volte e ajuste
                                antes de confirmar.
                            </p>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                isDisabled={enviando}
                                onPress={() => state.close()}
                                variant="secondary"
                            >
                                Voltar e revisar
                            </Button>

                            <Button
                                isDisabled={enviando}
                                onPress={onConfirmar}
                                variant="primary"
                            >
                                {enviando ? (
                                    <>
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
                                        Salvando…
                                    </>
                                ) : (
                                    "Confirmar e salvar"
                                )}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}