import { getDatabase } from "../../config/sqlite3";
import { BudgetLimit, BudgetPeriod } from "../../../domain/entities/Budget";
import { Category } from "../../../domain/entities/Transaction";
import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";

interface BudgetLimitRow {
  period: BudgetPeriod;
  category: Category;
  limit_amount: number;
}

export class SqliteBudgetRepository implements IBudgetRepository {
  async upsertBudgetLimit(
    period: BudgetPeriod,
    category: Category,
    limitAmount: number,
    userId: number
  ): Promise<void> {
    const db = getDatabase();

    const updateStmt = db.prepare(`
      UPDATE budget_limits
      SET limit_amount = @limitAmount
      WHERE user_id = @userId
        AND period = @period
        AND category = @category
    `);

    const updateResult = updateStmt.run({ userId, period, category, limitAmount });
    if (updateResult.changes > 0) {
      return;
    }

    const insertStmt = db.prepare(`
      INSERT INTO budget_limits (user_id, period, category, limit_amount)
      VALUES (@userId, @period, @category, @limitAmount)
    `);

    insertStmt.run({ userId, period, category, limitAmount });
  }

  async findBudgetLimit(
    period: BudgetPeriod,
    category: Category,
    userId: number
  ): Promise<BudgetLimit | undefined> {
    const db = getDatabase();

    const row = db
      .prepare(
        "SELECT period, category, limit_amount FROM budget_limits WHERE user_id = ? AND period = ? AND category = ?"
      )
      .get(userId, period, category) as BudgetLimitRow | undefined;

    if (!row) return undefined;

    return {
      period: row.period,
      category: row.category,
      limitAmount: row.limit_amount,
    };
  }

  async findBudgetLimitsByPeriod(period: BudgetPeriod, userId: number): Promise<BudgetLimit[]> {
    const db = getDatabase();

    const rows = db
      .prepare(
        "SELECT period, category, limit_amount FROM budget_limits WHERE user_id = ? AND period = ? ORDER BY category"
      )
      .all(userId, period) as BudgetLimitRow[];

    return rows.map((row) => ({
      period: row.period,
      category: row.category,
      limitAmount: row.limit_amount,
    }));
  }

  async getCategoryExpenseTotalInRange(
    start: string,
    end: string,
    category: Category,
    userId: number
  ): Promise<number> {
    const db = getDatabase();

    const row = db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = ?
          AND type = 'expense'
          AND category = ?
          AND date >= ?
          AND date <= ?
      `)
      .get(userId, category, start, end) as { total: number };

    return row.total;
  }
}
