import {
  Router,
} from "express";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

import {
  createParcelOrderController,
  getMarketplaceOrderController,
  getMarketplaceOrdersController,
  cancelMarketplaceOrderController,

  createMarketplacePaymentController,
  getMarketplacePaymentController,

  confirmTestPaymentController,
  failTestPaymentController,
  cancelTestPaymentController,
} from "../controllers/marketplaceController.js";

/**
 * =========================================================
 * MARKETPLACE ROUTES
 * =========================================================
 */

const router =
  Router();

/**
 * All marketplace routes require authentication.
 */

router.use(
  authenticateToken
);

/**
 * =========================================================
 * ORDERS
 * =========================================================
 */

/**
 * Create parcel purchase order.
 *
 * POST /api/marketplace/orders
 *
 * Required header:
 *
 * Idempotency-Key: <unique-key>
 *
 * Body:
 *
 * {
 *   parcelId: "..."
 * }
 */
router.post(
  "/orders",
  createParcelOrderController
);

/**
 * Get current user's orders.
 *
 * GET /api/marketplace/orders
 */
router.get(
  "/orders",
  getMarketplaceOrdersController
);

/**
 * Get one current-user order.
 *
 * GET /api/marketplace/orders/:orderId
 */
router.get(
  "/orders/:orderId",
  getMarketplaceOrderController
);

/**
 * Cancel unpaid order.
 *
 * POST /api/marketplace/orders/:orderId/cancel
 */
router.post(
  "/orders/:orderId/cancel",
  cancelMarketplaceOrderController
);

/**
 * =========================================================
 * PAYMENTS
 * =========================================================
 */

/**
 * Create payment for an order.
 *
 * POST /api/marketplace/orders/:orderId/payment
 */
router.post(
  "/orders/:orderId/payment",
  createMarketplacePaymentController
);

/**
 * Get payment.
 *
 * GET /api/marketplace/payments/:paymentId
 */
router.get(
  "/payments/:paymentId",
  getMarketplacePaymentController
);

/**
 * =========================================================
 * TEST PAYMENT ROUTES
 * =========================================================
 *
 * IMPORTANT:
 *
 * These routes are intentionally for the TEST payment
 * environment only.
 *
 * Before using real payments, remove these routes or protect
 * them behind an explicit server-side development/test flag.
 */

/**
 * Simulate successful payment.
 *
 * POST /api/marketplace/test/payments/:paymentId/confirm
 */
router.post(
  "/test/payments/:paymentId/confirm",
  confirmTestPaymentController
);

/**
 * Simulate failed payment.
 *
 * POST /api/marketplace/test/payments/:paymentId/fail
 */
router.post(
  "/test/payments/:paymentId/fail",
  failTestPaymentController
);

/**
 * Simulate cancelled payment.
 *
 * POST /api/marketplace/test/payments/:paymentId/cancel
 */
router.post(
  "/test/payments/:paymentId/cancel",
  cancelTestPaymentController
);

export default router;