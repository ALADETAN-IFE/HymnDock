import { Router } from "express";
import { healthRoutes } from "./health";
import { hymnRoutes } from "./hymn";
import { stateRoutes } from "./state";

const router = Router();

router.use("/health", healthRoutes);
router.use("/hymn", hymnRoutes);
router.use("/state", stateRoutes);

export default router;
