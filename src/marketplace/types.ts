import type {
  Parcel,
} from "../parcels/types";


/**
 * =========================================================
 * MARKETPLACE ACTION
 * =========================================================
 */

export type MarketplaceAction =
  | "buy"
  | "reserve"
  | "list"
  | "release";


/**
 * =========================================================
 * PAYMENT MODE
 * =========================================================
 *
 * This milestone supports TEST mode only.
 */

export type PaymentsMode =
  | "test";


/**
 * =========================================================
 * TEST PAYMENT RESULT
 * =========================================================
 */

export type TestPaymentResult =
  | "success"
  | "declined"
  | "cancelled"
  | "timeout"
  | "provider_error";


/**
 * =========================================================
 * PURCHASE STATUS
 * =========================================================
 */

export type MarketplacePurchaseStatus =
  | "created"
  | "checkout"
  | "paid"
  | "failed"
  | "cancelled"
  | "abandoned";


/**
 * =========================================================
 * PURCHASE OPTIONS
 * =========================================================
 *
 * These values control the TEST purchase flow.
 *
 * IMPORTANT:
 *
 * No price is accepted from the client.
 *
 * The backend calculates the authoritative amount.
 */

export interface MarketplacePurchaseOptions {

  /**
   * Idempotency key for this purchase attempt.
   */

  idempotencyKey?: string;


  /**
   * Fake sandbox payment method.
   *
   * Examples:
   *
   *   test_success
   *   test_declined
   *   test_cancelled
   *   test_timeout
   *   test_provider_error
   */

  paymentMethodId?: string;


  /**
   * Optional deterministic sandbox result.
   *
   * The backend must validate this value and must never
   * treat arbitrary client input as proof of payment.
   *
   * Prefer selecting a test payment method instead.
   */

  testPaymentResult?:
    | TestPaymentResult;
}


/**
 * =========================================================
 * PURCHASE
 * =========================================================
 */

export interface MarketplacePurchase {

  id: string;

  parcelId: string;

  userId: string;

  status:
    MarketplacePurchaseStatus;

  paymentMode:
    PaymentsMode;

  paymentMethodId?:
    string | null;

  currency: string;

  /**
   * Server-calculated authoritative amount.
   */

  amount: string;

  entitlementGranted:
    boolean;

  createdAt?:
    string;

  paidAt?:
    string | null;
}

export interface MarketplaceOrder {
  id: string;

  userId: string;

  productId: string;

  listingId: string | null;

  quantity: number;

  amount: string;

  currency: string;

  status: string;

  createdAt: string;

  updatedAt: string;
}

export interface MarketplacePayment {
  id: string;

  orderId: string;

  userId: string;

  amount: string;

  currency: string;

  status: string;

  createdAt: string;

  updatedAt: string;
}


/**
 * =========================================================
 * MARKETPLACE SUCCESS
 * =========================================================
 */

export type MarketplaceSuccess = {
  success: true;

  action: MarketplaceAction;

  parcel?: Parcel;

  listing?: unknown;

  order?: MarketplaceOrder;

  payment?: MarketplacePayment;

  purchase?: MarketplacePurchase;
};





/**
 * =========================================================
 * MARKETPLACE FAILURE
 * =========================================================
 */

export type MarketplaceFailure = {

  success: false;

  action: MarketplaceAction;

  error: string;

  purchase?:
    MarketplacePurchase;
};


/**
 * =========================================================
 * MARKETPLACE RESULT
 * =========================================================
 */

export type MarketplaceResult =
  | MarketplaceSuccess
  | MarketplaceFailure;


/**
 * =========================================================
 * MARKETPLACE SERVICE
 * =========================================================
 */

export interface MarketplaceService {

  buyParcel(
    parcel: Parcel,
    options?: MarketplacePurchaseOptions
  ): Promise<MarketplaceResult>;

  createPayment(
    orderId: string
  ): Promise<MarketplaceResult>;

  confirmTestPayment(
    paymentId: string
  ): Promise<MarketplaceResult>;

  failTestPayment(
    paymentId: string
  ): Promise<MarketplaceResult>;

  cancelTestPayment(
    paymentId: string
  ): Promise<MarketplaceResult>;

  reserveParcel(
    parcel: Parcel
  ): Promise<MarketplaceResult>;

  releaseParcel(
    parcel: Parcel
  ): Promise<MarketplaceResult>;

  listParcel(
    parcel: Parcel,
    price: string
  ): Promise<MarketplaceResult>;
}
