import { Request, Response } from "express";
import "../../../types";
import { getAuthUseCases } from "../../../main/container";
import { AppError } from "../../../shared/errors/AppError";

const authUseCases = getAuthUseCases();

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sendAuthError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ success: false, error: message });
}

export async function handleAuthRegister(req: Request, res: Response): Promise<void> {
  try {
    const result = await authUseCases.register.execute({
      email: getString(req.body?.email),
      password: getString(req.body?.password),
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    sendAuthError(res, err);
  }
}

export async function handleAuthLogin(req: Request, res: Response): Promise<void> {
  try {
    const result = await authUseCases.login.execute({
      email: getString(req.body?.email),
      password: getString(req.body?.password),
    });

    res.json({ success: true, data: result });
  } catch (err) {
    sendAuthError(res, err);
  }
}

export async function handleAuthRefresh(req: Request, res: Response): Promise<void> {
  try {
    const result = await authUseCases.refreshToken.execute({
      refreshToken: getString(req.body?.refreshToken),
    });

    res.json({ success: true, data: result });
  } catch (err) {
    sendAuthError(res, err);
  }
}

export async function handleAuthLogout(req: Request, res: Response): Promise<void> {
  try {
    await authUseCases.logout.execute({
      refreshToken: getString(req.body?.refreshToken),
    });

    res.json({ success: true });
  } catch (err) {
    sendAuthError(res, err);
  }
}

export async function handleAuthMe(req: Request, res: Response): Promise<void> {
  if (!req.authUser) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const user = await authUseCases.getCurrentUser.execute(req.authUser.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    sendAuthError(res, err);
  }
}
