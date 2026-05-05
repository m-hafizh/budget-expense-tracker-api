import { Request, Response } from "express";
import { validateTransaction } from "../../../shared/validation/transaction.validation";
import { getTransactionUseCases } from "../../../main/container";
import { getAuthUserIdOrRespond } from "./controller-auth.util";

const transactionUseCases = getTransactionUseCases();

/**
 * POST /transactions
 */
export async function handleCreateTransaction(req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(req, res);
  if (userId === null) {
    return;
  }

  const { valid, errors } = validateTransaction(req.body);

  if (!valid) {
    res.status(400).json({ success: false, errors });
    return;
  }

  try {
    const transaction = await transactionUseCases.createTransaction.execute(req.body, userId);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /transactions
 */
export async function handleGetAllTransactions(_req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(_req, res);
  if (userId === null) {
    return;
  }

  try {
    const transactions = await transactionUseCases.getAllTransactions.execute(userId);
    res.json({ success: true, data: transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}

/**
 * GET /summary/weekly
 */
export async function handleWeeklySummary(_req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(_req, res);
  if (userId === null) {
    return;
  }

  try {
    const summary = await transactionUseCases.getWeeklySummary.execute(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}
