"use client";

import { Button, ScrollShadow, Tooltip } from "@heroui/react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { PERMISSIONS } from "@/lib/rbac/permissions";

type SubItem = {
  name: string;
  href: string;
  /** Se definido, o sub-item só aparece para quem tem esta permissão. */
  requiresPermission?: string;
};

type MenuItem = {
  name: string;
  icon: typeof LayoutDashboard;
  subItems: SubItem[];
  /**
   * Permissão do grupo inteiro — some com o item e todos os sub-itens.
   * Espelha o gate do `layout.tsx` da área, que vale para as rotas aninhadas.
   */
  requiresPermission?: string;
};

interface SidebarProps {
  permissions?: string[];
  isProduction?: boolean;
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    subItems: [{ name: "Visão geral", href: "/dashboard" }],
  },
  {
    name: "Pedidos",
    icon: ShoppingCart,
    requiresPermission: PERMISSIONS.ORDERS_VIEW,
    subItems: [{ name: "Todos os pedidos", href: "/pedidos" }],
  },
  {
    name: "Estoque",
    icon: Box,
    requiresPermission: PERMISSIONS.STOCK_VIEW,
    subItems: [
      { name: "Posição de estoque", href: "/estoque/posicao-estoque" },
    ],
  },
  {
    name: "Clientes",
    icon: Users,
    requiresPermission: PERMISSIONS.CLIENTS_VIEW,
    subItems: [
      { name: "Consultar clientes", href: "/clientes/consultar" },
      {
        name: "Cadastrar cliente",
        href: "/clientes/novo",
        requiresPermission: PERMISSIONS.CLIENTS_SAVE,
      },
    ],
  },
  {
    name: "Configurações",
    icon: Settings,
    subItems: [
      {
        name: "Etiquetas de e-mail",
        href: "/configuracoes/etiquetas-email",
        requiresPermission: PERMISSIONS.EMAIL_LABELS_MANAGE,
      },
    ],
  },
  {
    name: "Administração",
    icon: ShieldCheck,
    requiresPermission: PERMISSIONS.RBAC_MANAGE,
    subItems: [{ name: "Papéis e permissões", href: "/administracao" }],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  permissions = [],
  isProduction = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // React Compiler cuida da memoização — sem useMemo manual.
  const granted = new Set(permissions);
  const isGranted = (permission?: string) =>
    !permission || granted.has(permission);

  // Grupo sem permissão some inteiro; sem sub-item visível, também some — não
  // adianta mostrar um menu cujos destinos todos dão 404.
  const visibleItems = menuItems
    .filter((item) => isGranted(item.requiresPermission))
    .map((item) => ({
      ...item,
      subItems: item.subItems.filter((subItem) =>
        isGranted(subItem.requiresPermission),
      ),
    }))
    .filter((item) => item.subItems.length > 0);

  const expandedMenus = visibleItems.reduce<Record<string, boolean>>(
    (acc, item) => {
      acc[item.name] =
        openMenus[item.name] ??
        item.subItems.some((subItem) => isActivePath(pathname, subItem.href));
      return acc;
    },
    {},
  );

  const toggleSubMenu = (menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !expandedMenus[menuName],
    }));
    if (isCollapsed) setIsCollapsed(false);
  };

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#0f1621] text-white transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[76px]" : "w-[264px]"
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.07] px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-black tracking-tight text-white shadow-lg shadow-accent/30">
          K
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 tracking-tight">
              Kaju
            </p>
            <p className="truncate text-[11px] text-slate-500"> Operações</p>
            {!isProduction && (
              <p className="truncate text-[11px] font-medium text-amber-500">
                desenvolvimento
              </p>
            )}
          </div>
        )}
        <Button
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          className={`ml-auto text-slate-500 hover:bg-white/[0.07] hover:text-slate-300 ${
            isCollapsed ? "mx-auto" : ""
          }`}
          isIconOnly
          onPress={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
        >
          <Menu size={19} />
        </Button>
      </div>

      <ScrollShadow className="flex-1 overflow-x-hidden px-2 py-3">
        <nav className="flex flex-col gap-2">
          {visibleItems.map((item) => {
            const isOpen = expandedMenus[item.name];
            const hasActiveChild = item.subItems.some((subItem) =>
              isActivePath(pathname, subItem.href),
            );

            return (
              <div className="flex flex-col gap-1" key={item.name}>
                {isCollapsed ? (
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Button
                        aria-label={item.name}
                        className={`w-full text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 ${
                          hasActiveChild ? "bg-white/[0.09] text-white" : ""
                        }`}
                        isIconOnly
                        onPress={() => toggleSubMenu(item.name)}
                        variant="ghost"
                      >
                        <item.icon size={20} />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content placement="right">
                      {item.name}
                    </Tooltip.Content>
                  </Tooltip>
                ) : (
                  <Button
                    className={`h-10 w-full justify-between rounded-lg px-3 font-medium text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 ${
                      hasActiveChild ? "bg-white/[0.09] text-slate-200" : ""
                    }`}
                    onPress={() => toggleSubMenu(item.name)}
                    variant="ghost"
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon
                        className="shrink-0 text-slate-500"
                        size={17}
                      />
                      <span className="text-[13px]">{item.name}</span>
                    </span>
                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </Button>
                )}

                {!isCollapsed && isOpen && (
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-white/[0.07] pl-3">
                    {item.subItems.map((subItem) => {
                      const isActive = isActivePath(pathname, subItem.href);

                      return (
                        <Link
                          className={`rounded-md px-3 py-[7px] text-[13px] transition-colors ${
                            isActive
                              ? "bg-accent/[0.18] font-semibold text-white"
                              : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
                          }`}
                          href={subItem.href}
                          key={subItem.name}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollShadow>

      <div className="border-t border-white/[0.07] p-2">
        {isCollapsed ? (
          <Tooltip>
            <Tooltip.Trigger>
              <Button
                aria-label="Sair"
                className="w-full text-slate-500 hover:bg-white/[0.07] hover:text-red-400"
                isIconOnly
                onPress={() => signOut()}
                variant="ghost"
              >
                <LogOut size={17} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content
              className="border border-red-200 bg-red-50 text-red-700"
              placement="right"
            >
              Sair
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <Button
            className="h-10 w-full justify-start gap-2.5 rounded-lg text-slate-500 hover:bg-white/[0.07] hover:text-red-400"
            onPress={() => signOut()}
            variant="ghost"
          >
            <LogOut size={17} />
            <span className="text-[13px] font-medium">Sair da conta</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
