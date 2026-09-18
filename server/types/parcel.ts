export type ParcelStatus =
  | "available"
  | "owned"
  | "reserved"
  | "for_sale";

export interface Parcel {
  id: string;

  x: number;
  y: number;

  type: number;

  status: ParcelStatus;

  top?: number;

  owner?: string;

  estate_id?: string;

  name?: string;

  color?: string;

  price?: number;
}
