import { getDatabase } from "../../config/sqlite3";
import { Category, TransactionType } from "../../../domain/entities/Transaction";
import { IAwarenessRepository } from "../../../domain/repositories/IAwarenessRepository";

export class SqliteAwarenessRepository implements IAwarenessRepository {
  async getTotalByTypeInRange(
    type: TransactionType,
    start: string,
    end: string,
    userId: number
  ): Promise<number> {
    const db = getDatabase();

    const row = db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = ?
          AND type = ?
          AND date >= ?
          AND date <= ?
      `)
      .get(userId, type, start, end) as { total: number };

    return row.total;
  }

  async getTopExpenseCategoryInRange(
    start: string,
    end: string,
    userId: number
  ): Promise<{ category: Category | null; amount: number }> {
    const db = getDatabase();

    const row = db
      .prepare(`
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE user_id = ?
          AND type = 'expense'
          AND category IS NOT NULL
          AND date >= ?
          AND date <= ?
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
      `)
      .get(userId, start, end) as { category: Category; total: number } | undefined;

    if (!row) {
      return { category: null, amount: 0 };
    }

    return { category: row.category, amount: row.total };
  }
}
