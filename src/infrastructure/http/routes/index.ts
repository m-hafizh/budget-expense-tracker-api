import { Express } from "express";
import {
  handleAuthLogin,
  handleAuthLogout,
  handleAuthMe,
  handleAuthRefresh,
  handleAuthRegister,
} from "../controllers/auth.controller";
import {
  handleCreateTransaction,
  handleGetAllTransactions,
  handleWeeklySummary,
} from "../controllers/transaction.controller";
import {
  handleCheckBudget,
  handleGetBudgetInsights,
  handleGetBudgetOverview,
  handleSetBudgetLimit,
} from "../controllers/budget.controller";
import { handleGetMonthlyAwareness } from "../controllers/awareness.controller";
import { handleExportTransactions } from "../controllers/export.controller";
import { authRateLimit } from "../middleware/auth-rate-limit.middleware";
import { requireAuth } from "../middleware/auth.middleware";

export function registerHttpRoutes(app: Express): void {
  app.get("/", (_req, res) => {
    res.json({ message: "Budget & Expense Tracker API is running 🚀" });
  });

  app.post("/auth/register", authRateLimit, handleAuthRegister);
  app.post("/auth/login", authRateLimit, handleAuthLogin);
  app.post("/auth/refresh", authRateLimit, handleAuthRefresh);
  app.post("/auth/logout", handleAuthLogout);
  app.get("/auth/me", requireAuth, handleAuthMe);

  app.use(requireAuth);

  app.post("/transactions", handleCreateTransaction);
  app.get("/transactions", handleGetAllTransactions);
  app.get("/summary/weekly", handleWeeklySummary);

  app.put("/budgets/:period", handleSetBudgetLimit);
  app.get("/budgets/:period", handleGetBudgetOverview);
  app.post("/budgets/check", handleCheckBudget);
  app.get("/budgets/insights/:period", handleGetBudgetInsights);

  app.get("/awareness/monthly", handleGetMonthlyAwareness);
  app.get("/exports/transactions", handleExportTransactions);
}