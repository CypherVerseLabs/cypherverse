import {
  useCallback,
  useState,
} from "react";

import type {
  Parcel,
} from "../parcels/types";

import type {
  MarketplaceAction,
  MarketplacePurchaseOptions,
  MarketplaceResult,
} from "./types";

import {
  useMarketplaceService,
} from "./marketplace";


/**
 * =========================================================
 * MARKETPLACE HOOK
 * =========================================================
 *
 * React state layer for marketplace operations.
 *
 * The backend remains authoritative.
 *
 * TEST PAYMENT FLOW:
 *
 *   buyParcel()
 *       ↓
 *   createPayment()
 *       ↓
 *   confirmTestPayment()
 *
 * =========================================================
 */

export default function useMarketplace() {

  const marketplace =
    useMarketplaceService();


  /**
   * =======================================================
   * ACTIVE ACTION PARCEL
   * =======================================================
   */

  const [
    actionParcelId,
    setActionParcelId,
  ] = useState<string | null>(null);


  /**
   * =======================================================
   * ACTIVE ACTION TYPE
   * =======================================================
   */

  const [
    actionType,
    setActionType,
  ] = useState<MarketplaceAction | null>(
    null
  );


  /**
   * =======================================================
   * ACTION ERROR
   * =======================================================
   */

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(null);


  /**
   * =======================================================
   * CLEAR ACTION
   * =======================================================
   */

  const clearAction = useCallback(() => {

    setActionParcelId(null);

    setActionType(null);

    setActionError(null);

  }, []);


  /**
   * =======================================================
   * START ACTION
   * =======================================================
   */

  const startAction = useCallback(
    (
      parcelId: string,
      action: MarketplaceAction
    ) => {

      setActionParcelId(
        parcelId
      );

      setActionType(
        action
      );

      setActionError(
        null
      );

    },
    []
  );


  /**
   * =======================================================
   * IDEMPOTENCY KEY
   * =======================================================
   */

  const createIdempotencyKey =
    useCallback(
      (
        parcelId: string
      ): string => {

        const randomPart =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;

        return `parcel-buy-${parcelId}-${randomPart}`;

      },
      []
    );


  /**
   * =======================================================
   * RUN ACTION
   * =======================================================
   */

  const runAction = useCallback(
    async (
      parcelId: string,
      action: MarketplaceAction,
      operation: () => Promise<MarketplaceResult>
    ): Promise<MarketplaceResult> => {

      if (
        actionParcelId !== null
      ) {

        return {
          success: false,

          action,

          error:
            "Another marketplace action is already running.",
        };

      }


      startAction(
        parcelId,
        action
      );


      try {

        const result =
          await operation();


        if (
          !result.success
        ) {

          setActionError(
            result.error
          );

        }


        return result;

      } catch (error) {

        console.error(
          `[Marketplace] ${action} action failed:`,
          error
        );


        const message =
          error instanceof Error
            ? error.message
            : "Marketplace operation failed.";


        const result:
          MarketplaceResult = {

          success: false,

          action,

          error:
            message,

        };


        setActionError(
          message
        );


        return result;

      } finally {

        setActionParcelId(
          null
        );

        setActionType(
          null
        );

      }

    },
    [
      actionParcelId,
      startAction,
    ]
  );


  /**
   * =======================================================
   * BUY PARCEL
   * =======================================================
   *
   * Complete TEST purchase flow:
   *
   *   1. Create server-authoritative order
   *   2. Create payment from the order
   *   3. Confirm the test payment
   *
   * The backend remains authoritative for:
   *
   *   - user
   *   - parcel
   *   - listing
   *   - price
   *   - payment
   *   - ownership
   *
   * Creating the order alone does NOT transfer ownership.
   */

  const buyParcel = useCallback(
    async (
      parcel: Parcel,
      options?: MarketplacePurchaseOptions
    ): Promise<MarketplaceResult> => {

      if (!parcel?.id) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "buy",

          error:
            "Parcel ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      const idempotencyKey =
        options?.idempotencyKey ??
        createIdempotencyKey(
          parcel.id
        );


      return runAction(
        parcel.id,
        "buy",
        async () => {

          /**
           * -------------------------------------------------
           * STEP 1
           * Create server-authoritative marketplace order.
           * -------------------------------------------------
           */

          const orderResult =
            await marketplace.buyParcel(
              parcel,
              {
                ...options,
                idempotencyKey,
              }
            );


          if (!orderResult.success) {
            return orderResult;
          }


          if (!orderResult.order) {

            return {
              success: false,

              action: "buy",

              error:
                "Marketplace order was created but no order was returned.",
            };

          }


          /**
           * -------------------------------------------------
           * STEP 2
           * Create payment for the order.
           *
           * The backend determines the payment amount from
           * the authoritative order.
           * -------------------------------------------------
           */

          const paymentResult =
            await marketplace.createPayment(
              orderResult.order.id
            );


          if (!paymentResult.success) {
            return paymentResult;
          }


          if (!paymentResult.payment) {

            return {
              success: false,

              action: "buy",

              error:
                "Marketplace payment was created but no payment was returned.",
            };

          }


          /**
           * -------------------------------------------------
           * STEP 3
           * Confirm TEST payment.
           *
           * The backend performs the actual payment
           * completion and ownership/entitlement logic.
           * -------------------------------------------------
           */

          const confirmationResult =
            await marketplace.confirmTestPayment(
              paymentResult.payment.id
            );


          if (!confirmationResult.success) {
            return confirmationResult;
          }


          /**
           * -------------------------------------------------
           * Return the final backend result.
           *
           * Preserve the order/payment information in case
           * the confirmation endpoint does not return all
           * fields.
           * -------------------------------------------------
           */

          return {
            success: true,

            action: "buy",

            order:
              confirmationResult.order ??
              orderResult.order,

            payment:
              confirmationResult.payment ??
              paymentResult.payment,

            purchase:
              confirmationResult.purchase,

            parcel:
              confirmationResult.parcel,

          };

        }
      );

    },
    [
      createIdempotencyKey,
      marketplace,
      runAction,
    ]
  );


  /**
   * =======================================================
   * CREATE PAYMENT
   * =======================================================
   *
   * Creates a payment for an existing marketplace order.
   *
   * POST /api/marketplace/orders/:orderId/payment
   */

  const createPayment = useCallback(
    async (
      orderId: string
    ): Promise<MarketplaceResult> => {

      if (!orderId) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "buy",

          error:
            "Order ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return marketplace.createPayment(
        orderId
      );

    },
    [
      marketplace,
    ]
  );


  /**
   * =======================================================
   * CONFIRM TEST PAYMENT
   * =======================================================
   *
   * TEST/SANDBOX ONLY.
   *
   * POST /api/marketplace/test/payments/:paymentId/confirm
   *
   * The backend decides whether the payment succeeds and
   * grants ownership.
   */

  const confirmTestPayment = useCallback(
    async (
      paymentId: string
    ): Promise<MarketplaceResult> => {

      if (!paymentId) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "buy",

          error:
            "Payment ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return marketplace.confirmTestPayment(
        paymentId
      );

    },
    [
      marketplace,
    ]
  );


  /**
   * =======================================================
   * FAIL TEST PAYMENT
   * =======================================================
   *
   * TEST/SANDBOX ONLY.
   */

  const failTestPayment = useCallback(
    async (
      paymentId: string
    ): Promise<MarketplaceResult> => {

      if (!paymentId) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "buy",

          error:
            "Payment ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return marketplace.failTestPayment(
        paymentId
      );

    },
    [
      marketplace,
    ]
  );


  /**
   * =======================================================
   * CANCEL TEST PAYMENT
   * =======================================================
   *
   * TEST/SANDBOX ONLY.
   */

  const cancelTestPayment = useCallback(
    async (
      paymentId: string
    ): Promise<MarketplaceResult> => {

      if (!paymentId) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "buy",

          error:
            "Payment ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return marketplace.cancelTestPayment(
        paymentId
      );

    },
    [
      marketplace,
    ]
  );


  /**
   * =======================================================
   * RESERVE PARCEL
   * =======================================================
   */

  const reserveParcel = useCallback(
    async (
      parcel: Parcel
    ): Promise<MarketplaceResult> => {

      if (!parcel?.id) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "reserve",

          error:
            "Parcel ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return runAction(
        parcel.id,
        "reserve",
        () =>
          marketplace.reserveParcel(
            parcel
          )
      );

    },
    [
      marketplace,
      runAction,
    ]
  );


  /**
   * =======================================================
   * LIST PARCEL
   * =======================================================
   */

  const listParcel = useCallback(
    async (
      parcel: Parcel,
      price: string
    ): Promise<MarketplaceResult> => {

      if (!parcel?.id) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "list",

          error:
            "Parcel ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      const normalizedPrice =
        price.trim();


      if (
        !/^\d+(\.\d{1,2})?$/.test(
          normalizedPrice
        ) ||
        Number(normalizedPrice) <= 0
      ) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "list",

          error:
            "Listing price must be a positive amount with at most two decimal places.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return runAction(
        parcel.id,
        "list",
        () =>
          marketplace.listParcel(
            parcel,
            normalizedPrice
          )
      );

    },
    [
      marketplace,
      runAction,
    ]
  );


  /**
   * =======================================================
   * RELEASE PARCEL RESERVATION
   * =======================================================
   */

  const releaseParcel = useCallback(
    async (
      parcel: Parcel
    ): Promise<MarketplaceResult> => {

      if (!parcel?.id) {

        const result:
          MarketplaceResult = {

          success: false,

          action: "release",

          error:
            "Parcel ID is required.",

        };


        setActionError(
          result.error
        );


        return result;

      }


      return runAction(
        parcel.id,
        "release",
        () =>
          marketplace.releaseParcel(
            parcel
          )
      );

    },
    [
      marketplace,
      runAction,
    ]
  );


  /**
   * =======================================================
   * PUBLIC API
   * =======================================================
   */

  return {

    actionParcelId,

    actionType,

    actionError,

    buyParcel,

    createPayment,

    confirmTestPayment,

    failTestPayment,

    cancelTestPayment,

    reserveParcel,

    listParcel,

    releaseParcel,

    clearAction,

  };

}