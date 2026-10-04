import {
  Response,
} from "express";

import {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

import {
  MarketplaceError,
  createParcelOrder,
  getMarketplaceOrderById,
  getMarketplaceOrdersForUser,
  cancelMarketplaceOrder,
} from "../services/marketplaceOrderService.js";

import {
  createMarketplacePayment,
  confirmTestMarketplacePayment,
  failTestMarketplacePayment,
  cancelTestMarketplacePayment,
  getMarketplacePaymentById,
} from "../services/marketplacePaymentService.js";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Get the authenticated user ID from the request.
 *
 * Authentication itself is handled by authenticateToken.
 * This helper makes sure downstream marketplace services
 * never receive an empty user ID.
 */
function getAuthenticatedUserId(
  req: AuthenticatedRequest
): string | null {
  const userId =
    req.user?.id?.trim();

  if (!userId) {
    return null;
  }

  return userId;
}

/**
 * Get a required route parameter safely.
 */
function getRequiredRouteParam(
  value: string | undefined
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

/**
 * Get the Idempotency-Key header.
 *
 * Express can represent headers as string | string[] | undefined.
 * Marketplace order creation only accepts a single string value.
 */
function getIdempotencyKey(
  req: AuthenticatedRequest
): string {
  const header =
    req.headers[
      "idempotency-key"
    ];

  if (typeof header !== "string") {
    return "";
  }

  return header.trim();
}

/**
 * Convert service errors into stable HTTP responses.
 *
 * The service layer remains authoritative for marketplace
 * business rules. Controllers only translate known errors
 * into HTTP responses.
 */
function sendMarketplaceError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof MarketplaceError
  ) {
    const statusMap: Record<
      string,
      number
    > = {
      USER_ID_REQUIRED: 401,

      PARCEL_ID_REQUIRED: 400,
      ORDER_ID_REQUIRED: 400,
      PAYMENT_ID_REQUIRED: 400,

      IDEMPOTENCY_KEY_REQUIRED: 400,
      IDEMPOTENCY_KEY_TOO_LONG: 400,

      PARCEL_NOT_FOUND: 404,
      ORDER_NOT_FOUND: 404,
      PAYMENT_NOT_FOUND: 404,
      LISTING_NOT_FOUND: 404,

      PARCEL_NOT_FOR_SALE: 409,
      CITY_LANDMARK_NOT_FOR_SALE: 409,
      
      LISTING_CHANGED: 409,
      ACTIVE_LISTING_NOT_FOUND: 409,
      MULTIPLE_ACTIVE_LISTINGS: 409,

      CANNOT_BUY_OWN_PARCEL: 409,
      LISTING_OWNER_MISMATCH: 409,
      INVALID_LISTING_PRICE: 409,

      ORDER_CANCELLED: 409,
      ORDER_FAILED: 409,
      ORDER_ALREADY_PAID: 409,
      ORDER_ALREADY_GRANTED: 409,

      PAYMENT_NOT_OWNED: 403,
      PAYMENT_ALREADY_PAID: 409,
      PAYMENT_ALREADY_FAILED: 409,
      PAYMENT_ALREADY_CANCELLED: 409,

      PAYMENT_AMOUNT_MISMATCH: 409,
      PAYMENT_ENVIRONMENT_MISMATCH: 409,
      ORDER_PRICE_MISMATCH: 409,

      UNSUPPORTED_PAYMENT_STATUS: 400,
    };

    const status =
      statusMap[error.code] ??
      400;

    return res.status(status).json({
      error: error.code,
      message: error.message,
    });
  }

  console.error(
    "Marketplace controller error:",
    error
  );

  return res.status(500).json({
    error:
      "MARKETPLACE_INTERNAL_ERROR",
    message:
      "An unexpected marketplace error occurred.",
  });
}

/**
 * =========================================================
 * CREATE PARCEL ORDER
 * =========================================================
 *
 * POST /api/marketplace/orders
 *
 * Body:
 *
 * {
 *   "parcelId": "..."
 * }
 *
 * Optional body:
 *
 * {
 *   "parcelId": "...",
 *   "listingId": "..."
 * }
 *
 * Required header:
 *
 * Idempotency-Key: <unique-client-key>
 *
 * IMPORTANT:
 *
 * The client NEVER supplies the price.
 *
 * The server obtains the authoritative parcel/listing price
 * inside the marketplace order service.
 *
 * Creating an order does NOT grant parcel ownership.
 * =========================================================
 */
export async function createParcelOrderController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const parcelId =
    typeof req.body?.parcelId ===
    "string"
      ? req.body.parcelId.trim()
      : "";

  const listingId =
    typeof req.body?.listingId ===
    "string"
      ? req.body.listingId.trim()
      : undefined;

  const idempotencyKey =
    getIdempotencyKey(req);

  try {
    const order =
      await createParcelOrder({
        userId,
        parcelId,
        listingId,
        idempotencyKey,
      });

    return res.status(201).json({
      order,
    });
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * GET ORDER
 * =========================================================
 *
 * GET /api/marketplace/orders/:orderId
 *
 * A user can only retrieve their own order.
 * =========================================================
 */
export async function getMarketplaceOrderController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const orderId =
    getRequiredRouteParam(
      req.params.orderId
    );

  if (!orderId) {
    return res.status(400).json({
      error:
        "ORDER_ID_REQUIRED",
    });
  }

  try {
    const order =
      await getMarketplaceOrderById(
        orderId,
        userId
      );

    if (!order) {
      return res.status(404).json({
        error:
          "ORDER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      order,
    });
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * GET USER ORDERS
 * =========================================================
 *
 * GET /api/marketplace/orders
 *
 * Returns only orders belonging to the authenticated user.
 * =========================================================
 */
export async function getMarketplaceOrdersController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  try {
    const orders =
      await getMarketplaceOrdersForUser(
        userId
      );

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * CANCEL ORDER
 * =========================================================
 *
 * POST /api/marketplace/orders/:orderId/cancel
 *
 * Only the authenticated owner of the order can cancel it.
 *
 * Cancellation must never transfer ownership.
 * =========================================================
 */
export async function cancelMarketplaceOrderController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const orderId =
    getRequiredRouteParam(
      req.params.orderId
    );

  if (!orderId) {
    return res.status(400).json({
      error:
        "ORDER_ID_REQUIRED",
    });
  }

  try {
    const order =
      await cancelMarketplaceOrder(
        orderId,
        userId
      );

    if (!order) {
      return res.status(404).json({
        error:
          "ORDER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      order,
    });
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * CREATE PAYMENT
 * =========================================================
 *
 * POST /api/marketplace/orders/:orderId/payment
 *
 * No amount is accepted from the client.
 *
 * The payment service must derive the authoritative amount
 * from the existing marketplace order.
 *
 * Creating a payment does NOT grant parcel ownership.
 *
 * Ownership may only be granted after authoritative payment
 * confirmation.
 * =========================================================
 */
export async function createMarketplacePaymentController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const orderId =
    getRequiredRouteParam(
      req.params.orderId
    );

  if (!orderId) {
    return res.status(400).json({
      error:
        "ORDER_ID_REQUIRED",
    });
  }

  try {
    const payment =
      await createMarketplacePayment(
        orderId,
        userId
      );

    return res.status(201).json({
      payment,
    });
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * GET PAYMENT
 * =========================================================
 *
 * GET /api/marketplace/payments/:paymentId
 *
 * A user may only retrieve a payment associated with their
 * own marketplace order/payment record.
 * =========================================================
 */
export async function getMarketplacePaymentController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const paymentId =
    getRequiredRouteParam(
      req.params.paymentId
    );

  if (!paymentId) {
    return res.status(400).json({
      error:
        "PAYMENT_ID_REQUIRED",
    });
  }

  try {
    const payment =
      await getMarketplacePaymentById(
        paymentId,
        userId
      );

    if (!payment) {
      return res.status(404).json({
        error:
          "PAYMENT_NOT_FOUND",
      });
    }

    return res.status(200).json({
      payment,
    });
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * TEST PAYMENT SUCCESS
 * =========================================================
 *
 * POST /api/marketplace/test/payments/:paymentId/confirm
 *
 * TEST/SANDBOX ONLY.
 *
 * The service is responsible for:
 *
 *   payment confirmation
 *          ↓
 *   order transition
 *          ↓
 *   entitlement creation
 *          ↓
 *   ownership transfer
 *
 * The controller does not perform any of those operations
 * directly.
 *
 * IMPORTANT:
 *
 * The route itself must also be protected at the routing /
 * application layer so these test endpoints cannot be
 * accidentally exposed in a production payment environment.
 * =========================================================
 */
export async function confirmTestPaymentController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const paymentId =
    getRequiredRouteParam(
      req.params.paymentId
    );

  if (!paymentId) {
    return res.status(400).json({
      error:
        "PAYMENT_ID_REQUIRED",
    });
  }

  try {
    const result =
      await confirmTestMarketplacePayment(
        paymentId,
        userId
      );

    return res.status(200).json(
      result
    );
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * TEST PAYMENT FAILURE
 * =========================================================
 *
 * POST /api/marketplace/test/payments/:paymentId/fail
 *
 * TEST/SANDBOX ONLY.
 *
 * A failed payment must never grant parcel ownership.
 * =========================================================
 */
export async function failTestPaymentController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const paymentId =
    getRequiredRouteParam(
      req.params.paymentId
    );

  if (!paymentId) {
    return res.status(400).json({
      error:
        "PAYMENT_ID_REQUIRED",
    });
  }

  try {
    const result =
      await failTestMarketplacePayment(
        paymentId,
        userId
      );

    return res.status(200).json(
      result
    );
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}

/**
 * =========================================================
 * TEST PAYMENT CANCELLATION
 * =========================================================
 *
 * POST /api/marketplace/test/payments/:paymentId/cancel
 *
 * TEST/SANDBOX ONLY.
 *
 * A cancelled payment must never grant parcel ownership.
 * =========================================================
 */
export async function cancelTestPaymentController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error:
        "AUTHENTICATION_REQUIRED",
    });
  }

  const paymentId =
    getRequiredRouteParam(
      req.params.paymentId
    );

  if (!paymentId) {
    return res.status(400).json({
      error:
        "PAYMENT_ID_REQUIRED",
    });
  }

  try {
    const result =
      await cancelTestMarketplacePayment(
        paymentId,
        userId
      );

    return res.status(200).json(
      result
    );
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}
