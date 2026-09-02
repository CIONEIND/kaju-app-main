import { useQuery } from "@tanstack/react-query";
import { getAllClients } from "@/app/services/client/clientService";
import type { ClienteMercadoDTO } from "@/app/services/client/types";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

export function useClients() {
  return useQuery<ClienteMercadoDTO[]>({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: getAllClients,
    staleTime: 5 * 60 * 1000,
  });
}
