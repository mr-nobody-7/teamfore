import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const MAX_DRIFT_SECONDS = 300;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function verifySlackSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.header("x-slack-signature");
  const timestamp = req.header("x-slack-request-timestamp");

  if (!signature || !timestamp) {
    res.status(401).send("Missing signature headers");
    return;
  }

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > MAX_DRIFT_SECONDS) {
    res.status(401).send("Stale Slack request");
    return;
  }

  const rawBody = req.rawBody ?? "";
  const base = `v0:${timestamp}:${rawBody}`;
  const computed = `v0=${crypto
    .createHmac("sha256", requiredEnv("SLACK_SIGNING_SECRET"))
    .update(base)
    .digest("hex")}`;

  const matches =
    signature.length === computed.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));

  if (!matches) {
    res.status(401).send("Invalid Slack signature");
    return;
  }

  next();
}
