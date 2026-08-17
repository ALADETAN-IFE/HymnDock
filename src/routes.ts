import { NextFunction, Request, Response, Router } from "express";
import modulesRouter from "./modules";
import { notFound, rootHandler } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import { routeRegistry } from "./docs";
import path from "path";

const router = Router();

const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

// ── Static HTML pages (mirrors Python's / /dock /display /display_bottom) ──

function serveHtml(filename: string) {
  return (_req: Request, res: Response) => {
    res.sendFile(path.join(PUBLIC_DIR, filename));
  };
}

router.get("/", serveHtml("dock.html"));
router.get("/dock", serveHtml("dock.html"));
router.get("/display", serveHtml("display.html"));
router.get("/display_bottom", serveHtml("display_bottom.html"));
router.get("/display-bottom", serveHtml("display_bottom.html"));

// ── Root API info (only when explicitly navigating to /api) ─────────────────
router.get("/api", rootHandler);

// ── Swagger UI ───────────────────────────────────────────────────────────────
router.use(
  "/api-docs",
  swaggerUi.serve,
  (req: Request, res: Response, next: NextFunction) => {
    const projectName = "HymnDock";
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const spec = routeRegistry.generateOpenAPI(projectName, "1.0.0", baseUrl);
    const options = {
      customSiteTitle: projectName,
    };
    swaggerUi.setup(spec, options)(req, res, next);
  },
);

// ── Versioned API routes ─────────────────────────────────────────────────────
router.use("/api", modulesRouter);

// ── 404 handler — must be last ───────────────────────────────────────────────
router.use(notFound);

export default router;
