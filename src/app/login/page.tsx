import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { GoogleLoginButton } from "./google-login-button";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session?.user?.email && !session.user.blocked) {
    redirect("/");
  }

  const params = await searchParams;
  const hasAccessError = getFirstParam(params?.error) === "AccessDenied";
  const callbackUrl = getFirstParam(params?.callbackUrl) ?? "/";

  return (
    <main className="kaju-auth-bg flex min-h-screen items-center justify-center px-6 py-12 text-foreground">
      <section className="w-full max-w-sm rounded-2xl border border-border/70 bg-surface p-8 shadow-2xl shadow-slate-900/[0.08]">
        <div className="mb-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-sm font-black text-white shadow-md shadow-accent/25">
              K
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Kaju</p>
              <p className="text-[11px] text-muted">Painel operacional</p>
            </div>
          </div>
          <h1 className="text-[1.6rem] font-semibold tracking-tight">Acesse sua conta</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Use uma conta Google autorizada para entrar no ambiente de gestão.
          </p>
        </div>

        {hasAccessError ? (
          <p className="mb-5 rounded-lg border border-danger/25 bg-danger/8 px-4 py-3 text-sm text-danger">
            Esta conta está bloqueada ou não tem acesso ao sistema.
          </p>
        ) : null}

        <GoogleLoginButton callbackUrl={callbackUrl} />

        <p className="mt-6 text-center text-[11px] text-muted/60">
          Acesso restrito a usuários autorizados
        </p>
      </section>
    </main>
  );
}
