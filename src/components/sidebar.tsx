"use client";

import { Button, ScrollShadow, Tooltip } from "@heroui/react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { PERMISSIONS } from "@/lib/rbac/permissions";

type SubItem = {
  name: string;
  href: string;
  /** Se definido, o sub-item só aparece para quem tem esta permissão. */
  requiresPermission?: string;
};

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiresPermission?: string;
  subItems: SubItem[];
};

type SidebarProps = {
  permissions?: string[];
  isProduction?: boolean;
};

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
    name: "Produção",
    icon: FlaskConical,
    subItems: [
      {
        name: "Central de Análises",
        href: "/producao/analises",
        requiresPermission: PERMISSIONS.ANALISES_VIEW,
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const granted = new Set(permissions);
  const isGranted = (permission?: string) =>
    !permission || granted.has(permission);

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

  const sidebarContent = (collapsedState: boolean) => (
    <aside className="flex h-full w-full flex-col border-r border-white/6 bg-[#0f1621] text-white transition-all duration-300 ease-in-out">
      {/* Header — recebe shrink-0 para nunca ser comprimido */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-white/6 ${collapsedState ? "justify-center px-2" : "gap-3 px-4"
          }`}
      >
        {collapsedState ? (
          <Tooltip>
            <Tooltip.Trigger>
              <button
                aria-label="Expandir menu"
                className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-black tracking-tight text-white shadow-lg shadow-accent/30 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1621] focus-visible:outline-none"
                onClick={() => setIsCollapsed(false)}
                type="button"
              >
                K
                {!isProduction && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-[#0f1621]"
                  />
                )}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">Expandir menu</Tooltip.Content>
          </Tooltip>
        ) : (
          <>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-black tracking-tight text-white shadow-lg shadow-accent/30">
              K
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-5 tracking-tight">
                Kaju
              </p>
              <p className="truncate text-[11px] text-slate-500">Operações</p>
              {!isProduction && (
                <p className="truncate text-[11px] font-medium text-amber-500">
                  desenvolvimento
                </p>
              )}
            </div>

            <Button
              aria-label="Recolher menu"
              className="hidden shrink-0 text-slate-500 hover:bg-white/[0.07] hover:text-slate-300 lg:flex"
              isIconOnly
              onPress={() => setIsCollapsed(true)}
              variant="ghost"
            >
              <Menu size={19} />
            </Button>
          </>
        )}

        <Button
          aria-label="Fechar menu"
          className="ml-auto shrink-0 text-slate-500 hover:bg-white/[0.07] hover:text-slate-300 lg:hidden"
          isIconOnly
          onPress={() => setIsMobileOpen(false)}
          variant="ghost"
        >
          <X size={18} />
        </Button>
      </div>

      {/* A rolagem precisa de min-h-0 para não estourar o flex-col */}
      <ScrollShadow className="min-h-0 flex-1 overflow-x-hidden px-2 py-3">
        <nav className="flex flex-col gap-2">
          {visibleItems.map((item) => {
            const Icone = item.icon;
            const aberto = expandedMenus[item.name];
            const ativo = item.subItems.some((subItem) =>
              isActivePath(pathname, subItem.href),
            );

            if (collapsedState) {
              return (
                <Tooltip key={item.name}>
                  <Tooltip.Trigger>
                    <Button
                      aria-label={item.name}
                      className={`w-full ${ativo
                        ? "bg-accent/18 text-white"
                        : "text-slate-500 hover:bg-white/6 hover:text-slate-200"
                        }`}
                      isIconOnly
                      onPress={() => {
                        setIsCollapsed(false);
                        setOpenMenus((prev) => ({
                          ...prev,
                          [item.name]: true,
                        }));
                      }}
                      variant="ghost"
                    >
                      <Icone size={18} />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content placement="right">
                    {item.name}
                  </Tooltip.Content>
                </Tooltip>
              );
            }

            return (
              <div key={item.name}>
                <button
                  aria-expanded={aberto}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${ativo
                    ? "text-white"
                    : "text-slate-400 hover:bg-white/6 hover:text-slate-200"
                    }`}
                  onClick={() => toggleSubMenu(item.name)}
                  type="button"
                >
                  <Icone className="shrink-0" size={18} />
                  <span className="flex-1 truncate text-left">{item.name}</span>
                  {aberto ? (
                    <ChevronDown className="shrink-0" size={15} />
                  ) : (
                    <ChevronRight className="shrink-0" size={15} />
                  )}
                </button>

                {aberto && (
                  <div className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-white/[0.07] pl-2">
                    {item.subItems.map((subItem) => {
                      const isActive = isActivePath(pathname, subItem.href);

                      return (
                        <Link
                          className={`rounded-md px-3 py-1.75 text-[13px] transition-colors ${isActive
                            ? "bg-accent/18 font-semibold text-white"
                            : "text-slate-500 hover:bg-white/6 hover:text-slate-200"
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

      {/* Footer — shrink-0 + safe area para o rodapé do iPhone */}
      <div className="shrink-0 border-t border-white/[0.07] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {collapsedState ? (
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

  return (
    <>
      {/* Hambúrguer — só existe quando o drawer está fechado */}
      {!isMobileOpen && (
        <Button
          aria-label="Abrir menu"
          className="fixed top-3 left-3 z-50 border border-white/10 bg-[#0f1621] text-white shadow-lg lg:hidden"
          isIconOnly
          onPress={() => setIsMobileOpen(true)}
        >
          <Menu size={20} />
        </Button>
      )}

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Drawer — h-dvh desconta a barra do navegador no mobile */}
      <div
        className={`fixed top-0 left-0 z-40 h-dvh w-66 overscroll-contain transition-transform duration-300 ease-in-out lg:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {sidebarContent(false)}
      </div>

      <div
        className={`sticky top-0 hidden h-screen shrink-0 transition-all duration-300 ease-in-out lg:block ${isCollapsed ? "w-19" : "w-66"
          }`}
      >
        {sidebarContent(isCollapsed)}
      </div>
    </>
  );
}