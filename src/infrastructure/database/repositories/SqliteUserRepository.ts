import { getDatabase } from "../../config/sqlite3";
import { CreateUserInput, User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class SqliteUserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash)
      VALUES (@email, @passwordHash)
    `);

    const result = stmt.run({
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
    });

    const created = await this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error("Failed to fetch created user.");
    }

    return created;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `);

    const row = stmt.get(normalizeEmail(email)) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `);

    const row = stmt.get(id) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
  }
}
