import { Request, Response } from "express";
import { getAwarenessUseCases } from "../../../main/container";
import { getAuthUserIdOrRespond } from "./controller-auth.util";

const awarenessUseCases = getAwarenessUseCases();

/**
 * GET /awareness/monthly
 */
export async function handleGetMonthlyAwareness(_req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(_req, res);
  if (userId === null) {
    return;
  }

  try {
    const awareness = await awarenessUseCases.getMonthlyAwareness.execute(userId);
    res.json({ success: true, data: awareness });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}
