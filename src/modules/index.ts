import { Router } from "express";
import V1Routes from "./v1";

const router = Router();

// Versioned routes: /api/v1/health, /api/v1/hymn, /api/v1/state
router.use("/v1", V1Routes);

export default router;
