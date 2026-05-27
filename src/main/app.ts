import "dotenv/config";
import express from "express";
import { initializePersistence } from "../infrastructure/config/persistence";
import { swaggerSpec } from "../infrastructure/config/swagger";
import { registerHttpRoutes } from "../infrastructure/http/routes";

const app = express();

const SWAGGER_UI_CSS_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";
const SWAGGER_UI_BUNDLE_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
const SWAGGER_UI_STANDALONE_PRESET_URL =
  "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js";

function buildSwaggerHtml(): string {
  const serializedSpec = JSON.stringify(swaggerSpec).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Budget Expense Tracker API Docs</title>
    <link rel="stylesheet" href="${SWAGGER_UI_CSS_URL}" />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *::before, *::after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI_BUNDLE_URL}" crossorigin="anonymous"></script>
    <script src="${SWAGGER_UI_STANDALONE_PRESET_URL}" crossorigin="anonymous"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          spec: ${serializedSpec},
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout"
        });
      };
    </script>
  </body>
</html>`;
}

app.use(express.json());
app.get(["/docs", "/docs/"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(buildSwaggerHtml());
});
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
