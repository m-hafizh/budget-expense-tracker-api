import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { closePersistence, initializePersistence } from "../infrastructure/config/persistence";
import { swaggerSpec } from "../infrastructure/config/swagger";
import { registerHttpRoutes } from "../infrastructure/http/routes";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

registerHttpRoutes(app);

async function bootstrap(): Promise<void> {
  const provider = await initializePersistence();
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🗄️ Persistence provider: ${provider}`);
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
