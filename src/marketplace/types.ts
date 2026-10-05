import type {
  Parcel,
} from "../parcels/types.js";



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
  | "local"
  | "staging"
  | "production";


export type MarketplaceCurrency =
  | "USD"
  | "ETH"
  | "CYPH";


export type MarketplacePaymentMethod =
  | "USD_PROVIDER"
  | "ETH_BLOCKCHAIN"
  | "CYPH_LEDGER";


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


/**
 * =========================================================
 * MARKETPLACE ORDER
 * =========================================================
 */

export interface MarketplaceOrder {

  id: string;

  userId: string;

  productId: string;

  listingId:
    string | null;

  quantity: number;

  amount: string;

  currency:
    MarketplaceCurrency;

  status: string;

  createdAt: string;

  updatedAt: string;
}


/**
 * =========================================================
 * MARKETPLACE PAYMENT
 * =========================================================
 */

export interface MarketplacePayment {

  id: string;

  orderId: string;

  userId: string;

  amount: string;

  currency:
    MarketplaceCurrency;

  method:
    MarketplacePaymentMethod;

  externalTransactionId?:
    string | null;

  network?:
    string | null;

  status: string;

  environment?:
    PaymentsMode;

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

  action:
    MarketplaceAction;

  parcel?:
    Parcel;

  listing?:
    unknown;

  order?:
    MarketplaceOrder;

  payment?:
    MarketplacePayment;

  purchase?:
    MarketplacePurchase;
};


/**
 * =========================================================
 * MARKETPLACE FAILURE
 * =========================================================
 */

export type MarketplaceFailure = {

  success: false;

  action:
    MarketplaceAction;

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
 *
 * IMPORTANT:
 *
 * There is intentionally NO buyParcel() method here.
 *
 * Purchase completion uses the explicit marketplace flow:
 *
 *   createOrder()
 *       ↓
 *   createPayment()
 *       ↓
 *   confirmTestPayment()
 *
 * Ownership must only be granted by the backend payment
 * confirmation flow.
 */

export interface MarketplaceService {

  createOrder(
    parcel: Parcel
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
