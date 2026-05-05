import { BudgetLimit, BudgetPeriod } from "../entities/Budget";
import { Category } from "../entities/Transaction";

export interface IBudgetRepository {
  upsertBudgetLimit(
    period: BudgetPeriod,
    category: Category,
    limitAmount: number,
    userId: number
  ): Promise<void>;
  findBudgetLimit(period: BudgetPeriod, category: Category, userId: number): Promise<BudgetLimit | undefined>;
  findBudgetLimitsByPeriod(period: BudgetPeriod, userId: number): Promise<BudgetLimit[]>;
  getCategoryExpenseTotalInRange(
    start: string,
    end: string,
    category: Category,
    userId: number
  ): Promise<number>;
}
