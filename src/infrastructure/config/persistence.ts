export type DatabaseProvider = "sqlite" | "mongodb";

const DEFAULT_PROVIDER: DatabaseProvider = process.env.VERCEL ? "mongodb" : "sqlite";

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
    const { initMongoDatabase } = await import("./mongo");
    await initMongoDatabase();
  } else {
    const { getDatabase } = await import("./sqlite3");
    getDatabase();
  }

  activeProvider = provider;
  return provider;
}

export async function closePersistence(): Promise<void> {
  const provider = activeProvider ?? getDatabaseProvider();

  if (provider === "mongodb") {
    const { closeMongoDatabase } = await import("./mongo");
    await closeMongoDatabase();
    return;
  }

  const { closeDatabase } = await import("./sqlite3");
  closeDatabase();
}
