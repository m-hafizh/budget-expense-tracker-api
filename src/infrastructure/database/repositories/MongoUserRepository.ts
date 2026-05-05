import { Collection } from "mongodb";
import { CreateUserInput, User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { getMongoDatabase, getNextSequence } from "../../config/mongo";

type UserDocument = User;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapUser(row: UserDocument): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class MongoUserRepository implements IUserRepository {
  private collection(): Collection<UserDocument> {
    return getMongoDatabase().collection<UserDocument>("users");
  }

  async create(input: CreateUserInput): Promise<User> {
    const id = await getNextSequence("users");
    const nowIso = new Date().toISOString();

    const user: UserDocument = {
      id,
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await this.collection().insertOne(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const row = await this.collection().findOne({ email: normalizeEmail(email) });
    return row ? mapUser(row) : undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    const row = await this.collection().findOne({ id });
    return row ? mapUser(row) : undefined;
  }
}
