import { closeDatabase, getDatabase } from "./sqlite3";
import { closeMongoDatabase, initMongoDatabase } from "./mongo";

export type DatabaseProvider = "sqlite" | "mongodb";

const DEFAULT_PROVIDER: DatabaseProvider = "sqlite";

let activeProvider: DatabaseProvider | null = null;

export function getDatabaseProvider(): DatabaseProvider {
  const raw = (process.env.DB_PROVIDER ?? DEFAULT_PROVIDER).trim().toLowerCase();

  if (raw === "sqlite" || raw === "mongodb") {
    return raw;
  }

  console.warn(`[persistence] Unknown DB_PROVIDER=\"${raw}\", falling back to sqlite.`);
  return DEFAULT_PROVIDER;
}

export async function initializePersistence(): Promise<DatabaseProvider> {
  const provider = getDatabaseProvider();

  if (provider === "mongodb") {
    await initMongoDatabase();
  } else {
    getDatabase();
  }

  activeProvider = provider;
  return provider;
}

export async function closePersistence(): Promise<void> {
  const provider = activeProvider ?? getDatabaseProvider();

  if (provider === "mongodb") {
    await closeMongoDatabase();
    return;
  }

  closeDatabase();
}
