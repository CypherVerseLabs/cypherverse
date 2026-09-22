/**
 * =========================================================
 * PARCEL TYPES
 * =========================================================
 *
 * Shared types for the CypherVerse parcel system.
 *
 * These types are intentionally independent from React
 * components so they can be used by:
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
 *
 * Project information attached to a parcel.
 *
 * This mirrors the project information exposed by the
 * backend parcel API.
 *
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
   * WORLD POSITION
   * =======================================================
   */

  /**
   * Top/world height value.
   */

  top: number;


  /**
   * Unique parcel identifier.
   */

  id: string;


  /**
   * Logical world-grid X coordinate.
   */

  x: number;


  /**
   * Logical world-grid Y coordinate.
   */

  y: number;


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
   */

  estateId?: string | null;


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
   *
   * The backend may return null when the parcel has no
   * associated project.
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
   *
   * The parent owns selectedParcelId, so ParcelLayer
   * notifies the parent instead of mutating parent state
   * directly.
   */

  onParcelClose?: () => void;


  /**
   * =======================================================
   * MARKETPLACE CALLBACKS
   * =======================================================
   *
   * These callbacks are supplied by the parent.
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


