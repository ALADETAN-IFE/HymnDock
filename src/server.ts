import app from "./app";
import { ENV } from "./config";
import { logger } from "@/utils";
import { findHymnUrl, parseHymn } from "./modules/v1/hymn/hymn.parser";

const PORT = ENV.PORT || 3000;
const baseUrl = ENV.DOMAIN ? `https://${ENV.DOMAIN}` : `http://localhost:${PORT}`;

const keepaliveInterval = 14 * 60 * 1000;

const startServer = async () => {
  app.listen(PORT, () => {
    setInterval(() => {
      void fetch(`${baseUrl}/api/health`)
        .then(() => logger.info("[keepalive] ping sent"))
        .catch(() => logger.warn("[keepalive] ping failed"));
    }, keepaliveInterval);
    logger.info("Server", `Server is running on port ${PORT}`);

    // Optional background warmup: WARMUP_HYMNS can be a comma-separated list
    // of numbers or ranges (e.g. "1,2,10-15"). These will be fetched and
    // parsed into the SQLite cache in the background.
    const raw = process.env.WARMUP_HYMNS;
    if (raw) {
      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const nums: number[] = [];
      for (const p of parts) {
        if (p.includes("-")) {
          const [a, b] = p.split("-").map((x) => parseInt(x.trim(), 10));
          if (!isNaN(a) && !isNaN(b)) {
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) nums.push(i);
          }
        } else {
          const n = parseInt(p, 10);
          if (!isNaN(n)) nums.push(n);
        }
      }

      if (nums.length > 0) {
        logger.info("Warmup", `Warming ${nums.length} hymns in background...`);
        for (const n of nums) {
          void findHymnUrl(n)
            .then((url) => {
              if (!url) return null;
              return parseHymn(url);
            })
            .catch((err) => logger.warn("Warmup", `Warmup failed for ${n}: ${err}`));
        }
      }
    }
  });
};

startServer().catch((error) => {
  logger.error("Server", "Failed to start server", error as Error);
  process.exit(1);
});
