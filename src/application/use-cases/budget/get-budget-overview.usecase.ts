import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";
import {
  BudgetOverview,
  BudgetPeriod,
  BudgetStatus,
  DEFAULT_BUDGET_LIMITS,
} from "../../../domain/entities/Budget";
import { ALL_CATEGORIES, getRange } from "./budget.common";

export class GetBudgetOverviewUseCase {
  constructor(private readonly repository: IBudgetRepository) {}

  async execute(period: BudgetPeriod, userId: number): Promise<BudgetOverview> {
    const { start, end } = getRange(period);
    const savedLimits = await this.repository.findBudgetLimitsByPeriod(period, userId);
    const limitMap = new Map(savedLimits.map((item) => [item.category, item.limitAmount]));

    const limits: BudgetStatus[] = [];

    for (const category of ALL_CATEGORIES) {
      const limitAmount = limitMap.get(category) ?? DEFAULT_BUDGET_LIMITS[category];
      const spentAmount = await this.repository.getCategoryExpenseTotalInRange(
        start,
        end,
        category,
        userId
      );
      const remainingAmount = limitAmount - spentAmount;

      limits.push({
        period,
        category,
        limitAmount,
        spentAmount,
        remainingAmount,
        plannedAmount: 0,
        canSpend: remainingAmount > 0,
        projectedRemaining: remainingAmount,
      });
    }

    return {
      period,
      rangeStart: start,
      rangeEnd: end,
      limits,
    };
  }
}
