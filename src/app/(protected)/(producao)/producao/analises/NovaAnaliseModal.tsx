"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { FORMULARIOS } from "@/lib/analises/formularios";

export function NovaAnaliseModal() {
  const state = useOverlayState();

  return (
    <>
      <Button onPress={state.open} variant="primary">
        <Plus size={16} />
        Nova análise
      </Button>

      <Modal state={state}>
        <Modal.Backdrop variant="blur">
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Selecionar formulário</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="mb-3 text-sm text-muted">
                  Escolha qual análise deseja registrar.
                </p>
                <ul className="flex flex-col gap-2">
                  {Object.entries(FORMULARIOS).map(([tipo, formulario]) => (
                    <li key={tipo}>
                      <Link
                        className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-secondary"
                        href={`/producao/analises/${tipo}/novo`}
                        onClick={state.close}
                      >
                        <FileText className="mt-0.5 size-4 shrink-0 text-accent" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">
                            {formulario.titulo}
                          </span>
                          <span className="block text-xs text-muted">
                            {formulario.descricao}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}