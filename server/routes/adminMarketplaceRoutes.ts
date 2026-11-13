import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { activatePrimaryInventoryController } from "../controllers/adminPrimaryInventoryController.js";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.post(
  "/primary-inventory/:parcelId/activate",
  activatePrimaryInventoryController
);

export default router;
