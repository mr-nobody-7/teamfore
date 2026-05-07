import "dotenv/config";
import { app } from "./app.js";
import { startSlackDigestCron } from "./integrations/slack/slack.digest.js";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  startSlackDigestCron();
});

server.on("error", (error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  process.exit(1);
});
