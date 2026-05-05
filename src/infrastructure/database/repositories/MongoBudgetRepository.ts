import { Collection } from "mongodb";
import { BudgetLimit, BudgetPeriod } from "../../../domain/entities/Budget";
import { Category } from "../../../domain/entities/Transaction";
import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";
import { getMongoDatabase } from "../../config/mongo";

interface BudgetLimitDocument {
  userId?: number | null;
  period: BudgetPeriod;
  category: Category;
  limit_amount: number;
}

interface TransactionDocument {
  userId?: number | null;
  type: "income" | "expense";
  category: Category | null;
  date: string;
  amount: number;
}

export class MongoBudgetRepository implements IBudgetRepository {
  private budgetLimits(): Collection<BudgetLimitDocument> {
    return getMongoDatabase().collection<BudgetLimitDocument>("budget_limits");
  }

  private transactions(): Collection<TransactionDocument> {
    return getMongoDatabase().collection<TransactionDocument>("transactions");
  }

  async upsertBudgetLimit(
    period: BudgetPeriod,
    category: Category,
    limitAmount: number,
    userId: number
  ): Promise<void> {
    await this.budgetLimits().updateOne(
      { userId, period, category },
      {
        $set: {
          userId,
          period,
          category,
          limit_amount: limitAmount,
        },
      },
      { upsert: true }
    );
  }

  async findBudgetLimit(
    period: BudgetPeriod,
    category: Category,
    userId: number
  ): Promise<BudgetLimit | undefined> {
    const row = await this.budgetLimits().findOne({
      userId,
      period,
      category,
    });

    if (!row) return undefined;

    return {
      period: row.period,
      category: row.category,
      limitAmount: row.limit_amount,
    };
  }

  async findBudgetLimitsByPeriod(period: BudgetPeriod, userId: number): Promise<BudgetLimit[]> {
    const rows = await this.budgetLimits()
      .find({
        userId,
        period,
      })
      .sort({ category: 1 })
      .toArray();

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
    const rows = await this.transactions()
      .aggregate<{ total: number }>([
        {
          $match: {
            userId,
            type: "expense",
            category,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    return rows[0]?.total ?? 0;
  }
}
