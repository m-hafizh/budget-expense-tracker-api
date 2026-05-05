import { AuthenticatedUser } from "../../../domain/entities/Auth";

export interface PasswordHasher {
  hash(plainTextPassword: string): Promise<string>;
  verify(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
}

export interface AuthTokenService {
  createAccessToken(user: AuthenticatedUser): string;
  verifyAccessToken(token: string): AuthenticatedUser;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
  getRefreshTokenExpiresAt(fromDate?: Date): string;
  getAccessTokenExpiresInSeconds(): number;
}
