import swaggerJsdoc from "swagger-jsdoc";

const TODAY_DATE_EXAMPLE = new Date().toISOString().split("T")[0];

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Budget Expense Tracker API",
      version: "1.0.0",
      description:
        "Local-first budget & expense tracking API using Express, TypeScript, SQLite, and optional MongoDB with JWT authentication. Business data is user-scoped from bearer auth context; legacy unowned rows are hidden by default (Option A).",
    },
    servers: [{ url: "http://localhost:3001", description: "Local development" }],
    tags: [
      { name: "Health", description: "Service status" },
      { name: "Authentication", description: "Register, login, token refresh, and current user" },
      { name: "Transactions", description: "Create and list the authenticated user's transactions" },
      { name: "Summary", description: "Weekly financial summaries for the authenticated user" },
      {
        name: "Budget Control",
        description: "Set limits and check purchase fit within the authenticated user's budgets",
      },
      {
        name: "Financial Awareness",
        description: "Decision-making insights from the authenticated user's monthly spending patterns",
      },
      { name: "Exports", description: "Download the authenticated user's transactions as CSV or Excel" },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token. Example: Bearer <token>",
        },
      },
      schemas: {
        Transaction: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            date: { type: "string", format: "date", example: TODAY_DATE_EXAMPLE },
            type: { type: "string", enum: ["income", "expense"], example: "expense" },
            category: {
              type: "string",
              nullable: true,
              enum: ["needs", "wants", "savings"],
              example: "needs",
            },
            amount: { type: "number", format: "float", example: 120.5 },
          },
          required: ["id", "date", "type", "amount"],
        },
        CreateTransactionInput: {
          type: "object",
          description:
            "Transaction payload for the authenticated user. userId is resolved from the bearer token and is not accepted in request body.",
          properties: {
            date: { type: "string", format: "date", example: TODAY_DATE_EXAMPLE },
            type: { type: "string", enum: ["income", "expense"], example: "expense" },
            category: {
              type: "string",
              enum: ["needs", "wants", "savings"],
              description: "Required when type is expense",
              example: "needs",
            },
            amount: { type: "number", format: "float", minimum: 0.01, example: 45.5 },
          },
          required: ["date", "type", "amount"],
        },
        RegisterInput: {
          type: "object",
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", format: "password", minLength: 8, example: "strong-pass-123" },
          },
          required: ["email", "password"],
        },
        LoginInput: {
          type: "object",
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", format: "password", example: "strong-pass-123" },
          },
          required: ["email", "password"],
        },
        RefreshTokenInput: {
          type: "object",
          properties: {
            refreshToken: { type: "string", example: "refresh-token-value" },
          },
          required: ["refreshToken"],
        },
        LogoutInput: {
          type: "object",
          properties: {
            refreshToken: { type: "string", example: "refresh-token-value" },
          },
          required: ["refreshToken"],
        },
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            email: { type: "string", format: "email", example: "user@example.com" },
            createdAt: { type: "string", format: "date-time", example: "2026-05-05T12:00:00.000Z" },
          },
          required: ["id", "email", "createdAt"],
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            refreshToken: { type: "string", example: "refresh-token-value" },
            tokenType: { type: "string", enum: ["Bearer"], example: "Bearer" },
            expiresInSeconds: { type: "integer", example: 900 },
          },
          required: ["accessToken", "refreshToken", "tokenType", "expiresInSeconds"],
        },
        AuthResult: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/PublicUser" },
            tokens: { $ref: "#/components/schemas/AuthTokens" },
          },
          required: ["user", "tokens"],
        },
        SuccessAuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/AuthResult" },
          },
          required: ["success", "data"],
        },
        SuccessPublicUserResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/PublicUser" },
          },
          required: ["success", "data"],
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
          },
          required: ["success"],
        },
        WeeklySummary: {
          type: "object",
          properties: {
            weekStart: { type: "string", format: "date", example: "2026-04-20" },
            weekEnd: { type: "string", format: "date", example: "2026-04-26" },
            totalIncome: { type: "number", example: 3000 },
            totalExpenses: { type: "number", example: 450.75 },
            balance: { type: "number", example: 2549.25 },
            categoryBreakdown: {
              type: "object",
              properties: {
                needs: { type: "number", example: 300 },
                wants: { type: "number", example: 100.75 },
                savings: { type: "number", example: 50 },
              },
              required: ["needs", "wants", "savings"],
            },
            transactionCount: { type: "integer", example: 8 },
          },
          required: [
            "weekStart",
            "weekEnd",
            "totalIncome",
            "totalExpenses",
            "balance",
            "categoryBreakdown",
            "transactionCount",
          ],
        },
        SuccessTransactionResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/Transaction" },
          },
          required: ["success", "data"],
        },
        SuccessTransactionsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Transaction" },
            },
          },
          required: ["success", "data"],
        },
        SuccessWeeklySummaryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/WeeklySummary" },
          },
          required: ["success", "data"],
        },
        SetBudgetLimitInput: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["needs", "wants", "savings"],
              example: "needs",
            },
            limitAmount: { type: "number", minimum: 0.01, example: 500000 },
          },
          required: ["category", "limitAmount"],
        },
        BudgetCheckInput: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["weekly", "monthly"], example: "weekly" },
            category: {
              type: "string",
              enum: ["needs", "wants", "savings"],
              example: "wants",
            },
            plannedAmount: { type: "number", minimum: 0.01, example: 75000 },
          },
          required: ["period", "category", "plannedAmount"],
        },
        BudgetStatus: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["weekly", "monthly"], example: "weekly" },
            category: { type: "string", enum: ["needs", "wants", "savings"], example: "needs" },
            limitAmount: { type: "number", example: 500000 },
            spentAmount: { type: "number", example: 320000 },
            remainingAmount: { type: "number", example: 180000 },
            plannedAmount: { type: "number", example: 75000 },
            canSpend: { type: "boolean", example: true },
            projectedRemaining: { type: "number", example: 105000 },
          },
          required: [
            "period",
            "category",
            "limitAmount",
            "spentAmount",
            "remainingAmount",
            "plannedAmount",
            "canSpend",
            "projectedRemaining",
          ],
        },
        BudgetOverview: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["weekly", "monthly"], example: "monthly" },
            rangeStart: { type: "string", format: "date", example: "2026-04-01" },
            rangeEnd: { type: "string", format: "date", example: "2026-04-30" },
            limits: {
              type: "array",
              items: { $ref: "#/components/schemas/BudgetStatus" },
            },
          },
          required: ["period", "rangeStart", "rangeEnd", "limits"],
        },
        SuccessBudgetStatusResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/BudgetStatus" },
            message: { type: "string", example: "✅ You still have budget" },
          },
          required: ["success", "data", "message"],
        },
        SuccessBudgetOverviewResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/BudgetOverview" },
          },
          required: ["success", "data"],
        },
        BudgetInsightItem: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["needs", "wants", "savings"], example: "wants" },
            spentAmount: { type: "number", example: 350000 },
            limitAmount: { type: "number", example: 300000 },
            remainingAmount: { type: "number", example: -50000 },
            status: { type: "string", enum: ["ok", "warning", "limit-reached"], example: "warning" },
            indicator: { type: "string", enum: ["", "⚠️", "✅"], example: "⚠️" },
            line: { type: "string", example: "Wants: 350000 / 300000 ⚠️" },
          },
          required: [
            "category",
            "spentAmount",
            "limitAmount",
            "remainingAmount",
            "status",
            "indicator",
            "line",
          ],
        },
        BudgetInsights: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["weekly", "monthly"], example: "weekly" },
            rangeStart: { type: "string", format: "date", example: "2026-04-20" },
            rangeEnd: { type: "string", format: "date", example: "2026-04-26" },
            categories: {
              type: "array",
              items: { $ref: "#/components/schemas/BudgetInsightItem" },
            },
          },
          required: ["period", "rangeStart", "rangeEnd", "categories"],
        },
        SuccessBudgetInsightsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/BudgetInsights" },
          },
          required: ["success", "data"],
        },
        MonthlyTrend: {
          type: "object",
          properties: {
            currentMonth: { type: "string", example: "2026-04" },
            previousMonth: { type: "string", example: "2026-03" },
            currentExpenses: { type: "number", example: 1350000 },
            previousExpenses: { type: "number", example: 1200000 },
            difference: { type: "number", example: 150000 },
            percentageChange: { type: "number", nullable: true, example: 12.5 },
            isSpendingMore: { type: "boolean", example: true },
            message: { type: "string", example: "You are spending more than last month." },
          },
          required: [
            "currentMonth",
            "previousMonth",
            "currentExpenses",
            "previousExpenses",
            "difference",
            "percentageChange",
            "isSpendingMore",
            "message",
          ],
        },
        TopSpendingCategory: {
          type: "object",
          properties: {
            category: { type: "string", nullable: true, enum: ["needs", "wants", "savings"], example: "wants" },
            amount: { type: "number", example: 350000 },
          },
          required: ["category", "amount"],
        },
        SavingsRate: {
          type: "object",
          properties: {
            percentage: { type: "number", example: 25 },
            totalIncome: { type: "number", example: 4000000 },
            totalExpenses: { type: "number", example: 3000000 },
            message: { type: "string", example: "Healthy savings rate this month." },
          },
          required: ["percentage", "totalIncome", "totalExpenses", "message"],
        },
        MonthlyAwareness: {
          type: "object",
          properties: {
            trend: { $ref: "#/components/schemas/MonthlyTrend" },
            topSpendingCategory: { $ref: "#/components/schemas/TopSpendingCategory" },
            savingsRate: { $ref: "#/components/schemas/SavingsRate" },
          },
          required: ["trend", "topSpendingCategory", "savingsRate"],
        },
        SuccessMonthlyAwarenessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/MonthlyAwareness" },
          },
          required: ["success", "data"],
        },
        ExportLinksResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                filters: {
                  type: "object",
                  properties: {
                    startDate: { type: "string", format: "date", nullable: true },
                    endDate: { type: "string", format: "date", nullable: true },
                    type: { type: "string", enum: ["income", "expense"], nullable: true },
                    category: {
                      type: "string",
                      enum: ["needs", "wants", "savings"],
                      nullable: true,
                    },
                  },
                },
                downloads: {
                  type: "object",
                  properties: {
                    csv: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          format: "uri",
                          example:
                            "http://localhost:3001/exports/transactions?format=csv&type=expense",
                        },
                      },
                      required: ["url"],
                    },
                    xlsx: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          format: "uri",
                          example:
                            "http://localhost:3001/exports/transactions?format=xlsx&type=expense",
                        },
                      },
                      required: ["url"],
                    },
                  },
                  required: ["csv", "xlsx"],
                },
              },
              required: ["filters", "downloads"],
            },
          },
          required: ["success", "data"],
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            errors: {
              type: "array",
              items: { type: "string" },
              example: [
                "date is required and must be a string (YYYY-MM-DD)",
                "amount is required and must be a number greater than 0",
              ],
            },
          },
          required: ["success", "errors"],
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Unknown error" },
          },
          required: ["success", "error"],
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          security: [],
          responses: {
            "200": {
              description: "Service is up",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string", example: "Budget & Expense Tracker API is running 🚀" },
                    },
                    required: ["message"],
                  },
                },
              },
            },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "User registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessAuthResponse" },
                },
              },
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Email already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too many auth attempts",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login with email and password",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessAuthResponse" },
                },
              },
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Invalid email or password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too many auth attempts",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Authentication"],
          summary: "Rotate refresh token and issue new access token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Tokens refreshed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessAuthResponse" },
                },
              },
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Invalid refresh token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too many auth attempts",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Revoke refresh token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogoutInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Logout success",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get current authenticated user",
          responses: {
            "200": {
              description: "Current user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessPublicUserResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/transactions": {
        post: {
          tags: ["Transactions"],
          summary: "Create transaction",
          description:
            "Creates a transaction owned by the authenticated user from the bearer token context.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTransactionInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Transaction created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessTransactionResponse" },
                },
              },
            },
            "400": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
            "500": {
              description: "Internal error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        get: {
          tags: ["Transactions"],
          summary: "Get all transactions",
          description: "Returns only transactions owned by the authenticated user.",
          responses: {
            "200": {
              description: "List of the authenticated user's transactions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessTransactionsResponse" },
                },
              },
            },
            "500": {
              description: "Internal error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/summary/weekly": {
        get: {
          tags: ["Summary"],
          summary: "Get weekly summary",
          description:
            "Returns weekly totals computed only from transactions owned by the authenticated user.",
          responses: {
            "200": {
              description: "Weekly financial summary for the authenticated user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessWeeklySummaryResponse" },
                },
              },
            },
            "500": {
              description: "Internal error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/budgets/{period}": {
        get: {
          tags: ["Budget Control"],
          summary: "Get budget overview for weekly/monthly period",
          description:
            "Returns budget limits and spending for the authenticated user only.",
          parameters: [
            {
              name: "period",
              in: "path",
              required: true,
              schema: { type: "string", enum: ["weekly", "monthly"] },
            },
          ],
          responses: {
            "200": {
              description: "Budget overview for the authenticated user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessBudgetOverviewResponse" },
                },
              },
            },
            "400": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Budget Control"],
          summary: "Set category budget limit for weekly/monthly period",
          description:
            "Creates or updates a budget limit owned by the authenticated user.",
          parameters: [
            {
              name: "period",
              in: "path",
              required: true,
              schema: { type: "string", enum: ["weekly", "monthly"] },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SetBudgetLimitInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Budget limit updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          period: { type: "string", enum: ["weekly", "monthly"] },
                          category: { type: "string", enum: ["needs", "wants", "savings"] },
                          limitAmount: { type: "number", example: 500000 },
                        },
                        required: ["period", "category", "limitAmount"],
                      },
                    },
                    required: ["success", "data"],
                  },
                },
              },
            },
            "400": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/budgets/check": {
        post: {
          tags: ["Budget Control"],
          summary: "Check if planned purchase still fits available budget",
          description:
            "Performs budget validation using the authenticated user's limits and transactions only.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BudgetCheckInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Budget check result",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessBudgetStatusResponse" },
                },
              },
            },
            "400": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/budgets/insights/{period}": {
        get: {
          tags: ["Budget Control"],
          summary: "Quick insights: total spending per category and remaining budget",
          description:
            "Returns category-level spending and remaining budget for the authenticated user only.",
          parameters: [
            {
              name: "period",
              in: "path",
              required: true,
              schema: { type: "string", enum: ["weekly", "monthly"] },
            },
          ],
          responses: {
            "200": {
              description: "Budget insights with warning indicators",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessBudgetInsightsResponse" },
                },
              },
            },
            "400": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/exports/transactions": {
        get: {
          tags: ["Exports"],
          summary: "Get export links or download file",
          description:
            "Without format query returns JSON containing CSV/XLSX download URLs. With format=csv or format=xlsx returns the file directly. Export content is always limited to the authenticated user's transactions.",
          parameters: [
            {
              name: "format",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["csv", "xlsx"] },
            },
            { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
            { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
            { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
            {
              name: "category",
              in: "query",
              schema: { type: "string", enum: ["needs", "wants", "savings"] },
            },
          ],
          responses: {
            "200": {
              description: "Export links JSON (when format is omitted) or downloadable file (when format is provided)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ExportLinksResponse" },
                },
                "text/csv": {
                  schema: { type: "string", format: "binary" },
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            "400": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/awareness/monthly": {
        get: {
          tags: ["Financial Awareness"],
          summary: "Monthly financial awareness insights",
          description:
            "Answers key decision questions for the authenticated user: are you spending more than last month, which category is highest, and what is your savings rate.",
          responses: {
            "200": {
              description: "Monthly awareness insights for the authenticated user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMonthlyAwarenessResponse" },
                },
              },
            },
            "500": {
              description: "Internal error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
});
