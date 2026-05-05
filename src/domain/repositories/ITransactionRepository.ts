import {
  CreateTransactionInput,
  Transaction,
} from "../entities/Transaction";

export interface ITransactionRepository {
  create(input: CreateTransactionInput, userId: number): Promise<Transaction>;
  findAll(userId: number): Promise<Transaction[]>;
  findByDateRange(start: string, end: string, userId: number): Promise<Transaction[]>;
}
