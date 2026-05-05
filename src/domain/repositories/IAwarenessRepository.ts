import { Category, TransactionType } from "../entities/Transaction";

export interface IAwarenessRepository {
  getTotalByTypeInRange(
    type: TransactionType,
    start: string,
    end: string,
    userId: number
  ): Promise<number>;
  getTopExpenseCategoryInRange(start: string, end: string, userId: number): Promise<{
    category: Category | null;
    amount: number;
  }>;
}
