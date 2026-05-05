import { Category } from "./Transaction";

export interface MonthlyTrend {
  currentMonth: string;
  previousMonth: string;
  currentExpenses: number;
  previousExpenses: number;
  difference: number;
  percentageChange: number | null;
  isSpendingMore: boolean;
  message: string;
}

export interface TopSpendingCategory {
  category: Category | null;
  amount: number;
}

export interface SavingsRate {
  percentage: number;
  totalIncome: number;
  totalExpenses: number;
  message: string;
}

export interface MonthlyAwareness {
  trend: MonthlyTrend;
  topSpendingCategory: TopSpendingCategory;
  savingsRate: SavingsRate;
}