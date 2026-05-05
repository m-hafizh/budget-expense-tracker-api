import { AuthResult, RefreshTokenInput } from "../../../domain/entities/Auth";
import { toPublicUser } from "../../../domain/entities/User";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { AuthTokenService } from "./auth.ports";
import { toAuthenticatedUser } from "./auth.common";

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: AuthTokenService
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthResult> {
    const refreshToken =
      typeof input.refreshToken === "string" ? input.refreshToken.trim() : "";

    if (!refreshToken) {
      throw new AppError("refreshToken is required.", 400);
    }

    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const existingSession = await this.refreshTokenRepository.findActiveByTokenHash(refreshTokenHash);

    if (!existingSession) {
      throw new AppError("Invalid refresh token.", 401);
    }

    const user = await this.userRepository.findById(existingSession.userId);
    if (!user) {
      await this.refreshTokenRepository.revokeByTokenHash(
        refreshTokenHash,
        new Date().toISOString()
      );
      throw new AppError("Invalid refresh token.", 401);
    }

    const nextRefreshToken = this.tokenService.generateRefreshToken();
    const nextRefreshTokenHash = this.tokenService.hashRefreshToken(nextRefreshToken);

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: nextRefreshTokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });

    await this.refreshTokenRepository.revokeByTokenHash(
      refreshTokenHash,
      new Date().toISOString(),
      nextRefreshTokenHash
    );

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken: this.tokenService.createAccessToken(toAuthenticatedUser(user)),
        refreshToken: nextRefreshToken,
        tokenType: "Bearer",
        expiresInSeconds: this.tokenService.getAccessTokenExpiresInSeconds(),
      },
    };
  }
}
