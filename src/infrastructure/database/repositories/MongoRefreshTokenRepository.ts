import { Collection } from "mongodb";
import { CreateRefreshTokenInput, RefreshTokenSession } from "../../../domain/entities/Auth";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { getMongoDatabase, getNextSequence } from "../../config/mongo";

type RefreshTokenDocument = RefreshTokenSession;

function mapRefreshToken(row: RefreshTokenDocument): RefreshTokenSession {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt,
    replacedByTokenHash: row.replacedByTokenHash,
  };
}

export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  private collection(): Collection<RefreshTokenDocument> {
    return getMongoDatabase().collection<RefreshTokenDocument>("refresh_tokens");
  }

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenSession> {
    const id = await getNextSequence("refresh_tokens");
    const nowIso = new Date().toISOString();

    const row: RefreshTokenDocument = {
      id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: nowIso,
      revokedAt: null,
      replacedByTokenHash: null,
    };

    await this.collection().insertOne(row);
    return row;
  }

  async findActiveByTokenHash(tokenHash: string): Promise<RefreshTokenSession | undefined> {
    const nowIso = new Date().toISOString();

    const row = await this.collection().findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: nowIso },
    });

    return row ? mapRefreshToken(row) : undefined;
  }

  async revokeByTokenHash(
    tokenHash: string,
    revokedAt: string,
    replacedByTokenHash?: string
  ): Promise<void> {
    const setPayload: Partial<RefreshTokenDocument> = { revokedAt };
    if (replacedByTokenHash) {
      setPayload.replacedByTokenHash = replacedByTokenHash;
    }

    await this.collection().updateOne(
      {
        tokenHash,
        revokedAt: null,
      },
      {
        $set: setPayload,
      }
    );
  }

  async revokeAllByUserId(userId: number, revokedAt: string): Promise<void> {
    await this.collection().updateMany(
      {
        userId,
        revokedAt: null,
      },
      {
        $set: { revokedAt },
      }
    );
  }
}
