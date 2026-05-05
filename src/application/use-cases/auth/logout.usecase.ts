import { LogoutInput } from "../../../domain/entities/Auth";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { AuthTokenService } from "./auth.ports";

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: AuthTokenService
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const refreshToken =
      typeof input.refreshToken === "string" ? input.refreshToken.trim() : "";

    if (!refreshToken) {
      return;
    }

    await this.refreshTokenRepository.revokeByTokenHash(
      this.tokenService.hashRefreshToken(refreshToken),
      new Date().toISOString()
    );
  }
}
