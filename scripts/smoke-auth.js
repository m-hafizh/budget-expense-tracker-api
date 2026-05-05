#!/usr/bin/env node

const { spawn } = require("child_process");

const STARTUP_TIMEOUT_MS = 45_000;
const STOP_TIMEOUT_MS = 5_000;
const POLL_INTERVAL_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseProviderArg(argv) {
  const providerIndex = argv.indexOf("--provider");
  if (providerIndex === -1) {
    return "all";
  }

  const value = argv[providerIndex + 1];
  if (!value) {
    throw new Error("Missing value for --provider. Use all | mongodb | sqlite.");
  }

  return value;
}

async function waitForHealth(baseUrl) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.status === 200) {
        return;
      }
      lastError = new Error(`Unexpected health status: ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  const suffix = lastError instanceof Error ? ` Last error: ${lastError.message}` : "";
  throw new Error(
    `Server did not become healthy at ${baseUrl} within ${STARTUP_TIMEOUT_MS}ms.${suffix}`
  );
}

async function request(baseUrl, path, options = {}) {
  const method = options.method || "GET";
  const headers = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return { status: response.status, body };
}

function assert(condition, label, payload) {
  if (condition) {
    return;
  }

  const debug = payload !== undefined ? `\n${JSON.stringify(payload, null, 2)}` : "";
  throw new Error(`Assertion failed: ${label}${debug}`);
}

async function runSmokeFlow(baseUrl, label) {
  const email = `smoke.${label}.${Date.now()}@example.com`;
  const password = "strong-pass-123";

  const health = await request(baseUrl, "/");
  assert(health.status === 200, "health endpoint should be public", health);

  const register = await request(baseUrl, "/auth/register", {
    method: "POST",
    body: { email, password },
  });
  assert(register.status === 201, "register should return 201", register);
  assert(register.body && register.body.success === true, "register success flag", register.body);

  const accessToken = register.body && register.body.data && register.body.data.tokens
    ? register.body.data.tokens.accessToken
    : null;
  const refreshToken = register.body && register.body.data && register.body.data.tokens
    ? register.body.data.tokens.refreshToken
    : null;

  assert(typeof accessToken === "string" && accessToken.length > 10, "register returns access token");
  assert(typeof refreshToken === "string" && refreshToken.length > 10, "register returns refresh token");

  const transactionsNoAuth = await request(baseUrl, "/transactions");
  assert(
    transactionsNoAuth.status === 401,
    "transactions without auth should be rejected",
    transactionsNoAuth
  );

  const me = await request(baseUrl, "/auth/me", { token: accessToken });
  assert(me.status === 200, "auth/me with access token should succeed", me);
  assert(me.body && me.body.data && me.body.data.email === email.toLowerCase(), "auth/me email", me.body);

  const transactionsWithAuth = await request(baseUrl, "/transactions", { token: accessToken });
  assert(transactionsWithAuth.status === 200, "transactions with auth should succeed", transactionsWithAuth);

  // Isolation check: user B must never see user A data.
  const secondUserEmail = `smoke.${label}.isolation.${Date.now()}@example.com`;
  const secondUserRegister = await request(baseUrl, "/auth/register", {
    method: "POST",
    body: { email: secondUserEmail, password },
  });
  assert(secondUserRegister.status === 201, "second user register should return 201", secondUserRegister);

  const secondUserAccessToken = secondUserRegister.body
    && secondUserRegister.body.data
    && secondUserRegister.body.data.tokens
      ? secondUserRegister.body.data.tokens.accessToken
      : null;
  assert(
    typeof secondUserAccessToken === "string" && secondUserAccessToken.length > 10,
    "second user register returns access token"
  );

  const today = new Date().toISOString().split("T")[0];
  const uniqueAmount = Number((123.45 + (Date.now() % 1000) / 1000).toFixed(3));

  const createOwnedTransaction = await request(baseUrl, "/transactions", {
    method: "POST",
    token: accessToken,
    body: {
      date: today,
      type: "expense",
      category: "needs",
      amount: uniqueAmount,
    },
  });
  assert(
    createOwnedTransaction.status === 201,
    "user A should be able to create transaction",
    createOwnedTransaction
  );

  const createdTransactionId = createOwnedTransaction.body
    && createOwnedTransaction.body.data
      ? createOwnedTransaction.body.data.id
      : null;
  assert(createdTransactionId !== null && createdTransactionId !== undefined, "created transaction should have id");

  const listUserA = await request(baseUrl, "/transactions", { token: accessToken });
  assert(listUserA.status === 200, "user A should list transactions", listUserA);
  const listUserAData = listUserA.body && Array.isArray(listUserA.body.data) ? listUserA.body.data : [];
  assert(
    listUserAData.some((row) => row && row.id === createdTransactionId),
    "user A should see own newly created transaction",
    { createdTransactionId, data: listUserAData }
  );

  const listUserB = await request(baseUrl, "/transactions", { token: secondUserAccessToken });
  assert(listUserB.status === 200, "user B should list transactions", listUserB);
  const listUserBData = listUserB.body && Array.isArray(listUserB.body.data) ? listUserB.body.data : [];
  assert(
    !listUserBData.some((row) => row && row.id === createdTransactionId),
    "user B should not see user A transaction",
    { createdTransactionId, data: listUserBData }
  );

  const refresh = await request(baseUrl, "/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  assert(refresh.status === 200, "refresh should succeed", refresh);

  const nextRefreshToken = refresh.body && refresh.body.data && refresh.body.data.tokens
    ? refresh.body.data.tokens.refreshToken
    : null;
  assert(
    typeof nextRefreshToken === "string" && nextRefreshToken.length > 10,
    "refresh returns rotated token",
    refresh.body
  );
  assert(nextRefreshToken !== refreshToken, "refresh token should rotate");

  const oldRefreshAttempt = await request(baseUrl, "/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  assert(oldRefreshAttempt.status === 401, "old refresh token should be invalid", oldRefreshAttempt);

  const logout = await request(baseUrl, "/auth/logout", {
    method: "POST",
    body: { refreshToken: nextRefreshToken },
  });
  assert(logout.status === 200, "logout should succeed", logout);

  const refreshAfterLogout = await request(baseUrl, "/auth/refresh", {
    method: "POST",
    body: { refreshToken: nextRefreshToken },
  });
  assert(
    refreshAfterLogout.status === 401,
    "revoked refresh token should be invalid",
    refreshAfterLogout
  );
}

function waitForExit(child) {
  if (child.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    child.once("exit", () => resolve());
  });
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  const exited = await Promise.race([
    waitForExit(child).then(() => true),
    sleep(STOP_TIMEOUT_MS).then(() => false),
  ]);

  if (!exited) {
    child.kill("SIGKILL");
    await waitForExit(child);
  }
}

async function startServer(provider, port) {
  const baseUrl = `http://localhost:${port}`;

  const child = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DB_PROVIDER: provider,
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  let output = "";
  const appendOutput = (chunk) => {
    output += chunk.toString();
    if (output.length > 20_000) {
      output = output.slice(-20_000);
    }
  };

  child.stdout.on("data", appendOutput);
  child.stderr.on("data", appendOutput);

  const processExited = new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });

  const startupResult = await Promise.race([
    waitForHealth(baseUrl).then(() => ({ ready: true })),
    processExited.then((exitInfo) => ({ ready: false, exitInfo })),
  ]);

  if (!startupResult.ready) {
    const { code, signal } = startupResult.exitInfo;
    throw new Error(
      `Server exited before becoming ready (provider=${provider}, code=${code}, signal=${signal}).\n${output}`
    );
  }

  return { child, baseUrl };
}

async function runProvider(provider, port) {
  const label = `${provider}:${port}`;
  console.log(`[smoke] Starting ${label}`);

  const { child, baseUrl } = await startServer(provider, port);

  try {
    await runSmokeFlow(baseUrl, provider);
    console.log(`[smoke] PASS ${label}`);
  } finally {
    await stopServer(child);
    console.log(`[smoke] Stopped ${label}`);
  }
}

async function main() {
  const provider = parseProviderArg(process.argv.slice(2));

  if (!["all", "mongodb", "sqlite"].includes(provider)) {
    throw new Error(`Invalid provider "${provider}". Use all | mongodb | sqlite.`);
  }

  if (provider === "mongodb") {
    await runProvider("mongodb", 3100);
    return;
  }

  if (provider === "sqlite") {
    await runProvider("sqlite", 3101);
    return;
  }

  await runProvider("mongodb", 3100);
  await runProvider("sqlite", 3101);
}

main()
  .then(() => {
    console.log("[smoke] PASS all requested providers");
  })
  .catch((error) => {
    console.error("[smoke] FAIL", error instanceof Error ? error.message : error);
    process.exit(1);
  });
