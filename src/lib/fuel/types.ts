export interface FuelStation {
  adresse: string;
  ville: string;
  prix: number;
  distance: number | null;
}

export type FuelData = FuelStation[];
