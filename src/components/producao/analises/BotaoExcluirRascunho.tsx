"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    excluirRascunho,
    type TipoFormularioExclusao,
} from "@/app/services/producao/analises/excluirRascunho";

export function BotaoExcluirRascunho({
    tipo,
    id,
    basePath,
    onExcluido,
}: {
    tipo: TipoFormularioExclusao;
    id: number;
    basePath: string;
    onExcluido?: () => void;
}) {
    const router = useRouter();
    const modal = useOverlayState();
    const [excluindo, setExcluindo] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    async function confirmar() {
        setExcluindo(true);
        setErro(null);
        try {
            const r = await excluirRascunho(tipo, id);
            if (!r.ok) {
                setErro(r.erro ?? "Erro ao excluir o rascunho.");
                return;
            }
            modal.close();
            onExcluido?.();
            router.push(basePath);
            router.refresh();
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <Modal.Root state={modal}>
            <Modal.Trigger>
                <Button isDisabled={excluindo} variant="secondary">
                    <Trash2 className="mr-1.5 size-3.5" />
                    Excluir rascunho
                </Button>
            </Modal.Trigger>

            <Modal.Container>
                <Modal.Dialog className="sm:max-w-md">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                        <Modal.Heading>Excluir rascunho</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-sm text-muted">
                            O rascunho será removido permanentemente. Esta ação não pode ser
                            desfeita.
                        </p>
                        {erro && (
                            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                                {erro}
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button isDisabled={excluindo} onPress={modal.close} variant="secondary">
                            Cancelar
                        </Button>
                        <Button isDisabled={excluindo} onPress={confirmar} variant="danger">
                            {excluindo ? (
                                <>
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    Excluindo…
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Root>
    );
}