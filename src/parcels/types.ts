/**
 * =========================================================
 * PARCEL TYPES
 * =========================================================
 *
 * Shared types for the CypherVerse parcel system.
 *
 * Used by:
 *
 *   - API clients
 *   - marketplace services
 *   - hooks
 *   - 3D components
 *   - directory components
 *   - map components
 *   - UI panels
 *
 * =========================================================
 */


/**
 * =========================================================
 * PARCEL STATUS
 * =========================================================
 */

export type ParcelStatus =
  | "available"
  | "owned"
  | "reserved"
  | "for_sale";


/**
 * =========================================================
 * MARKETPLACE ACTION
 * =========================================================
 */

export type ParcelActionType =
  | "buy"
  | "reserve"
  | "list"
  | "release";


/**
 * =========================================================
 * PARCEL PROJECT
 * =========================================================
 */

export type ParcelProjectTemplate =
  | "editor"
  | "found";


export interface ParcelProject {

  /**
   * Unique project identifier.
   */

  id: string;


  /**
   * Project name.
   */

  name: string;


  /**
   * Optional project description.
   */

  description?: string | null;


  /**
   * Project template.
   */

  template: ParcelProjectTemplate;


  /**
   * Optional public project slug.
   */

  slug?: string | null;


  /**
   * Date the project was published.
   */

  publishedAt?: string | null;
}


/**
 * =========================================================
 * PARCEL
 * =========================================================
 */

export interface Parcel {

  /**
   * =======================================================
   * IDENTITY
   * =======================================================
   */

  /**
   * Unique parcel identifier.
   */

  id: string;


  /**
   * =======================================================
   * WORLD POSITION
   * =======================================================
   *
   * The database stores parcel coordinates directly in
   * world units:
   *
   *   0
   *   16
   *   32
   *   48
   *   ...
   *
   * ParcelLayer maps:
   *
   *   x -> THREE X
   *   y -> THREE Z
   *
   * =======================================================
   */

  x: number;

  y: number;


  /**
   * Optional vertical/top value.
   *
   * The current parcel API does not appear to require this
   * field, so it is optional.
   */

  top?: number | null;


  /**
   * =======================================================
   * DISPLAY INFORMATION
   * =======================================================
   */

  /**
   * Human-readable parcel name.
   */

  name?: string | null;


  /**
   * Human-readable parcel description.
   */

  description?: string | null;


  /**
   * Estate/group identifier.
   *
   * The API may return this as a number or string depending
   * on the backend/database representation.
   */

  estateId?: string | number | null;


  /**
   * Optional custom display color.
   */

  color?: string | null;


  /**
   * =======================================================
   * MARKETPLACE STATE
   * =======================================================
   */

  /**
   * Current marketplace/world status.
   */

  status: ParcelStatus;


  /**
   * Current listing/reservation price.
   */

  price?: number | null;


  /**
   * Current owner.
   */

  ownerId?: string | null;


  /**
   * Current reservation holder.
   */

  reservedBy?: string | null;


  /**
   * =======================================================
   * PROJECT
   * =======================================================
   *
   * Optional project built on this parcel.
   */

  project?: ParcelProject | null;


  /**
   * =======================================================
   * OPTIONAL BACKEND METADATA
   * =======================================================
   */

  metadata?: Record<
    string,
    unknown
  >;
}


/**
 * =========================================================
 * PARCEL SELECT EVENT
 * =========================================================
 */

export interface ParcelSelectEvent {

  /**
   * Selected parcel.
   */

  parcel: Parcel;


  /**
   * Where the selection originated.
   */

  source:
    | "world"
    | "directory"
    | "map";
}


/**
 * =========================================================
 * PARCEL ACTION STATE
 * =========================================================
 */

export interface ParcelActionState {

  /**
   * Parcel currently being processed.
   */

  actionParcelId:
    | string
    | null;


  /**
   * Current marketplace operation.
   */

  actionType:
    | ParcelActionType
    | null;


  /**
   * Current marketplace error.
   */

  actionError:
    | string
    | null;
}


/**
 * =========================================================
 * PARCEL LAYER PROPS
 * =========================================================
 */

export interface ParcelLayerProps {

  /**
   * =======================================================
   * PARCEL DATA
   * =======================================================
   */

  /**
   * Parcels to render.
   */

  parcels?: Parcel[];


  /**
   * =======================================================
   * VISIBILITY
   * =======================================================
   */

  /**
   * Whether the entire parcel layer is visible.
   */

  visible?: boolean;


  /**
   * =======================================================
   * 3D CONFIGURATION
   * =======================================================
   */

  /**
   * Physical size of one parcel tile.
   *
   * NOTE:
   *
   * Parcel coordinates are already stored in world units.
   * parcelToWorldPosition() therefore maps x/y directly
   * into the world.
   */

  tileSize?: number;


  /**
   * 3D world origin.
   */

  origin?: [
    number,
    number,
    number
  ];


  /**
   * =======================================================
   * INTERACTION
   * =======================================================
   */

  /**
   * Whether users can interact with parcels.
   */

  interactive?: boolean;


  /**
   * Parent-controlled selected parcel.
   *
   * undefined:
   *   ParcelLayer may use internal selection.
   *
   * null:
   *   Nothing is selected.
   *
   * string:
   *   That parcel is selected.
   */

  selectedParcelId?:
    | string
    | null;


  /**
   * =======================================================
   * PARCEL SELECTION
   * =======================================================
   */

  /**
   * Called when a parcel is selected.
   */

  onParcelSelect?: (
    event: ParcelSelectEvent
  ) => void;


  /**
   * Called when the selected parcel panel is closed.
   */

  onParcelClose?: () => void;


  /**
   * =======================================================
   * MARKETPLACE CALLBACKS
   * =======================================================
   *
   * ParcelLayer does not own marketplace business logic.
   */

  onBuy?: (
    parcel: Parcel
  ) => void | Promise<void>;


  onReserve?: (
    parcel: Parcel
  ) => void | Promise<void>;


  onList?: (
    parcel: Parcel
  ) => void | Promise<void>;


  /**
   * =======================================================
   * MARKETPLACE ACTION STATE
   * =======================================================
   */

  actionParcelId?:
    | string
    | null;


  actionType?:
    | ParcelActionType
    | null;


  actionError?:
    | string
    | null;
}