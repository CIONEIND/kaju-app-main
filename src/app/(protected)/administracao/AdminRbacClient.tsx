"use client";

import {
  Button,
  Label,
  ListBox,
  Modal,
  Select,
  toast,
  useOverlayState,
} from "@heroui/react";
import { Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { useState } from "react";
import {
  assignUserRole,
  createRole,
  deleteRole,
  updateRole,
} from "@/app/services/admin/rbacService";
import type { RoleSummary, UserSummary } from "@/app/services/admin/rbacTypes";
import { PageHeader, PageShell } from "@/components/ui/page";
import { PERMISSION_CATALOG, PERMISSIONS } from "@/lib/rbac/permissions";

type Tab = "usuarios" | "papeis";

interface AdminRbacClientProps {
  currentUserId: string;
  initialRoles: RoleSummary[];
  initialUsers: UserSummary[];
}

const NO_ROLE_KEY = "none";

export function AdminRbacClient({
  currentUserId,
  initialRoles,
  initialUsers,
}: AdminRbacClientProps) {
  const [tab, setTab] = useState<Tab>("usuarios");
  const [roles, setRoles] = useState<RoleSummary[]>(initialRoles);
  const [users, setUsers] = useState<UserSummary[]>(initialUsers);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Administração"
        title="Papéis e permissões"
        description="Controle quem acessa o quê: atribua papéis aos usuários e defina as permissões de cada papel."
      />

      {/* Alternância de abas */}
      <div className="inline-flex w-fit rounded-lg border border-border bg-surface-secondary p-1">
        <TabButton
          icon={<Users size={16} />}
          isActive={tab === "usuarios"}
          label="Usuários"
          onSelect={() => setTab("usuarios")}
        />
        <TabButton
          icon={<ShieldCheck size={16} />}
          isActive={tab === "papeis"}
          label="Papéis e permissões"
          onSelect={() => setTab("papeis")}
        />
      </div>

      {tab === "usuarios" ? (
        <UsersPanel
          currentUserId={currentUserId}
          onUserUpdated={(updated) =>
            setUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u)),
            )
          }
          roles={roles}
          users={users}
        />
      ) : (
        <RolesPanel
          onRoleCreated={(role) => setRoles((prev) => [...prev, role])}
          onRoleDeleted={(id) =>
            setRoles((prev) => prev.filter((r) => r.id !== id))
          }
          onRoleUpdated={(role) =>
            setRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)))
          }
          roles={roles}
        />
      )}
    </PageShell>
  );
}

function TabButton({
  icon,
  label,
  isActive,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        isActive
          ? "bg-accent text-white shadow-sm"
          : "text-muted hover:text-foreground"
      }`}
      onClick={onSelect}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Aba: Usuários ────────────────────────────────────────────────────────────

function UsersPanel({
  users,
  roles,
  currentUserId,
  onUserUpdated,
}: {
  users: UserSummary[];
  roles: RoleSummary[];
  currentUserId: string;
  onUserUpdated: (user: UserSummary) => void;
}) {
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  async function handleAssign(userId: string, key: string) {
    const roleId = key === NO_ROLE_KEY ? null : key;
    setSavingUserId(userId);
    try {
      const result = await assignUserRole(userId, roleId);
      if (!result.success) {
        toast(result.error);
        return;
      }
      onUserUpdated(result.user);
      toast("Papel do usuário atualizado.");
    } finally {
      setSavingUserId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="kaju-panel flex flex-col items-center justify-center gap-3 rounded-xl py-16 text-center">
        <Users className="size-10 text-muted opacity-40" />
        <p className="text-sm text-muted">Nenhum usuário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="kaju-panel divide-y divide-border overflow-hidden rounded-xl">
      {users.map((user) => (
        <div
          className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
          key={user.id}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <span className="truncate">{user.name ?? "Sem nome"}</span>
              {user.id === currentUserId && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  você
                </span>
              )}
              {user.blocked && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                  bloqueado
                </span>
              )}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>

          <div className="shrink-0">
            <Select
              aria-label={`Papel de ${user.name ?? user.email ?? "usuário"}`}
              isDisabled={savingUserId === user.id}
              onSelectionChange={(key) => {
                if (key != null) void handleAssign(user.id, key.toString());
              }}
              selectedKey={user.role?.id ?? NO_ROLE_KEY}
              variant="secondary"
            >
              <Label className="sr-only">Papel</Label>
              <Select.Trigger className="min-w-52">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {/* Sem papel NÃO é acesso legado: `getCurrentUserAccess`
                      cai em NEW_USER_PERMISSIONS (só leitura). */}
                  <ListBox.Item
                    id={NO_ROLE_KEY}
                    key={NO_ROLE_KEY}
                    textValue="Sem papel"
                  >
                    Sem papel (somente leitura)
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {roles.map((role) => (
                    <ListBox.Item
                      id={role.id}
                      key={role.id}
                      textValue={role.name}
                    >
                      {role.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Aba: Papéis e permissões ─────────────────────────────────────────────────

function RolesPanel({
  roles,
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
}: {
  roles: RoleSummary[];
  onRoleCreated: (role: RoleSummary) => void;
  onRoleUpdated: (role: RoleSummary) => void;
  onRoleDeleted: (id: string) => void;
}) {
  const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleSummary | null>(null);
  const deleteModalState = useOverlayState();

  const showForm = isCreating || editingRole !== null;

  function handleSaved(role: RoleSummary, isNew: boolean) {
    if (isNew) onRoleCreated(role);
    else onRoleUpdated(role);
    setEditingRole(null);
    setIsCreating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {!showForm && (
        <div className="flex justify-end">
          <Button onPress={() => setIsCreating(true)} variant="primary">
            <Plus size={16} />
            Nova função
          </Button>
        </div>
      )}

      {showForm && (
        <div className="kaju-panel rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            {editingRole ? `Editar "${editingRole.name}"` : "Nova função"}
          </h2>
          <RoleEditor
            onCancel={() => {
              setEditingRole(null);
              setIsCreating(false);
            }}
            onSaved={handleSaved}
            role={editingRole}
          />
        </div>
      )}

      {roles.length === 0 ? (
        <div className="kaju-panel flex flex-col items-center justify-center gap-3 rounded-xl py-16 text-center">
          <ShieldCheck className="size-10 text-muted opacity-40" />
          <p className="text-sm text-muted">Nenhum papel criado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <RoleCard
              isFormOpen={showForm}
              key={role.id}
              onDelete={() => {
                setDeletingRole(role);
                deleteModalState.open();
              }}
              onEdit={() => {
                setIsCreating(false);
                setEditingRole(role);
              }}
              role={role}
            />
          ))}
        </div>
      )}

      <DeleteRoleModal
        onDeleted={(id) => {
          onRoleDeleted(id);
          setDeletingRole(null);
        }}
        role={deletingRole}
        state={deleteModalState}
      />
    </div>
  );
}

function RoleCard({
  role,
  isFormOpen,
  onEdit,
  onDelete,
}: {
  role: RoleSummary;
  isFormOpen: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const permissionCount = role.isSystem
    ? "Todas as permissões"
    : `${role.permissions.length} permiss${role.permissions.length === 1 ? "ão" : "ões"}`;

  return (
    <div className="kaju-panel flex flex-col gap-3 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <span className="truncate">{role.name}</span>
            {role.isSystem && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-muted">
                <Lock size={11} />
                Sistema
              </span>
            )}
          </p>
          {role.description && (
            <p className="mt-0.5 text-sm text-muted">{role.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 font-medium">
          {role.userCount} usuário{role.userCount !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 font-medium">
          {permissionCount}
        </span>
      </div>

      <div className="mt-auto flex justify-end gap-2 pt-2">
        {role.isSystem ? (
          <span className="text-xs text-muted">
            Papel protegido — não pode ser editado ou excluído.
          </span>
        ) : (
          <>
            <Button
              isDisabled={isFormOpen}
              onPress={onEdit}
              size="sm"
              variant="secondary"
            >
              <Pencil size={14} />
              Editar
            </Button>
            <Button onPress={onDelete} size="sm" variant="danger">
              <Trash2 size={14} />
              Excluir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function RoleEditor({
  role,
  onSaved,
  onCancel,
}: {
  role: RoleSummary | null;
  onSaved: (role: RoleSummary, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(role?.permissions ?? []),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePermission(key: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Informe um nome para o papel.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const input = {
      name,
      description: description.trim() || undefined,
      permissions: [...permissions],
    };

    try {
      const result = role
        ? await updateRole(role.id, input)
        : await createRole(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onSaved(result.role, role === null);
      toast(role ? "Papel atualizado." : "Papel criado.");
    } finally {
      setIsSaving(false);
    }
  }

  const hasManage = permissions.has(PERMISSIONS.RBAC_MANAGE);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="role-name"
          >
            Nome do papel
          </label>
          <input
            className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            id="role-name"
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Analista, Vendedor…"
            type="text"
            value={name}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="role-description"
          >
            Descrição <span className="text-muted">(opcional)</span>
          </label>
          <input
            className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            id="role-description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para que serve este papel"
            type="text"
            value={description}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Permissões</p>
        <div className="flex flex-col gap-4">
          {PERMISSION_CATALOG.map((group) => (
            <fieldset
              className="rounded-lg border border-border p-4"
              key={group.category}
            >
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-accent/80">
                {group.category}
              </legend>
              <div className="flex flex-col gap-2.5">
                {group.permissions.map((permission) => (
                  <label
                    className="flex cursor-pointer items-start gap-3"
                    key={permission.key}
                  >
                    <input
                      checked={permissions.has(permission.key)}
                      className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
                      onChange={() => togglePermission(permission.key)}
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {permission.label}
                      </span>
                      <span className="block text-xs text-muted">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {hasManage && (
          <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            Atenção: este papel concede acesso total à administração (papéis,
            permissões e usuários).
          </p>
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
          {isSaving ? "Salvando…" : role ? "Salvar alterações" : "Criar papel"}
        </Button>
      </div>
    </div>
  );
}

function DeleteRoleModal({
  role,
  state,
  onDeleted,
}: {
  role: RoleSummary | null;
  state: ReturnType<typeof useOverlayState>;
  onDeleted: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!role) return;
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteRole(role.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDeleted(role.id);
      toast("Papel excluído.");
      state.close();
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
              <Modal.Heading>Excluir papel</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                Tem certeza que deseja excluir o papel{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{role?.name}&rdquo;
                </span>
                ?{" "}
                {role && role.userCount > 0
                  ? `${role.userCount} usuário${role.userCount !== 1 ? "s" : ""} ficará${role.userCount !== 1 ? "ão" : ""} sem papel (acesso legado).`
                  : "Nenhum usuário será afetado."}
              </p>
              {error && (
                <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                onPress={state.close}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                isDisabled={isDeleting}
                onPress={handleDelete}
                variant="danger"
              >
                {isDeleting ? "Excluindo…" : "Excluir"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
