import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PermissionsProvider } from "@/lib/rbac/permission-context";
import { Providers } from "../providers";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve sessão, checagem de bloqueio e permissões numa passada só.
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/login?error=AccessDenied");
  }

  const permissions = [...access.permissions];

  return (
    <Providers>
      <PermissionsProvider permissions={permissions}>
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
          <Sidebar permissions={permissions} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full px-4 py-5 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </PermissionsProvider>
    </Providers>
  );
}
