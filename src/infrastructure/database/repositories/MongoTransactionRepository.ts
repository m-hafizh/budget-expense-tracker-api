import { Collection } from "mongodb";
import { CreateTransactionInput, Transaction } from "../../../domain/entities/Transaction";
import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import { getMongoDatabase, getNextSequence } from "../../config/mongo";

interface TransactionDocument extends Transaction {
  userId?: number | null;
}

export class MongoTransactionRepository implements ITransactionRepository {
  private collection(): Collection<TransactionDocument> {
    return getMongoDatabase().collection<TransactionDocument>("transactions");
  }

  async create(input: CreateTransactionInput, userId: number): Promise<Transaction> {
    const id = await getNextSequence("transactions");

    const transaction: TransactionDocument = {
      id,
      date: input.date,
      type: input.type,
      category: input.category ?? null,
      amount: input.amount,
      userId,
    };

    await this.collection().insertOne(transaction);
    return transaction;
  }

  async findAll(userId: number): Promise<Transaction[]> {
    const rows = await this.collection()
      .find({ userId })
      .sort({ date: -1, id: -1 })
      .toArray();

    return rows.map(({ id, date, type, category, amount }) => ({ id, date, type, category, amount }));
  }

  async findByDateRange(start: string, end: string, userId: number): Promise<Transaction[]> {
    const rows = await this.collection()
      .find({
        userId,
        date: { $gte: start, $lte: end },
      })
      .sort({ date: -1, id: -1 })
      .toArray();

    return rows.map(({ id, date, type, category, amount }) => ({ id, date, type, category, amount }));
  }
}
