import type {
  Parcel,
} from "../parcels/types";

import type {
  MarketplacePurchaseOptions,
  MarketplaceResult,
  MarketplaceService,
} from "./types";

import {
  useAuthContext,
} from "../ideas/context/AuthContext";

/**
 * =========================================================
 * CYPHERVERSE MARKETPLACE SERVICE
 * =========================================================
 *
 * Frontend service for the CyBuilder marketplace API.
 *
 * All marketplace requests use authFetch().
 *
 * Purchase flow:
 *
 *   1. POST /api/marketplace/orders
 *   2. POST /api/marketplace/orders/:orderId/payment
 *   3. POST /api/marketplace/test/payments/:paymentId/confirm
 *
 * The backend remains authoritative for:
 *
 *   - user
 *   - parcel
 *   - listing
 *   - price
 *   - payment
 *   - ownership
 */

/**
 * =========================================================
 * API RESPONSE HELPER
 * =========================================================
 */

async function readResponse(
  response: Response
): Promise<any> {

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  return {
    error:
      text ||
      `Request failed with status ${response.status}`,
  };
}


/**
 * =========================================================
 * MARKETPLACE SERVICE
 * =========================================================
 */

export function useMarketplaceService(): MarketplaceService {

  const {
    authFetch,
  } = useAuthContext();


  return {

    /**
     * =======================================================
     * BUY PARCEL
     * =======================================================
     *
     * Creates a server-authoritative marketplace order.
     *
     * POST /api/marketplace/orders
     *
     * IMPORTANT:
     *
     * No price is sent by the client.
     *
     * The backend determines the authoritative listing price.
     */

    async buyParcel(
      parcel: Parcel,
      options?: MarketplacePurchaseOptions
    ): Promise<MarketplaceResult> {

      if (!parcel?.id) {

        return {
          success: false,
          action: "buy",
          error:
            "Parcel ID is required.",
        };

      }


      /**
       * -----------------------------------------------------
       * Generate / use idempotency key
       * -----------------------------------------------------
       */

      const idempotencyKey =
        options?.idempotencyKey ??
        (
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`
        );


      try {

        const response =
          await authFetch(
            "/api/marketplace/orders",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Idempotency-Key":
                  idempotencyKey,
              },

              body:
                JSON.stringify({
                  parcelId:
                    parcel.id,
                }),
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "buy",

            error:
              data?.message ||
              data?.error ||
              `Failed to create marketplace order (${response.status}).`,
          };

        }


        if (!data?.order) {

          return {
            success: false,
            action: "buy",

            error:
              "Marketplace order was created but no order was returned.",
          };

        }


        return {
          success: true,
          action: "buy",

          order:
            data.order,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Create order error:",
          error
        );


        return {
          success: false,
          action: "buy",

          error:
            error instanceof Error
              ? error.message
              : "Failed to create marketplace order.",
        };

      }

    },


    /**
     * =======================================================
     * CREATE MARKETPLACE PAYMENT
     * =======================================================
     *
     * POST /api/marketplace/orders/:orderId/payment
     *
     * The backend calculates the authoritative payment amount.
     *
     * The client does NOT provide an amount.
     */

    async createPayment(
      orderId: string
    ): Promise<MarketplaceResult> {

      if (!orderId) {

        return {
          success: false,
          action: "buy",
          error:
            "Order ID is required.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/orders/${orderId}/payment`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "buy",

            error:
              data?.message ||
              data?.error ||
              `Failed to create marketplace payment (${response.status}).`,
          };

        }


        if (!data?.payment) {

          return {
            success: false,
            action: "buy",

            error:
              "Marketplace payment was created but no payment was returned.",
          };

        }


        return {
          success: true,
          action: "buy",

          payment:
            data.payment,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Create payment error:",
          error
        );


        return {
          success: false,
          action: "buy",

          error:
            error instanceof Error
              ? error.message
              : "Failed to create marketplace payment.",
        };

      }

    },


    /**
     * =======================================================
     * TEST PAYMENT SUCCESS
     * =======================================================
     *
     * POST
     * /api/marketplace/test/payments/:paymentId/confirm
     *
     * TEST/SANDBOX ONLY.
     *
     * The backend performs the actual confirmation and
     * entitlement/ownership logic.
     */

    async confirmTestPayment(
      paymentId: string
    ): Promise<MarketplaceResult> {

      if (!paymentId) {

        return {
          success: false,
          action: "buy",
          error:
            "Payment ID is required.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/test/payments/${paymentId}/confirm`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "buy",

            error:
              data?.message ||
              data?.error ||
              `Failed to confirm test payment (${response.status}).`,
          };

        }


        return {
          success: true,
          action: "buy",

          order:
            data?.order,

          purchase:
            data?.purchase,

          parcel:
            data?.parcel,

          payment:
            data?.payment,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Confirm test payment error:",
          error
        );


        return {
          success: false,
          action: "buy",

          error:
            error instanceof Error
              ? error.message
              : "Failed to confirm test payment.",
        };

      }

    },


    /**
     * =======================================================
     * TEST PAYMENT FAILURE
     * =======================================================
     *
     * POST
     * /api/marketplace/test/payments/:paymentId/fail
     */

    async failTestPayment(
      paymentId: string
    ): Promise<MarketplaceResult> {

      if (!paymentId) {

        return {
          success: false,
          action: "buy",
          error:
            "Payment ID is required.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/test/payments/${paymentId}/fail`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "buy",

            error:
              data?.message ||
              data?.error ||
              `Failed to fail test payment (${response.status}).`,
          };

        }


        return {
          success: true,
          action: "buy",

          order:
            data?.order,

          purchase:
            data?.purchase,

          parcel:
            data?.parcel,

          payment:
            data?.payment,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Fail test payment error:",
          error
        );


        return {
          success: false,
          action: "buy",

          error:
            error instanceof Error
              ? error.message
              : "Failed to fail test payment.",
        };

      }

    },


    /**
     * =======================================================
     * TEST PAYMENT CANCELLATION
     * =======================================================
     *
     * POST
     * /api/marketplace/test/payments/:paymentId/cancel
     */

    async cancelTestPayment(
      paymentId: string
    ): Promise<MarketplaceResult> {

      if (!paymentId) {

        return {
          success: false,
          action: "buy",
          error:
            "Payment ID is required.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/test/payments/${paymentId}/cancel`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "buy",

            error:
              data?.message ||
              data?.error ||
              `Failed to cancel test payment (${response.status}).`,
          };

        }


        return {
          success: true,
          action: "buy",

          order:
            data?.order,

          purchase:
            data?.purchase,

          parcel:
            data?.parcel,

          payment:
            data?.payment,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Cancel test payment error:",
          error
        );


        return {
          success: false,
          action: "buy",

          error:
            error instanceof Error
              ? error.message
              : "Failed to cancel test payment.",
        };

      }

    },


    /**
     * =======================================================
     * RESERVE PARCEL
     * =======================================================
     *
     * POST /api/marketplace/parcels/:id/reserve
     */

    async reserveParcel(
      parcel: Parcel
    ): Promise<MarketplaceResult> {

      if (!parcel?.id) {

        return {
          success: false,
          action: "reserve",
          error:
            "Parcel ID is required.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/parcels/${parcel.id}/reserve`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "reserve",

            error:
              data?.message ||
              data?.error ||
              `Failed to reserve parcel (${response.status}).`,
          };

        }


        return {
          success: true,
          action: "reserve",

          parcel:
            data?.parcel,

          listing:
            data?.listing,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Reserve error:",
          error
        );


        return {
          success: false,
          action: "reserve",

          error:
            error instanceof Error
              ? error.message
              : "Failed to reserve parcel.",
        };

      }

    },


    /**
     * =======================================================
     * RELEASE PARCEL RESERVATION
     * =======================================================
     *
     * POST /api/marketplace/parcels/:id/release
     */

    async releaseParcel(
      parcel: Parcel
    ): Promise<MarketplaceResult> {

      if (!parcel?.id) {

        return {
          success: false,
          action: "release",
          error:
            "Parcel ID is required.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/parcels/${parcel.id}/release`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "release",

            error:
              data?.message ||
              data?.error ||
              `Failed to release reservation (${response.status}).`,
          };

        }


        return {
          success: true,
          action: "release",

          parcel:
            data?.parcel,

          listing:
            data?.listing,
        };

      } catch (error) {

        console.error(
          "[Marketplace] Release error:",
          error
        );


        return {
          success: false,
          action: "release",

          error:
            error instanceof Error
              ? error.message
              : "Failed to release reservation.",
        };

      }

    },


    /**
     * =======================================================
     * LIST PARCEL
     * =======================================================
     *
     * POST /api/marketplace/parcels/:id/list
     */

    async listParcel(
      parcel: Parcel,
      price: string
    ): Promise<MarketplaceResult> {

      if (!parcel?.id) {

        return {
          success: false,
          action: "list",
          error:
            "Parcel ID is required.",
        };

      }


      const normalizedPrice =
        price.trim();


      if (
        !/^\d+(\.\d{1,2})?$/.test(
          normalizedPrice
        ) ||
        Number(normalizedPrice) <= 0
      ) {

        return {
          success: false,
          action: "list",

          error:
            "Listing price must be a positive amount with at most two decimal places.",
        };

      }


      try {

        const response =
          await authFetch(
            `/api/marketplace/parcels/${parcel.id}/list`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  price:
                    normalizedPrice,
                }),
            }
          );


        const data =
          await readResponse(
            response
          );


        if (!response.ok) {

          return {
            success: false,
            action: "list",

            error:
              data?.message ||
              data?.error ||
              `Failed to list parcel (${response.status}).`,
          };

        }


        return {
          success: true,
          action: "list",

          parcel:
            data?.parcel,

          listing:
            data?.listing,
        };

      } catch (error) {

        console.error(
          "[Marketplace] List error:",
          error
        );


        return {
          success: false,
          action: "list",

          error:
            error instanceof Error
              ? error.message
              : "Failed to list parcel.",
        };

      }

    },

  };

}
