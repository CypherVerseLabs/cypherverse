export type ParcelStatus =
  | "available"
  | "owned"
  | "reserved"
  | "for_sale";

export type ParcelProjectTemplate =
  | "editor"
  | "found";

export interface ParcelProject {
  id: string;
  name: string;
  description?: string | null;
  template: "editor" | "found";
  slug?: string | null;
  publishedAt?: string | null;
}

export interface Parcel {
  id: string;

  x: number;
  y: number;

  type: number;

  status: ParcelStatus;

  top?: number;

  owner?: string;
  ownerId?: string | null;

  estate_id?: string;
  estateId?: string;

  name?: string | null;
  description?: string | null;

  color?: string;

  price?: number | null;

  blockchainAddress?: string | null;
  tokenId?: string | null;

  project?: ParcelProject | null;
}
