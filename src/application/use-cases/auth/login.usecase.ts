import { AuthResult, LoginInput } from "../../../domain/entities/Auth";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { AuthTokenService, PasswordHasher } from "./auth.ports";
import {
  assertValidEmail,
  assertValidPassword,
  buildAuthResult,
  normalizeEmail,
} from "./auth.common";

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AuthTokenService
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    const email = normalizeEmail(typeof input.email === "string" ? input.email : "");
    const password = typeof input.password === "string" ? input.password : "";

    assertValidEmail(email);
    assertValidPassword(password);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isValidPassword = await this.passwordHasher.verify(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid email or password.", 401);
    }

    return buildAuthResult(user, this.refreshTokenRepository, this.tokenService);
  }
}
