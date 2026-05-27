import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { initializePersistence } from "../infrastructure/config/persistence";
import { swaggerSpec } from "../infrastructure/config/swagger";
import { registerHttpRoutes } from "../infrastructure/http/routes";

const app = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

registerHttpRoutes(app);

let persistenceInitPromise: Promise<void> | null = null;

export async function ensurePersistenceInitialized(): Promise<void> {
  if (!persistenceInitPromise) {
    persistenceInitPromise = initializePersistence()
      .then(() => undefined)
      .catch((error) => {
        persistenceInitPromise = null;
        throw error;
      });
  }

  await persistenceInitPromise;
}

export default app;
