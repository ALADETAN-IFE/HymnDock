import { Router } from "express";
import { healthRoutes } from "./health";
import V1Routes from "./v1";

const router = Router();

// Versioned routes: /api/v1/hymn, /api/v1/state
router.use("/v1", V1Routes);
router.use("/health", healthRoutes);

export default router;
