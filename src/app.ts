import express from "express";
import path from "path";
import router from "./routes";
import { errorHandler, observabilityMiddleware } from "@/middlewares";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Enable trust proxy for reverse proxy
app.set("trust proxy", 1);

// Parse JSON and urlencoded request bodies (50mb limit for browser background images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(observabilityMiddleware);

// Helmet — relax CSP so that the OBS display pages can use inline scripts/styles
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(morgan("dev"));

// Serve static files from public/ (dock.html, display.html, display_bottom.html)
app.use(express.static(path.resolve(__dirname, "..", "public")));

// Connect routes
app.use(router);

app.use(errorHandler);

export default app;
