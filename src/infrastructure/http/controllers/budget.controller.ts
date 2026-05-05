import { Request, Response } from "express";
import { BudgetPeriod } from "../../../domain/entities/Budget";
import { Category } from "../../../domain/entities/Transaction";
import { getBudgetUseCases } from "../../../main/container";
import { getAuthUserIdOrRespond } from "./controller-auth.util";

const budgetUseCases = getBudgetUseCases();

const VALID_PERIODS: BudgetPeriod[] = ["weekly", "monthly"];
const VALID_CATEGORIES: Category[] = ["needs", "wants", "savings"];

function isPeriod(value: unknown): value is BudgetPeriod {
  return typeof value === "string" && VALID_PERIODS.includes(value as BudgetPeriod);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as Category);
}

/**
 * PUT /budgets/:period
 * body: { category, limitAmount }
 */
export async function handleSetBudgetLimit(req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(req, res);
  if (userId === null) {
    return;
  }

  const rawPeriod = req.params.period;
  const { category, limitAmount } = req.body as {
    category?: unknown;
    limitAmount?: unknown;
  };

  const errors: string[] = [];

  if (typeof rawPeriod !== "string" || !isPeriod(rawPeriod)) {
    errors.push("period must be weekly or monthly");
  }

  if (!isCategory(category)) {
    errors.push("category must be one of: needs, wants, savings");
  }

  if (typeof limitAmount !== "number" || limitAmount <= 0) {
    errors.push("limitAmount must be a number greater than 0");
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  const period = rawPeriod as BudgetPeriod;
  const safeCategory = category as Category;
  const safeLimitAmount = limitAmount as number;

  try {
    await budgetUseCases.setBudgetLimit.execute({
      period,
      category: safeCategory,
      limitAmount: safeLimitAmount,
    }, userId);
    res.json({ success: true, data: { period, category: safeCategory, limitAmount: safeLimitAmount } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /budgets/:period
 */
export async function handleGetBudgetOverview(req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(req, res);
  if (userId === null) {
    return;
  }

  const rawPeriod = req.params.period;

  if (typeof rawPeriod !== "string" || !isPeriod(rawPeriod)) {
    res.status(400).json({ success: false, errors: ["period must be weekly or monthly"] });
    return;
  }

  try {
    const period = rawPeriod as BudgetPeriod;
    const overview = await budgetUseCases.getBudgetOverview.execute(period, userId);
    res.json({ success: true, data: overview });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * POST /budgets/check
 * body: { period, category, plannedAmount }
 */
export async function handleCheckBudget(req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(req, res);
  if (userId === null) {
    return;
  }

  const { period, category, plannedAmount } = req.body as {
    period?: unknown;
    category?: unknown;
    plannedAmount?: unknown;
  };

  const errors: string[] = [];

  if (!isPeriod(period)) {
    errors.push("period must be weekly or monthly");
  }

  if (!isCategory(category)) {
    errors.push("category must be one of: needs, wants, savings");
  }

  if (typeof plannedAmount !== "number" || plannedAmount <= 0) {
    errors.push("plannedAmount must be a number greater than 0");
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  const safePeriod = period as BudgetPeriod;
  const safeCategory = category as Category;
  const safePlannedAmount = plannedAmount as number;

  try {
    const status = await budgetUseCases.checkBudget.execute({
      period: safePeriod,
      category: safeCategory,
      plannedAmount: safePlannedAmount,
    }, userId);
    res.json({
      success: true,
      data: status,
      message: status.canSpend
        ? "✅ You still have budget"
        : "⚠️ Budget exceeded for this category",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /budgets/insights/:period
 */
export async function handleGetBudgetInsights(req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(req, res);
  if (userId === null) {
    return;
  }

  const rawPeriod = req.params.period;

  if (typeof rawPeriod !== "string" || !isPeriod(rawPeriod)) {
    res.status(400).json({ success: false, errors: ["period must be weekly or monthly"] });
    return;
  }

  try {
    const period = rawPeriod as BudgetPeriod;
    const insights = await budgetUseCases.getBudgetInsights.execute(period, userId);
    res.json({ success: true, data: insights });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}
