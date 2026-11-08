import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  createCyphFundingPresetController,
  grantCyphFundingController,
  listCyphFundingPresetsController,
  updateCyphFundingPresetController,
} from "../controllers/adminCyphController.js";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get("/presets", listCyphFundingPresetsController);
router.post("/presets", createCyphFundingPresetController);
router.patch("/presets/:presetId", updateCyphFundingPresetController);
router.post("/funding", grantCyphFundingController);

export default router;
