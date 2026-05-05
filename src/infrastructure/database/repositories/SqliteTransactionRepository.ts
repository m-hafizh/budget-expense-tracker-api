import { getDatabase } from "../../config/sqlite3";
import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import {
  CreateTransactionInput,
  Transaction,
} from "../../../domain/entities/Transaction";

export class SqliteTransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput, userId: number): Promise<Transaction> {
    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, date, type, category, amount)
      VALUES (@userId, @date, @type, @category, @amount)
    `);

    const result = stmt.run({
      userId,
      date: input.date,
      type: input.type,
      category: input.category ?? null,
      amount: input.amount,
    });

    return this.findById(result.lastInsertRowid as number)!;
  }

  async findAll(userId: number): Promise<Transaction[]> {
    const db = getDatabase();

    const stmt = db.prepare(
      "SELECT id, date, type, category, amount FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC"
    );
    return stmt.all(userId) as Transaction[];
  }

  async findByDateRange(start: string, end: string, userId: number): Promise<Transaction[]> {
    const db = getDatabase();

    const stmt = db.prepare(
      "SELECT id, date, type, category, amount FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, id DESC"
    );
    return stmt.all(userId, start, end) as Transaction[];
  }

  private findById(id: number): Transaction | undefined {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM transactions WHERE id = ?");
    return stmt.get(id) as Transaction | undefined;
  }
}
