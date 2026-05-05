import { PublicUser } from "./User";

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
}

export interface AuthenticatedUser {
  userId: number;
  email: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface CreateRefreshTokenInput {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}

export interface RefreshTokenSession {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  replacedByTokenHash: string | null;
}
