import { Request, Response } from "express";
import "../../../types";

export function getAuthUserIdOrRespond(req: Request, res: Response): number | null {
  const userId = req.authUser?.userId;

  if (typeof userId !== "number") {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }

  return userId;
}
