import { apiReference } from "@scalar/express-api-reference";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import passport from "passport";
import { configureGoogleStrategy } from "./auth/strategies/google.strategy.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRateLimit, authRateLimit } from "./middleware/security.js";
import { openApiSpec } from "./openapi.js";
import { auditRoutes } from "./routes/audit.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { availabilityRoutes } from "./routes/availability.routes.js";
import { feedbackRoutes } from "./routes/feedback.routes.js";
import { holidayRoutes } from "./routes/holiday.routes.js";
import { leaveRoutes } from "./routes/leave.routes.js";
import { reportsRoutes } from "./routes/reports.routes.js";
import { settingsRoutes } from "./routes/settings.routes.js";
import { slackRoutes } from "./routes/slack.routes.js";
import { teamRoutes } from "./routes/team.routes.js";
import { userRoutes } from "./routes/user.routes.js";

export const app = express();

configureGoogleStrategy();

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function resolveAllowedOrigins(): string[] {
  const isProduction = process.env.NODE_ENV === "production";
  const fromClientUrl = process.env.CLIENT_URL ?? "";
  const fromClientUrls = process.env.CLIENT_URLS ?? "";

  const configured = `${fromClientUrl},${fromClientUrls}`
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  if (configured.length > 0) {
    return Array.from(new Set(configured));
  }

  if (isProduction) {
    console.warn(
      "[CORS] No CLIENT_URL/CLIENT_URLS configured in production. No browser origins will be allowed.",
    );
    return [];
  }

  return ["http://localhost:3000"];
}

const allowedOrigins = resolveAllowedOrigins();

function shouldCaptureRawBodyUrl(url?: string): boolean {
  return (url ?? "").startsWith("/slack/");
}

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests with no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(apiRateLimit);
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      if (shouldCaptureRawBodyUrl(req.url)) {
        (req as express.Request).rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    verify: (req, _res, buf) => {
      if (shouldCaptureRawBodyUrl(req.url)) {
        (req as express.Request).rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRateLimit, authRoutes);
app.use("/leave", leaveRoutes);
app.use("/availability", availabilityRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/holidays", holidayRoutes);
app.use("/reports", reportsRoutes);
app.use("/settings", settingsRoutes);
app.use("/slack", slackRoutes);
app.use("/teams", teamRoutes);
app.use("/users", userRoutes);
app.use("/audit-logs", auditRoutes);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API running 🚀" });
});

// ── API Docs (development-friendly, not rate-limited) ──────────────────────
app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use(
  "/reference",
  apiReference({
    theme: "purple",
    url: "/openapi.json",
  }),
);

app.use(errorHandler);
