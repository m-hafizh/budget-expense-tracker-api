import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";
import { BudgetCheckInput, BudgetStatus } from "../../../domain/entities/Budget";
import { getLimit, getRange } from "./budget.common";

export class CheckBudgetUseCase {
  constructor(private readonly repository: IBudgetRepository) {}

  async execute(input: BudgetCheckInput, userId: number): Promise<BudgetStatus> {
    const { start, end } = getRange(input.period);

    const limitAmount = await getLimit(this.repository, input.period, input.category, userId);
    const spentAmount = await this.repository.getCategoryExpenseTotalInRange(
      start,
      end,
      input.category,
      userId
    );
    const remainingAmount = limitAmount - spentAmount;
    const projectedRemaining = remainingAmount - input.plannedAmount;

    return {
      period: input.period,
      category: input.category,
      limitAmount,
      spentAmount,
      remainingAmount,
      plannedAmount: input.plannedAmount,
      canSpend: projectedRemaining >= 0,
      projectedRemaining,
    };
  }
}
