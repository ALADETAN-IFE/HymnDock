import { Router } from "express";
import V1Routes from "./v1";
import { hymnRoutes } from "./v1/hymn";
import { stateRoutes } from "./v1/state";

const router = Router();

// Versioned routes: /api/v1/health, /api/v1/hymn, /api/v1/state
router.use("/v1", V1Routes);

// Unversioned aliases to match Python server's /api/hymn and /api/state
router.use("/hymn", hymnRoutes);
router.use("/state", stateRoutes);

export default router;
