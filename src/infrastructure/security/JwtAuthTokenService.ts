import { createHash, randomBytes } from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedUser } from "../../domain/entities/Auth";
import { AppError } from "../../shared/errors/AppError";
import { AuthTokenService } from "../../application/use-cases/auth/auth.ports";
import { getAuthConfig } from "../config/auth";

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  typ: "access";
}

export class JwtAuthTokenService implements AuthTokenService {
  private readonly config = getAuthConfig();

  createAccessToken(user: AuthenticatedUser): string {
    return jwt.sign({ email: user.email, typ: "access" }, this.config.jwtAccessSecret, {
      subject: String(user.userId),
      expiresIn: `${this.config.accessTokenTtlMinutes}m`,
    });
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    try {
      const decoded = jwt.verify(token, this.config.jwtAccessSecret);
      if (typeof decoded === "string") {
        throw new AppError("Invalid or expired access token.", 401);
      }

      const payload = decoded as AccessTokenPayload;
      if (payload.typ !== "access" || typeof payload.sub !== "string") {
        throw new AppError("Invalid or expired access token.", 401);
      }

      if (typeof payload.email !== "string" || !payload.email) {
        throw new AppError("Invalid or expired access token.", 401);
      }

      const userId = Number.parseInt(payload.sub, 10);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError("Invalid or expired access token.", 401);
      }

      return {
        userId,
        email: payload.email,
      };
    } catch {
      throw new AppError("Invalid or expired access token.", 401);
    }
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  getRefreshTokenExpiresAt(fromDate = new Date()): string {
    const expiresAt = new Date(
      fromDate.getTime() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000
    );

    return expiresAt.toISOString();
  }

  getAccessTokenExpiresInSeconds(): number {
    return this.config.accessTokenTtlMinutes * 60;
  }
}
