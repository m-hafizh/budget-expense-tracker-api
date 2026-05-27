import { Db, MongoClient } from "mongodb";
import { BudgetPeriod } from "../../domain/entities/Budget";
import { Category } from "../../domain/entities/Transaction";

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017";
const DEFAULT_MONGODB_DB_NAME = "budget_expense_tracker";

interface CounterDocument {
  _id: string;
  seq: number;
}

interface BudgetLimitDocument {
  userId?: number | null;
  period: BudgetPeriod;
  category: Category;
  limit_amount: number;
}

interface TransactionDocument {
  userId?: number | null;
  type: "income" | "expense";
  date: string;
  category: Category | null;
  amount: number;
}

interface UserDocument {
  id: number;
  email: string;
}

interface RefreshTokenDocument {
  id: number;
  tokenHash: string;
  userId: number;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  replacedByTokenHash: string | null;
}

let client: MongoClient | null = null;
let database: Db | null = null;

function unwrapQuotedEnvValue(value: string): { value: string; hadWrappingQuotes: boolean } {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    const isDoubleQuoted = first === '"' && last === '"';
    const isSingleQuoted = first === "'" && last === "'";

    if (isDoubleQuoted || isSingleQuoted) {
      return { value: value.slice(1, -1).trim(), hadWrappingQuotes: true };
    }
  }

  return { value, hadWrappingQuotes: false };
}

function validateMongoUri(uri: string): void {
  if (!uri) {
    throw new Error(
      "[mongo] MONGODB_URI is empty. Set a valid MongoDB connection string."
    );
  }

  if (uri.includes("<") || uri.includes(">")) {
    throw new Error(
      "[mongo] MONGODB_URI looks like a placeholder. Replace it with a real connection string."
    );
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error(
      '[mongo] Invalid MONGODB_URI scheme. Expected "mongodb://" or "mongodb+srv://".'
    );
  }
}

function getMongoUri(): string {
  const rawUri = process.env.MONGODB_URI?.trim();

  if (!rawUri) {
    return DEFAULT_MONGODB_URI;
  }

  const { value: normalizedUri, hadWrappingQuotes } = unwrapQuotedEnvValue(rawUri);

  if (hadWrappingQuotes) {
    console.warn("[mongo] MONGODB_URI had wrapping quotes; using the unquoted value.");
  }

  validateMongoUri(normalizedUri);
  return normalizedUri;
}

function getMongoDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || DEFAULT_MONGODB_DB_NAME;
}

async function safeListIndexes(collection: { indexes: () => Promise<Array<{ name?: string }>> }): Promise<Array<{ name?: string }>> {
  try {
    return await collection.indexes();
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: number }).code
        : undefined;

    // Fresh Mongo databases may not have the namespace yet.
    if (code === 26) {
      return [];
    }

    throw error;
  }
}

async function ensureMongoIndexesAndSeed(db: Db): Promise<void> {
  const transactions = db.collection<TransactionDocument>("transactions");
  await transactions.createIndex({ id: 1 }, { unique: true });
  await transactions.createIndex({ date: -1, id: -1 });
  await transactions.createIndex({ userId: 1, date: -1, id: -1 });
  await transactions.createIndex({ userId: 1, type: 1, date: 1 });

  const budgetLimits = db.collection<BudgetLimitDocument>("budget_limits");

  const budgetLimitIndexes = await safeListIndexes(budgetLimits);
  const legacyBudgetUniqueIndex = budgetLimitIndexes.find(
    (index) => index.name === "period_1_category_1"
  );

  if (legacyBudgetUniqueIndex?.name) {
    await budgetLimits.dropIndex(legacyBudgetUniqueIndex.name);
  }

  await budgetLimits.createIndex(
    { userId: 1, period: 1, category: 1 },
    {
      unique: true,
      partialFilterExpression: { userId: { $type: "number" } },
    }
  );
  await budgetLimits.createIndex({ userId: 1, period: 1 });

  const users = db.collection<UserDocument>("users");
  await users.createIndex({ id: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });

  const refreshTokens = db.collection<RefreshTokenDocument>("refresh_tokens");
  await refreshTokens.createIndex({ id: 1 }, { unique: true });
  await refreshTokens.createIndex({ tokenHash: 1 }, { unique: true });
  await refreshTokens.createIndex({ userId: 1, revokedAt: 1 });
  await refreshTokens.createIndex({ expiresAt: 1 });
}

export async function initMongoDatabase(): Promise<Db> {
  if (database) return database;

  const mongoUri = getMongoUri();

  try {
    client = new MongoClient(mongoUri);
    await client.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error";
    throw new Error(
      `[mongo] Failed to initialize MongoDB connection. Check MONGODB_URI format and credentials. ${message}`
    );
  }

  database = client.db(getMongoDbName());
  await ensureMongoIndexesAndSeed(database);

  console.log(`📂 MongoDB connected: ${getMongoDbName()} @ ${mongoUri}`);
  return database;
}

export function getMongoDatabase(): Db {
  if (!database) {
    throw new Error("MongoDB is not initialised. Call initMongoDatabase() first.");
  }
  return database;
}

export async function closeMongoDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log("MongoDB connection closed.");
  }
}

export async function getNextSequence(sequenceName: string): Promise<number> {
  const counters = getMongoDatabase().collection<CounterDocument>("counters");

  const counter = await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return counter?.seq ?? 1;
}
