import { PublicUser, toPublicUser } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: number): Promise<PublicUser> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError("A valid userId is required.", 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return toPublicUser(user);
  }
}
