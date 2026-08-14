import app from "./app";
import { ENV } from "./config";
import { logger } from "@/utils";

const PORT = ENV.PORT || 3000;
const baseUrl = ENV.DOMAIN
      ? `https://${ENV.DOMAIN}`
      : `http://localhost:${PORT}`;

const keepaliveInterval = 14 * 60 * 1000;

const startServer = async () => {
  app.listen(PORT, () => {
    setInterval(
      () => {
        void fetch(`${baseUrl}/health`)
          .then(() => logger.info("[keepalive] ping sent"))
          .catch(() => logger.warn("[keepalive] ping failed"));
      },
      keepaliveInterval,
    );
    logger.info("Server", `Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error("Server", "Failed to start server", error as Error);
  process.exit(1);
});
