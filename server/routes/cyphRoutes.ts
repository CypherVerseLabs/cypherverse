import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  getCyphAccountController,
  getCyphLedgerController,
} from "../controllers/cyphController.js";

const router = Router();

router.use(authenticateToken);

router.get("/account", getCyphAccountController);
router.get("/ledger", getCyphLedgerController);

export default router;
