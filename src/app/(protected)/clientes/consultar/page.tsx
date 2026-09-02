"use client";

import {
  Button,
  buttonVariants,
  Dropdown,
  Label,
  ListBox,
  Modal,
  Pagination,
  SearchField,
  Select,
  Table,
  Toast,
  toast,
  useOverlayState,
} from "@heroui/react";
import { LoaderCircle, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TableSkeleton } from "@/components/ui/loading";
import { FilterBar, PageHeader, PageShell } from "@/components/ui/page";
import { useHasPermission } from "@/lib/rbac/permission-context";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { ClienteConsultaItem } from "@/lib/top-manager/repository/cliente/type";

type ClientesResponse = {
  items: ClienteConsultaItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

function formatCpfCnpj(value: string) {
  if (!value || value.trim().length === 0) return value;
  const digits = value?.replace(/\D/g, "");

  if (digits.length <= 11) {
    const padded = digits.padStart(11, "0");

    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`;
  }

  const padded = digits.padStart(14, "0");

  return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}/${padded.slice(8, 12)}-${padded.slice(12, 14)}`;
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

export default function ConsultarClientesPage() {
  const canSaveClients = useHasPermission(PERMISSIONS.CLIENTS_SAVE);
  const router = useRouter();
  const deactivateState = useOverlayState();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [clients, setClients] = useState<ClienteConsultaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [clientToDeactivate, setClientToDeactivate] =
    useState<ClienteConsultaItem | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadClients() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams();
        const trimmedSearch = debouncedSearchQuery.trim();

        if (trimmedSearch) {
          params.set("search", trimmedSearch);
        }

        params.set("page", String(page));
        params.set("pageSize", String(rowsPerPage));
        params.set("_reload", String(reloadToken));

        const response = await fetch(`/api/clients?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as Partial<ClientesResponse> & {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ??
              payload.message ??
              "Não foi possível consultar os clientes.",
          );
        }

        if (isActive) {
          const nextPage = payload.page ?? 1;

          setClients(payload.items ?? []);
          setTotalItems(payload.totalItems ?? 0);
          setTotalPages(payload.totalPages ?? 0);

          if (nextPage !== page) {
            setPage(nextPage);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted && isActive) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar clientes.",
          );
          setClients([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [page, rowsPerPage, debouncedSearchQuery, reloadToken]);

  const startItem = useMemo(() => {
    if (totalItems === 0) {
      return 0;
    }

    return (page - 1) * rowsPerPage + 1;
  }, [page, rowsPerPage, totalItems]);

  const endItem = useMemo(() => {
    return Math.min(page * rowsPerPage, totalItems);
  }, [page, rowsPerPage, totalItems]);

  const normalizedPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const openClientEdit = (client: ClienteConsultaItem) => {
    router.push(`/clientes/editar/${client.codCliente}`);
  };

  const openDeactivateClientModal = (client: ClienteConsultaItem) => {
    setClientToDeactivate(client);
    deactivateState.open();
  };

  const closeDeactivateClientModal = () => {
    deactivateState.close();
    setClientToDeactivate(null);
  };

  const handleDeactivateClient = async () => {
    if (!clientToDeactivate) {
      return;
    }

    setIsDeactivating(true);

    try {
      const response = await fetch(
        `/api/clients/${clientToDeactivate.codCliente}`,
        {
          method: "PATCH",
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            payload.message ??
            "Não foi possível desativar o cliente.",
        );
      }

      toast("Cliente desativado com sucesso.");
      closeDeactivateClientModal();
      setReloadToken((current) => current + 1);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Erro ao desativar cliente.",
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <Toast.Provider placement="top end" />

      <PageShell>
        <PageHeader
          description="Pesquise, altere e acompanhe o cadastro de clientes."
          eyebrow="Relacionamento"
          title="Consultar clientes"
          actions={
            canSaveClients ? (
              <Link
                className={buttonVariants({ variant: "primary" })}
                href="/clientes/novo"
              >
                + Novo cliente
              </Link>
            ) : undefined
          }
        />

        <FilterBar className="flex flex-wrap items-end gap-4">
          <SearchField
            className="w-full flex-1 sm:min-w-[280px]"
            name="search"
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            variant="secondary"
          >
            <Label className="mb-1 block text-sm font-medium">
              Buscar cliente
            </Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Buscar por nome, CPF ou CNPJ..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </FilterBar>

        {isLoading ? (
          <TableSkeleton columns={4} rows={7} />
        ) : (
          <>
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Tabela de consulta de clientes"
                  className="min-w-[920px]"
                >
                  <Table.Header>
                    <Table.Column id="codCliente" className="w-28">
                      CÓDIGO
                    </Table.Column>
                    <Table.Column id="nome" isRowHeader>
                      NOME
                    </Table.Column>
                    <Table.Column id="cpfCnpj" className="text-center">
                      CPF/CNPJ
                    </Table.Column>
                    <Table.Column id="actions" className="w-24 text-center">
                      AÇÕES
                    </Table.Column>
                  </Table.Header>

                  <Table.Body
                    items={clients}
                    renderEmptyState={() => (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
                        <svg
                          aria-hidden="true"
                          className="mb-4 size-10 opacity-20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        {loadError &&
                          "Erro ao carregar clientes. Consulte o administrador do sistema."}
                        {!loadError && "Nenhum cliente encontrado."}
                      </div>
                    )}
                  >
                    {(client) => (
                      <Table.Row
                        key={client.codCliente}
                        id={String(client.codCliente)}
                      >
                        <Table.Cell className="font-medium">
                          {client.codCliente}
                        </Table.Cell>
                        <Table.Cell>{client.nome}</Table.Cell>
                        <Table.Cell className="text-center font-medium">
                          {formatCpfCnpj(client.cpfCnpj)}
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          {canSaveClients ? (
                            <Dropdown>
                              <Button
                                aria-label={`Ações do cliente ${client.nome}`}
                                isIconOnly
                                size="sm"
                                variant="ghost"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                              <Dropdown.Popover>
                                <Dropdown.Menu
                                  aria-label={`Ações do cliente ${client.nome}`}
                                  onAction={(key) => {
                                    if (key === "edit") {
                                      openClientEdit(client);
                                    }

                                    if (key === "deactivate") {
                                      openDeactivateClientModal(client);
                                    }
                                  }}
                                >
                                  <Dropdown.Item
                                    id="edit"
                                    textValue="Alterar cliente"
                                  >
                                    <Label className="cursor-pointer">
                                      Alterar cliente
                                    </Label>
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    id="deactivate"
                                    textValue="Desativar cliente"
                                  >
                                    <div className="flex items-center gap-2 text-danger">
                                      <Label className="cursor-pointer">
                                        Desativar cliente
                                      </Label>
                                    </div>
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>

              {totalItems > 0 && (
                <Table.Footer className="flex w-full flex-wrap items-center justify-between gap-4 border-t border-border bg-surface-secondary/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Exibir:</span>
                    <Select
                      className="w-20"
                      value={rowsPerPage.toString()}
                      variant="secondary"
                      onChange={(value) => {
                        setRowsPerPage(Number(value));
                        setPage(1);
                      }}
                      aria-label="Itens por página"
                    >
                      <Select.Trigger className="h-8 min-h-8 py-0">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="5" textValue="5">
                            5
                          </ListBox.Item>
                          <ListBox.Item id="10" textValue="10">
                            10
                          </ListBox.Item>
                          <ListBox.Item id="20" textValue="20">
                            20
                          </ListBox.Item>
                          <ListBox.Item id="50" textValue="50">
                            50
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="flex w-full items-center gap-4 sm:w-auto sm:justify-end">
                    <p className="hidden text-sm text-muted md:block">
                      Mostrando <strong>{startItem}</strong>-
                      <strong>{endItem}</strong> de {totalItems}
                    </p>

                    <Pagination className="w-full sm:w-auto">
                      <Pagination.Summary className="hidden md:block">
                        Mostrando {startItem} a {endItem} de {totalItems}
                      </Pagination.Summary>
                      <Pagination.Content className="sm:ml-auto">
                        <Pagination.Item>
                          <Pagination.Previous
                            isDisabled={normalizedPage === 1}
                            onPress={() =>
                              setPage((current) => Math.max(1, current - 1))
                            }
                          >
                            <Pagination.PreviousIcon />
                            <span className="hidden sm:inline">Anterior</span>
                          </Pagination.Previous>
                        </Pagination.Item>

                        {(() => {
                          let ellipsisIndex = 0;

                          return getPageNumbers(normalizedPage, totalPages).map(
                            (item) =>
                              item === "ellipsis" ? (
                                <Pagination.Item
                                  key={`ellipsis-${normalizedPage}-${totalPages}-${ellipsisIndex++}`}
                                >
                                  <Pagination.Ellipsis />
                                </Pagination.Item>
                              ) : (
                                <Pagination.Item key={item}>
                                  <Pagination.Link
                                    isActive={item === normalizedPage}
                                    onPress={() => setPage(item)}
                                  >
                                    {item}
                                  </Pagination.Link>
                                </Pagination.Item>
                              ),
                          );
                        })()}

                        <Pagination.Item>
                          <Pagination.Next
                            isDisabled={normalizedPage === totalPages}
                            onPress={() =>
                              setPage((current) =>
                                Math.min(totalPages, current + 1),
                              )
                            }
                          >
                            <span className="hidden sm:inline">Próximo</span>
                            <Pagination.NextIcon />
                          </Pagination.Next>
                        </Pagination.Item>
                      </Pagination.Content>
                    </Pagination>
                  </div>
                </Table.Footer>
              )}
            </Table>

            <Modal state={deactivateState}>
              <Modal.Backdrop variant="blur">
                <Modal.Container size="md">
                  <Modal.Dialog>
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>Desativar cliente</Modal.Heading>
                      <p className="mt-1 text-sm text-muted">
                        Tem certeza que deseja desativar{" "}
                        <strong className="text-foreground">
                          {clientToDeactivate?.nome}
                        </strong>
                        ?
                      </p>
                    </Modal.Header>
                    <Modal.Body className="p-6"></Modal.Body>
                    <Modal.Footer>
                      <Button
                        isDisabled={isDeactivating}
                        variant="ghost"
                        onPress={closeDeactivateClientModal}
                      >
                        Cancelar
                      </Button>
                      <Button
                        isDisabled={isDeactivating}
                        variant="danger"
                        onPress={handleDeactivateClient}
                      >
                        {isDeactivating ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          "Confirmar desativação"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </>
        )}
      </PageShell>
    </>
  );
}
