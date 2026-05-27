import type { IncomingMessage, ServerResponse } from "http";
import app, { ensurePersistenceInitialized } from "../src/main/app";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    await ensurePersistenceInitialized();

    await new Promise<void>((resolve, reject) => {
      const done = (): void => {
        cleanup();
        resolve();
      };

      const fail = (error: unknown): void => {
        cleanup();
        reject(error);
      };

      const cleanup = (): void => {
        res.off("finish", done);
        res.off("close", done);
      };

      res.once("finish", done);
      res.once("close", done);

      app(req as never, res as never, fail as never);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unhandled server error";
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: message }));
      return;
    }

    res.end();
  }
}
