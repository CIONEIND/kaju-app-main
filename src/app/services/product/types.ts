export interface ProductWithPriceAndQty {
  id: number;
  name: string;
  subCategoria: string;
  categoria: string;
  minPricePerKg: number;
  defaultPricePerKg: number;
  stockQty: number;
  boxSize: number;
}

export interface VirtualStock {
  id: number;
  name: string;
  subCategoria: string;
  categoria: string;
  physicalStock: number;
  reserved: number;
  available: number;
  minPricePerKg: number;
  defaultPricePerKg: number;
  boxSize: number;

}

export interface ProductWithMinPrice {
    id: number;
    name: string;
    minPricePerKg: number;
    boxSize: number;
}

export interface RawProductResult {
  id: number;           // CdObj is likely a number in the DB
  name: string;         // NmObj
  stockQty: string | number; // SQL DECIMAL often returns as a string in Node to prevent JS float precision loss
}

