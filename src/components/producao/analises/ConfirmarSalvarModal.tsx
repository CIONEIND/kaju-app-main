"use client";

import { Button, Modal, type useOverlayState } from "@heroui/react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export interface LinhaResumo {
    label: string;
    valor: string;
}

export interface ConfirmarSalvarModalProps {
    state: ReturnType<typeof useOverlayState>;
    editando: boolean;
    resumo: LinhaResumo[];
    enviando: boolean;
    /** Salvou com sucesso — mostra o check e bloqueia o modal até fechar */
    sucesso?: boolean;
    /** Erro vindo da action — mantém o modal aberto com a mensagem */
    erro?: string | null;
    onConfirmar: () => void;
}

export function ConfirmarSalvarModal({
    state,
    editando,
    resumo,
    enviando,
    sucesso = false,
    erro = null,
    onConfirmar,
}: ConfirmarSalvarModalProps) {
    // trava durante o envio E durante a tela de sucesso
    const travado = enviando || sucesso;

    return (
        <Modal state={state}>
            <Modal.Backdrop isDismissable={!travado} variant="blur">
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        {!travado && <Modal.CloseTrigger />}

                        <Modal.Header>
                            <Modal.Heading>
                                {sucesso
                                    ? "Análise salva"
                                    : editando
                                        ? "Salvar alterações?"
                                        : "Salvar análise?"}
                            </Modal.Heading>
                        </Modal.Header>

                        <Modal.Body className="space-y-4">
                            {sucesso ? (
                                <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="mt-0.5 size-4 shrink-0"
                                    />
                                    <p className="leading-relaxed">
                                        Análise salva com sucesso. Redirecionando para a central…
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                                        <AlertTriangle
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0"
                                        />
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

                                    {erro ? (
                                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                            {erro}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted">
                                            Confira os dados acima. Se algo estiver errado, volte e
                                            ajuste antes de confirmar.
                                        </p>
                                    )}
                                </>
                            )}
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                isDisabled={travado}
                                onPress={() => state.close()}
                                variant="secondary"
                            >
                                {erro ? "Fechar" : "Voltar e revisar"}
                            </Button>

                            <Button
                                isDisabled={travado}
                                onPress={onConfirmar}
                                variant="primary"
                            >
                                {sucesso
                                    ? "Salvo"
                                    : enviando
                                        ? "Salvando…"
                                        : erro
                                            ? "Tentar novamente"
                                            : "Confirmar e salvar"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}