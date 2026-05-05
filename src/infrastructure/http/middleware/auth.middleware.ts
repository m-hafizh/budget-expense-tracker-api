import { NextFunction, Request, Response } from "express";
import "../../../types";
import { getAuthTokenService } from "../../../main/container";
import { AppError } from "../../../shared/errors/AppError";

const authTokenService = getAuthTokenService();

function getBearerToken(req: Request): string | null {
  const rawAuthorization = req.get("authorization");
  if (!rawAuthorization) {
    return null;
  }

  const [scheme, token] = rawAuthorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    req.authUser = authTokenService.verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : "Unauthorized";
    res.status(401).json({ success: false, error: message });
  }
}
