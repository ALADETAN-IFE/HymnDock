import { Router } from "express";
import { hymnRoutes } from "./hymn";
import { stateRoutes } from "./state";

const router = Router();

router.use("/hymn", hymnRoutes);
router.use("/state", stateRoutes);

export default router;
