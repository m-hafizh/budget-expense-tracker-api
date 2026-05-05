import { CreateUserInput, User } from "../entities/User";

export interface IUserRepository {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: number): Promise<User | undefined>;
}
