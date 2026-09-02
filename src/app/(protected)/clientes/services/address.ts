import { ViaCepResponse } from '@/lib/via-cep/types';

export interface UF {
  id: number;
  nome: string;
}

export interface Municipio {
  id: number;
  nome: string;
  ufId: number;
}

// --- Fetcher Functions ---
export const fetchUfs = async (): Promise<UF[]> => {
  const res = await fetch("/api/address/ufs");
  if (!res.ok) throw new Error("Failed to fetch UFs");
  return res.json();
};

export const fetchCities = async (ufId: number): Promise<Municipio[]> => {
  const res = await fetch(`/api/address/ufs/${ufId}/municipios`);
  if (!res.ok) throw new Error("Failed to fetch cities");
  return res.json();
};

export const fetchCep = async (cep: string): Promise<ViaCepResponse>  => {
  console.log("Fetching cep...")
  const res = await fetch(`/api/via-cep/${cep}`);
  if (!res.ok) throw new Error("Failed to fetch CEP");
  return res.json();
};