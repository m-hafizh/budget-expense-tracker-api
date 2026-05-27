import { closePersistence } from "../infrastructure/config/persistence";
import app, { ensurePersistenceInitialized } from "./app";

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  await ensurePersistenceInitialized();
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  await closePersistence();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void bootstrap().catch((err) => {
  console.error("Failed to bootstrap server:", err);
  process.exit(1);
});
