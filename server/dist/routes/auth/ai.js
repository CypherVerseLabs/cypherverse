import express from "express";
import { authenticateToken, } from "../../middleware/authMiddleware.js";
import { generateSceneActions, } from "../../ai/aiService.js";
const router = express.Router();
/* =========================================
   POST /api/ai
========================================= */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { prompt, ideas, } = req.body;
        /* -------------------------------------
           VALIDATE PROMPT
        ------------------------------------- */
        if (typeof prompt !== "string" ||
            !prompt.trim()) {
            return res.status(400).json({
                error: "A non-empty prompt is required.",
            });
        }
        /* -------------------------------------
           VALIDATE IDEAS
        ------------------------------------- */
        if (!Array.isArray(ideas)) {
            return res.status(400).json({
                error: "Ideas must be an array.",
            });
        }
        const ideaContext = ideas;
        /* -------------------------------------
           GENERATE ACTIONS
        ------------------------------------- */
        const result = await generateSceneActions(prompt, ideaContext);
        return res.json(result);
    }
    catch (error) {
        console.error("AI scene generation error:", error);
        return res.status(500).json({
            error: "Failed to generate scene actions.",
        });
    }
});
export default router;
