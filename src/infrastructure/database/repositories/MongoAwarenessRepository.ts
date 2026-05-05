import { Collection } from "mongodb";
import { Category, TransactionType } from "../../../domain/entities/Transaction";
import { IAwarenessRepository } from "../../../domain/repositories/IAwarenessRepository";
import { getMongoDatabase } from "../../config/mongo";

interface TransactionDocument {
  userId?: number | null;
  type: TransactionType;
  date: string;
  category: Category | null;
  amount: number;
}

export class MongoAwarenessRepository implements IAwarenessRepository {
  private transactions(): Collection<TransactionDocument> {
    return getMongoDatabase().collection<TransactionDocument>("transactions");
  }

  async getTotalByTypeInRange(
    type: TransactionType,
    start: string,
    end: string,
    userId: number
  ): Promise<number> {
    const rows = await this.transactions()
      .aggregate<{ total: number }>([
        {
          $match: {
            userId,
            type,
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

  async getTopExpenseCategoryInRange(
    start: string,
    end: string,
    userId: number
  ): Promise<{ category: Category | null; amount: number }> {
    const rows = await this.transactions()
      .aggregate<{ category: Category; amount: number }>([
        {
          $match: {
            userId,
            type: "expense",
            category: { $ne: null },
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            category: "$_id",
            amount: "$total",
          },
        },
      ])
      .toArray();

    if (rows.length === 0) {
      return { category: null, amount: 0 };
    }

    return rows[0];
  }
}
