// mocks/data.ts

export type BoxType = 'FULL' | 'HALF';
export const BOX_WEIGHTS: Record<BoxType, number> = {
  FULL: 22.68,
  HALF: 11.34,
};

export const MOCK_CLIENTS = [
  { id: 'c1', name: 'Castanhas do Brasil Ltda', cnpj: '00.000.000/0001-00' },
  { id: 'c2', name: 'Exportadora Nordeste S/A', cnpj: '11.111.111/0001-11' },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Castanha W1', minPricePerKg: 45.0, defaultPricePerKg: 50.0 },
  { id: 'p2', name: 'Castanha W2', minPricePerKg: 40.0, defaultPricePerKg: 44.0 },
  { id: 'p3', name: 'Castanha Batoque', minPricePerKg: 30.0, defaultPricePerKg: 35.0 },
];

export const PO_STATUSES = [
  'Rascunho', 
  'Aguardando Autorização', 
  'Aprovado', 
  'Rejeitado', 
  'Aguardando pagamento', 
  'Reservado', 
  'Pago'
] as const;