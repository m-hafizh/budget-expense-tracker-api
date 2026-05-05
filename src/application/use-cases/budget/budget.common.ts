import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";
import { BudgetPeriod, DEFAULT_BUDGET_LIMITS } from "../../../domain/entities/Budget";
import { Category } from "../../../domain/entities/Transaction";

export const ALL_CATEGORIES: Category[] = ["needs", "wants", "savings"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getRange(period: BudgetPeriod): { start: string; end: string } {
  const now = new Date();

  if (period === "weekly") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start: formatDate(start), end: formatDate(end) };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

export function getLimit(
  repository: IBudgetRepository,
  period: BudgetPeriod,
  category: Category,
  userId: number
): Promise<number> {
  return repository
    .findBudgetLimit(period, category, userId)
    .then((fromDb) => fromDb?.limitAmount ?? DEFAULT_BUDGET_LIMITS[category]);
}

export function toTitleCase(category: Category): string {
  return `${category[0].toUpperCase()}${category.slice(1)}`;
}
