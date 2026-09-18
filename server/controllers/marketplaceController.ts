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
 * Header:
 *
 * Idempotency-Key: unique-client-key
 *
 * IMPORTANT:
 *
 * Price is NEVER accepted from the client.
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
      ? req.body.parcelId
      : "";

  const listingId =
    typeof req.body?.listingId ===
    "string"
      ? req.body.listingId
      : undefined;

  const idempotencyKey =
    typeof req.headers[
      "idempotency-key"
    ] === "string"
      ? req.headers[
          "idempotency-key"
        ]
      : "";

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
    req.params.orderId;

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

    return res.json({
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

    return res.json({
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

  try {
    const order =
      await cancelMarketplaceOrder(
        req.params.orderId,
        userId
      );

    if (!order) {
      return res.status(404).json({
        error:
          "ORDER_NOT_FOUND",
      });
    }

    return res.json({
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

  try {
    const payment =
      await createMarketplacePayment(
        req.params.orderId,
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

  try {
    const payment =
      await getMarketplacePaymentById(
        req.params.paymentId,
        userId
      );

    if (!payment) {
      return res.status(404).json({
        error:
          "PAYMENT_NOT_FOUND",
      });
    }

    return res.json({
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
 * Do not expose this route in a real production payment
 * environment.
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

  try {
    const result =
      await confirmTestMarketplacePayment(
        req.params.paymentId,
        userId
      );

    return res.json(result);
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

  try {
    const result =
      await failTestMarketplacePayment(
        req.params.paymentId,
        userId
      );

    return res.json(result);
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

  try {
    const result =
      await cancelTestMarketplacePayment(
        req.params.paymentId,
        userId
      );

    return res.json(result);
  } catch (error) {
    return sendMarketplaceError(
      res,
      error
    );
  }
}