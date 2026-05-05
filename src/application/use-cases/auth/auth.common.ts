import { AuthResult, AuthTokens, AuthenticatedUser } from "../../../domain/entities/Auth";
import { User, toPublicUser } from "../../../domain/entities/User";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { AppError } from "../../../shared/errors/AppError";
import { AuthTokenService } from "./auth.ports";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertValidEmail(email: string): void {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError("A valid email is required.", 400);
  }
}

export function assertValidPassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }
}

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    userId: user.id,
    email: user.email,
  };
}

export async function issueAuthTokensForUser(
  user: User,
  refreshTokenRepository: IRefreshTokenRepository,
  tokenService: AuthTokenService
): Promise<AuthTokens> {
  const refreshToken = tokenService.generateRefreshToken();
  const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);

  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: tokenService.getRefreshTokenExpiresAt(),
  });

  return {
    accessToken: tokenService.createAccessToken(toAuthenticatedUser(user)),
    refreshToken,
    tokenType: "Bearer",
    expiresInSeconds: tokenService.getAccessTokenExpiresInSeconds(),
  };
}

export async function buildAuthResult(
  user: User,
  refreshTokenRepository: IRefreshTokenRepository,
  tokenService: AuthTokenService
): Promise<AuthResult> {
  return {
    user: toPublicUser(user),
    tokens: await issueAuthTokensForUser(user, refreshTokenRepository, tokenService),
  };
}
