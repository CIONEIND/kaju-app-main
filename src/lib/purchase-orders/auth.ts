import { getCurrentSession } from "@/lib/session";

export interface PurchaseOrderUser {
  id: string;
}

export async function requirePurchaseOrderUser(): Promise<PurchaseOrderUser> {
  const session = await getCurrentSession();

  if (!session?.user?.id || session.user.blocked) {
    throw new Error("Não autorizado.");
  }

  return { id: session.user.id };
}
