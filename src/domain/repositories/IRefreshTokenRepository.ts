import { CreateRefreshTokenInput, RefreshTokenSession } from "../entities/Auth";

export interface IRefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenSession>;
  findActiveByTokenHash(tokenHash: string): Promise<RefreshTokenSession | undefined>;
  revokeByTokenHash(
    tokenHash: string,
    revokedAt: string,
    replacedByTokenHash?: string
  ): Promise<void>;
  revokeAllByUserId(userId: number, revokedAt: string): Promise<void>;
}
