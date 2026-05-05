import { Category } from "./Transaction";

export type BudgetPeriod = "weekly" | "monthly";

export interface BudgetLimit {
  period: BudgetPeriod;
  category: Category;
  limitAmount: number;
}

export interface SetBudgetLimitInput {
  period: BudgetPeriod;
  category: Category;
  limitAmount: number;
}

export interface BudgetCheckInput {
  period: BudgetPeriod;
  category: Category;
  plannedAmount: number;
}

export interface BudgetStatus {
  period: BudgetPeriod;
  category: Category;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  plannedAmount: number;
  canSpend: boolean;
  projectedRemaining: number;
}

export interface BudgetOverview {
  period: BudgetPeriod;
  rangeStart: string;
  rangeEnd: string;
  limits: BudgetStatus[];
}

export type InsightStatus = "ok" | "warning" | "limit-reached";

export interface BudgetInsightItem {
  category: Category;
  spentAmount: number;
  limitAmount: number;
  remainingAmount: number;
  status: InsightStatus;
  indicator: "" | "⚠️" | "✅";
  line: string;
}

export interface BudgetInsights {
  period: BudgetPeriod;
  rangeStart: string;
  rangeEnd: string;
  categories: BudgetInsightItem[];
}

export const DEFAULT_BUDGET_LIMITS: Record<Category, number> = {
  needs: 500_000,
  wants: 300_000,
  savings: 200_000,
};