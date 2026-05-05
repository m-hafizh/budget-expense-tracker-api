import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const APP_NAME = "budget-expense-tracker";
const DB_FILENAME = "expense.db";

/**
 * Resolve the OS-specific user data directory.
 *   Linux   → ~/.local/share/<app>
 *   macOS   → ~/Library/Application Support/<app>
 *   Windows → %LOCALAPPDATA%/<app>
 */
function getDataDirectory(): string {
  const home = os.homedir();

  switch (process.platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", APP_NAME);
    case "win32":
      return path.join(process.env.LOCALAPPDATA || path.join(home, "AppData", "Local"), APP_NAME);
    default:
      // Linux / FreeBSD / others — follow XDG spec
      return path.join(process.env.XDG_DATA_HOME || path.join(home, ".local", "share"), APP_NAME);
  }
}

let db: Database.Database;

interface TableInfoRow {
  name: string;
}

function getTableColumns(db: Database.Database, tableName: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as TableInfoRow[];
  return rows.map((row) => row.name);
}

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  return getTableColumns(db, tableName).includes(columnName);
}

function migrateBudgetLimitsForUserOwnership(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS budget_limits_legacy;

    ALTER TABLE budget_limits RENAME TO budget_limits_legacy;

    CREATE TABLE budget_limits (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER,
      period       TEXT    NOT NULL CHECK (period IN ('weekly', 'monthly')),
      category     TEXT    NOT NULL CHECK (category IN ('needs', 'wants', 'savings')),
      limit_amount REAL    NOT NULL CHECK (limit_amount > 0),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO budget_limits (user_id, period, category, limit_amount)
    SELECT NULL, period, category, limit_amount
    FROM budget_limits_legacy;

    DROP TABLE budget_limits_legacy;
  `);
}

function runSchemaMigrations(db: Database.Database): void {
  if (!hasColumn(db, "transactions", "user_id")) {
    db.exec("ALTER TABLE transactions ADD COLUMN user_id INTEGER");
  }

  const budgetLimitColumns = getTableColumns(db, "budget_limits");
  if (budgetLimitColumns.length === 0) {
    return;
  }

  const hasIdColumn = budgetLimitColumns.includes("id");
  const hasUserIdColumn = budgetLimitColumns.includes("user_id");

  if (!hasIdColumn) {
    migrateBudgetLimitsForUserOwnership(db);
    return;
  }

  if (!hasUserIdColumn) {
    db.exec("ALTER TABLE budget_limits ADD COLUMN user_id INTEGER");
  }
}

/**
 * Initialise (or return) the singleton database connection.
 * Creates the data directory and schema on first call.
 */
export function getDatabase(): Database.Database {
  if (db) return db;

  const dir = getDataDirectory();
  fs.mkdirSync(dir, { recursive: true });

  const dbPath = path.join(dir, DB_FILENAME);
  db = new Database(dbPath);

  // Performance pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);

  console.log(`📂 Database path: ${dbPath}`);
  return db;
}

/**
 * Run CREATE TABLE IF NOT EXISTS for every table.
 */
function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      date        TEXT    NOT NULL,
      type        TEXT    NOT NULL CHECK (type IN ('income', 'expense')),
      category    TEXT             CHECK (category IN ('needs', 'wants', 'savings')),
      amount      REAL    NOT NULL CHECK (amount > 0),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budget_limits (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER,
      period       TEXT    NOT NULL CHECK (period IN ('weekly', 'monthly')),
      category     TEXT    NOT NULL CHECK (category IN ('needs', 'wants', 'savings')),
      limit_amount REAL    NOT NULL CHECK (limit_amount > 0),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                 INTEGER NOT NULL,
      token_hash              TEXT    NOT NULL UNIQUE,
      expires_at              TEXT    NOT NULL,
      created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      revoked_at              TEXT,
      replaced_by_token_hash  TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  runSchemaMigrations(db);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date_id ON transactions(user_id, date DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date ON transactions(user_id, type, date);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_limits_user_period_category
      ON budget_limits(user_id, period, category)
      WHERE user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_budget_limits_user_period ON budget_limits(user_id, period);

    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);
  `);
}

/**
 * Gracefully close the database (call on process exit).
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    console.log("Database connection closed.");
  }
}
