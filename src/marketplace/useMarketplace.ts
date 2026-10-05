import {
  useCallback,
  useState,
} from "react";

import type {
  Parcel,
} from "../parcels/types";

import type {
  MarketplaceAction,
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
 * PURCHASE FLOW:
 *
 *   buyParcel()
 *       ↓
 *   createOrder()
 *       ↓
 *   createPayment()
 *       ↓
 *   confirmTestPayment()
 *
 * The marketplace service owns the individual API calls.
 * This hook owns the higher-level purchase orchestration.

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
   * CREATE MARKETPLACE ORDER
   * =======================================================
   *
   * Creates the marketplace order for a parcel.
   *
   * POST /api/marketplace/orders
   *
   * The marketplace service performs the API call.
   * The backend determines the authoritative:
   *
   *   - buyer
   *   - listing
   *   - seller
   *   - price
   *   - currency
   */

  const createOrder = useCallback(
    async (
      parcel: Parcel
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


      return runAction(
        parcel.id,
        "buy",
        () =>
          marketplace.createOrder(
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
   * CREATE PAYMENT
   * =======================================================
   *
   * Creates a payment for an existing marketplace order.
   *
   * POST /api/marketplace/orders/:orderId/payment
   *
   * The backend determines the authoritative amount from
   * the marketplace order.
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
   * BUY PARCEL
   * =======================================================
   *
   * Higher-level marketplace purchase operation.
   *
   * Flow:
   *
   *   createOrder()
   *       ↓
   *   createPayment()
   *       ↓
   *   confirmTestPayment()
   *
   * marketplace.ts remains responsible for individual API
   * calls. This hook coordinates the complete purchase.
   */

  const buyParcel = useCallback(
    async (
      parcel: Parcel
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


      return runAction(
        parcel.id,
        "buy",
        async () => {

          /**
           * STEP 1
           * Create the marketplace order.
           */

          const orderResult =
            await marketplace.createOrder(
              parcel
            );


          if (!orderResult.success) {

            return orderResult;

          }


          if (!orderResult.order?.id) {

            return {
              success: false,

              action: "buy",

              error:
                "Marketplace order was created but no order ID was returned.",
            };

          }


          /**
           * STEP 2
           * Create the payment for that order.
           */

          const paymentResult =
            await marketplace.createPayment(
              orderResult.order.id
            );


          if (!paymentResult.success) {

            return paymentResult;

          }


          if (!paymentResult.payment?.id) {

            return {
              success: false,

              action: "buy",

              error:
                "Marketplace payment was created but no payment ID was returned.",
            };

          }


          /**
           * STEP 3
           * Confirm the test payment.
           *
           * The backend performs the authoritative
           * ownership/entitlement operation.
           */

          return marketplace.confirmTestPayment(
            paymentResult.payment.id
          );

        }
      );

    },
    [
      marketplace,
      runAction,
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
   * performs the ownership/entitlement logic.
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
   *
   * NOTE:
   *
   * buyParcel() has intentionally been removed.
   *
   * Purchase completion now goes through the explicit
   * order/payment flow:
   *
   *   marketplace order
   *       ↓
   *   createPayment()
   *       ↓
   *   confirmTestPayment()
   *
   * =======================================================
   */

      return {
  actionParcelId,
  actionType,
  actionError,

  buyParcel,

  createOrder,
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
