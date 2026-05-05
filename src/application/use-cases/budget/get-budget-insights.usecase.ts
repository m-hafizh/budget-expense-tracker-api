import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";
import { BudgetInsights, BudgetPeriod } from "../../../domain/entities/Budget";
import { GetBudgetOverviewUseCase } from "./get-budget-overview.usecase";
import { toTitleCase } from "./budget.common";

export class GetBudgetInsightsUseCase {
  constructor(private readonly repository: IBudgetRepository) {}

  async execute(period: BudgetPeriod, userId: number): Promise<BudgetInsights> {
    const overview = await new GetBudgetOverviewUseCase(this.repository).execute(period, userId);

    const categories = overview.limits.map((item) => {
      const isWarning = item.remainingAmount < 0;
      const isLimitReached = item.remainingAmount === 0;

      const indicator: "" | "⚠️" | "✅" = isWarning ? "⚠️" : isLimitReached ? "✅" : "";
      const status: "ok" | "warning" | "limit-reached" = isWarning
        ? "warning"
        : isLimitReached
          ? "limit-reached"
          : "ok";

      return {
        category: item.category,
        spentAmount: item.spentAmount,
        limitAmount: item.limitAmount,
        remainingAmount: item.remainingAmount,
        status,
        indicator,
        line: `${toTitleCase(item.category)}: ${item.spentAmount} / ${item.limitAmount}${
          indicator ? ` ${indicator}` : ""
        }`,
      };
    });

    return {
      period: overview.period,
      rangeStart: overview.rangeStart,
      rangeEnd: overview.rangeEnd,
      categories,
    };
  }
}
