import { NextFunction, Request, Response } from "express";
import { getAuthConfig } from "../../config/auth";

interface RateLimitEntry {
  count: number;
  resetAtMs: number;
}

const config = getAuthConfig();
const store = new Map<string, RateLimitEntry>();

function getClientKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `${req.path}:${ip}`;
}

function pruneIfNeeded(nowMs: number): void {
  if (store.size < 1000) {
    return;
  }

  for (const [key, entry] of store.entries()) {
    if (entry.resetAtMs <= nowMs) {
      store.delete(key);
    }
  }
}

export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  const nowMs = Date.now();
  pruneIfNeeded(nowMs);

  const key = getClientKey(req);
  const existing = store.get(key);

  if (!existing || existing.resetAtMs <= nowMs) {
    store.set(key, {
      count: 1,
      resetAtMs: nowMs + config.authRateLimitWindowMs,
    });
    next();
    return;
  }

  existing.count += 1;
  store.set(key, existing);

  if (existing.count > config.authRateLimitMax) {
    const retryAfterSeconds = Math.ceil((existing.resetAtMs - nowMs) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts. Please try again later.",
    });
    return;
  }

  next();
}
