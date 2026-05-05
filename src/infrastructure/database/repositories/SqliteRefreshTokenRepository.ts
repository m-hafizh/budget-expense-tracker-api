import { getDatabase } from "../../config/sqlite3";
import { CreateRefreshTokenInput, RefreshTokenSession } from "../../../domain/entities/Auth";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";

interface RefreshTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
  replaced_by_token_hash: string | null;
}

function mapRefreshToken(row: RefreshTokenRow): RefreshTokenSession {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    replacedByTokenHash: row.replaced_by_token_hash,
  };
}

export class SqliteRefreshTokenRepository implements IRefreshTokenRepository {
  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenSession> {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (@userId, @tokenHash, @expiresAt)
    `);

    const result = stmt.run({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });

    const created = await this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error("Failed to fetch created refresh token session.");
    }

    return created;
  }

  async findActiveByTokenHash(tokenHash: string): Promise<RefreshTokenSession | undefined> {
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    const stmt = db.prepare(`
      SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, replaced_by_token_hash
      FROM refresh_tokens
      WHERE token_hash = ?
        AND revoked_at IS NULL
        AND expires_at > ?
      LIMIT 1
    `);

    const row = stmt.get(tokenHash, nowIso) as RefreshTokenRow | undefined;
    return row ? mapRefreshToken(row) : undefined;
  }

  async revokeByTokenHash(
    tokenHash: string,
    revokedAt: string,
    replacedByTokenHash?: string
  ): Promise<void> {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE refresh_tokens
      SET revoked_at = @revokedAt,
          replaced_by_token_hash = COALESCE(@replacedByTokenHash, replaced_by_token_hash)
      WHERE token_hash = @tokenHash
        AND revoked_at IS NULL
    `);

    stmt.run({
      tokenHash,
      revokedAt,
      replacedByTokenHash: replacedByTokenHash ?? null,
    });
  }

  async revokeAllByUserId(userId: number, revokedAt: string): Promise<void> {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE refresh_tokens
      SET revoked_at = ?
      WHERE user_id = ?
        AND revoked_at IS NULL
    `);

    stmt.run(revokedAt, userId);
  }

  private async findById(id: number): Promise<RefreshTokenSession | undefined> {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, replaced_by_token_hash
      FROM refresh_tokens
      WHERE id = ?
      LIMIT 1
    `);

    const row = stmt.get(id) as RefreshTokenRow | undefined;
    return row ? mapRefreshToken(row) : undefined;
  }
}
