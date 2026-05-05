import { AuthResult, RegisterInput } from "../../../domain/entities/Auth";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { AppError } from "../../../shared/errors/AppError";
import { AuthTokenService, PasswordHasher } from "./auth.ports";
import {
  assertValidEmail,
  assertValidPassword,
  buildAuthResult,
  normalizeEmail,
} from "./auth.common";

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AuthTokenService
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    const email = normalizeEmail(typeof input.email === "string" ? input.email : "");
    const password = typeof input.password === "string" ? input.password : "";

    assertValidEmail(email);
    assertValidPassword(password);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Email is already registered.", 409);
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.userRepository.create({
      email,
      passwordHash,
    });

    return buildAuthResult(user, this.refreshTokenRepository, this.tokenService);
  }
}
