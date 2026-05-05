export interface AuthConfig {
  jwtAccessSecret: string;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  authRateLimitWindowMs: number;
  authRateLimitMax: number;
}

const DEFAULT_ACCESS_TOKEN_TTL_MINUTES = 15;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;

let cachedConfig: AuthConfig | null = null;

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`[auth] Invalid ${name}="${raw}". Falling back to ${fallback}.`);
    return fallback;
  }

  return parsed;
}

function resolveJwtAccessSecret(): string {
  const fromEnv = process.env.JWT_ACCESS_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  throw new Error("JWT_ACCESS_SECRET is required. Set it in the environment before starting the API.");
}

export function getAuthConfig(): AuthConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    jwtAccessSecret: resolveJwtAccessSecret(),
    accessTokenTtlMinutes: parsePositiveInt(
      "ACCESS_TOKEN_TTL_MINUTES",
      DEFAULT_ACCESS_TOKEN_TTL_MINUTES
    ),
    refreshTokenTtlDays: parsePositiveInt("REFRESH_TOKEN_TTL_DAYS", DEFAULT_REFRESH_TOKEN_TTL_DAYS),
    authRateLimitWindowMs: parsePositiveInt(
      "AUTH_RATE_LIMIT_WINDOW_MS",
      DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS
    ),
    authRateLimitMax: parsePositiveInt("AUTH_RATE_LIMIT_MAX", DEFAULT_AUTH_RATE_LIMIT_MAX),
  };

  return cachedConfig;
}
