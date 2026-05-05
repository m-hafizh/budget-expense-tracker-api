import { IAwarenessRepository } from "../../../domain/repositories/IAwarenessRepository";
import { MonthlyAwareness } from "../../../domain/entities/Awareness";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(baseDate: Date): { start: string; end: string } {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

function buildTrendMessage(current: number, previous: number): string {
  if (current > previous) {
    return "You are spending more than last month.";
  }

  if (current < previous) {
    return "Great! You are spending less than last month.";
  }

  return "Your spending is the same as last month.";
}

function buildSavingsRateMessage(rate: number, totalIncome: number): string {
  if (totalIncome <= 0) {
    return "No income recorded this month yet, so savings rate is 0%.";
  }

  if (rate < 0) {
    return "You are spending above income this month.";
  }

  if (rate < 20) {
    return "Savings rate is low; consider reducing non-essential spending.";
  }

  return "Healthy savings rate this month.";
}

export class GetMonthlyAwarenessUseCase {
  constructor(private readonly repository: IAwarenessRepository) {}

  async execute(userId: number): Promise<MonthlyAwareness> {
    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentRange = getMonthRange(now);
    const previousRange = getMonthRange(previousMonthDate);

    const currentExpenses = await this.repository.getTotalByTypeInRange(
      "expense",
      currentRange.start,
      currentRange.end,
      userId
    );
    const previousExpenses = await this.repository.getTotalByTypeInRange(
      "expense",
      previousRange.start,
      previousRange.end,
      userId
    );
    const difference = currentExpenses - previousExpenses;

    const percentageChange =
      previousExpenses === 0 ? null : Number(((difference / previousExpenses) * 100).toFixed(2));

    const totalIncome = await this.repository.getTotalByTypeInRange(
      "income",
      currentRange.start,
      currentRange.end,
      userId
    );
    const totalExpenses = currentExpenses;
    const savingsRateRaw =
      totalIncome <= 0 ? 0 : ((totalIncome - totalExpenses) / totalIncome) * 100;
    const savingsRate = Number(savingsRateRaw.toFixed(2));

    const topSpendingCategory = await this.repository.getTopExpenseCategoryInRange(
      currentRange.start,
      currentRange.end,
      userId
    );

    return {
      trend: {
        currentMonth: formatMonth(now),
        previousMonth: formatMonth(previousMonthDate),
        currentExpenses,
        previousExpenses,
        difference,
        percentageChange,
        isSpendingMore: currentExpenses > previousExpenses,
        message: buildTrendMessage(currentExpenses, previousExpenses),
      },
      topSpendingCategory,
      savingsRate: {
        percentage: savingsRate,
        totalIncome,
        totalExpenses,
        message: buildSavingsRateMessage(savingsRate, totalIncome),
      },
    };
  }
}
