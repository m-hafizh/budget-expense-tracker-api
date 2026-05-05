# Product Requirements Document (PRD)

## 1. Document Control
- Project: Budget Expense Tracker API
- Version: 1.0
- Date: 2026-05-05
- Status: Active
- Derived from: README.md, ARCHITECTURE.md, first-step.md, and current codebase structure under src

## 2. Product Summary
Budget Expense Tracker API is a local-first personal finance backend that enables users to record income and expenses, monitor weekly and monthly behavior, set budget limits, and export transaction data.

The product started as a minimal Level 1 concept (manual transaction input, three categories, weekly summary) and has evolved into a modular Clean Architecture service with pluggable persistence providers.

## 3. Problem Statement
Users need a lightweight API to:
- Capture daily financial activity quickly.
- Separate expenses into practical categories (needs, wants, savings).
- Understand short-term and monthly financial health.
- Check budget availability before spending.
- Export data for reporting or sharing.

## 4. Goals and Non-Goals

### 4.1 Goals
- Provide a stable REST API for transaction and budget workflows.
- Enforce input validation and predictable response shape.
- Support both SQLite (default) and MongoDB (optional) without changing application use-cases.
- Keep architecture maintainable via clear separation of domain, application, infrastructure, and composition layers.

### 4.2 Non-Goals (Current Scope)
- User authentication and authorization.
- Multi-tenant account management.
- Real-time websocket updates.
- Advanced forecasting and AI recommendations.
- Automatic bank integrations.

## 5. Target Users
- Individual users tracking personal finances.
- Developers integrating simple budget capability into a local or internal tool.

## 6. Functional Requirements

### 6.1 Transactions
- FR-TRX-01: System shall create a transaction through POST /transactions.
- FR-TRX-02: System shall validate transaction payload:
  - date is required and parseable as date.
  - type is one of income or expense.
  - amount is a number greater than 0.
  - category is required for expense and must be one of needs, wants, savings.
- FR-TRX-03: System shall return validation errors with HTTP 400 and success false.
- FR-TRX-04: System shall return created transaction with HTTP 201 and success true.
- FR-TRX-05: System shall list all transactions via GET /transactions.

### 6.2 Weekly Summary
- FR-SUM-01: System shall provide weekly summary through GET /summary/weekly.
- FR-SUM-02: Weekly range shall be Monday through Sunday of current week.
- FR-SUM-03: Summary shall include totalIncome, totalExpenses, balance, categoryBreakdown, and transactionCount.

### 6.3 Budget Management
- FR-BUD-01: System shall set per-category budget limits via PUT /budgets/:period.
- FR-BUD-02: period shall be weekly or monthly.
- FR-BUD-03: category shall be needs, wants, or savings.
- FR-BUD-04: limitAmount shall be a number greater than 0.
- FR-BUD-05: System shall provide budget overview via GET /budgets/:period, including range and per-category status.
- FR-BUD-06: System shall check planned spend via POST /budgets/check and return canSpend decision plus status message.
- FR-BUD-07: System shall provide budget insights via GET /budgets/insights/:period.
- FR-BUD-08: If custom limit does not exist, system shall use defaults:
  - needs: 500000
  - wants: 300000
  - savings: 200000

### 6.4 Monthly Awareness
- FR-AWR-01: System shall provide monthly awareness via GET /awareness/monthly.
- FR-AWR-02: Awareness shall include:
  - Spending trend vs previous month.
  - Top spending category for current month.
  - Savings rate percentage and explanatory message.

### 6.5 Export
- FR-EXP-01: System shall support transaction export endpoint GET /exports/transactions.
- FR-EXP-02: System shall accept optional filters:
  - startDate, endDate
  - type (income or expense)
  - category (needs, wants, savings)
- FR-EXP-03: System shall validate export query and reject invalid values with HTTP 400.
- FR-EXP-04: Without format, system shall return generated CSV and XLSX download links.
- FR-EXP-05: With format=csv, system shall return downloadable CSV file.
- FR-EXP-06: With format=xlsx, system shall return downloadable XLSX file.

### 6.6 API Docs and Service Discovery
- FR-DOC-01: System shall expose Swagger UI at /docs.
- FR-DOC-02: System shall expose OpenAPI JSON at /openapi.json.
- FR-DOC-03: System shall expose root health-style response at GET /.

### 6.7 Persistence Provider Selection
- FR-PST-01: System shall support DB_PROVIDER environment variable values sqlite and mongodb.
- FR-PST-02: Default provider shall be sqlite when DB_PROVIDER is not provided.
- FR-PST-03: Unknown DB_PROVIDER values shall fall back to sqlite with warning.
- FR-PST-04: System shall initialize and close active provider on startup and shutdown.
- FR-PST-05: System shall support MongoDB URI and database name via environment variables:
  - MONGODB_URI
  - MONGODB_DB_NAME

## 7. Data Requirements

### 7.1 Transaction Entity
Required fields and types:
- id: number
- date: string
- type: income or expense
- category: needs, wants, savings, or null
- amount: number

### 7.2 Budget Model
- period: weekly or monthly
- category: needs, wants, savings
- limitAmount: number
- computed status values: spentAmount, remainingAmount, projectedRemaining, canSpend

### 7.3 Awareness Model
- Trend metrics for current vs previous month.
- Top expense category and amount.
- Savings rate percentage, totals, and message.

## 8. Non-Functional Requirements
- NFR-01: Codebase shall preserve Clean Architecture boundaries:
  - domain independent of framework and data source.
  - application depends on domain contracts only.
  - infrastructure implements ports.
  - main layer composes dependencies.
- NFR-02: Repository interfaces shall remain asynchronous Promise-based to support both providers.
- NFR-03: API shall return consistent JSON envelope with success and data/errors where applicable.
- NFR-04: API shall compile under TypeScript strict mode.
- NFR-05: API shall run locally with Node.js and support local MongoDB Docker workflow.

## 9. Architecture and Implementation Mapping
Current implementation is expected to remain aligned with:
- src/domain/entities
- src/domain/repositories
- src/application/use-cases
- src/application/dto
- src/infrastructure/http
- src/infrastructure/database/repositories
- src/infrastructure/config
- src/main
- src/shared

## 10. Environment and Configuration Requirements
- PORT: HTTP port (default 3000)
- DB_PROVIDER: sqlite or mongodb
- MONGODB_URI: Mongo connection string (default mongodb://127.0.0.1:27017)
- MONGODB_DB_NAME: Mongo database name (default budget_expense_tracker)

## 11. Acceptance Criteria
- AC-01: Service boots and logs active persistence provider.
- AC-02: All listed endpoints are reachable and return expected status codes.
- AC-03: Validation errors are returned with HTTP 400 and clear error messages.
- AC-04: Weekly summary reflects current-week transactions only.
- AC-05: Budget check response includes decision and projected remaining amount.
- AC-06: Monthly awareness returns trend, top category, and savings rate.
- AC-07: Export endpoint returns links mode and direct file download mode.
- AC-08: Service works with sqlite and mongodb provider selection without changing application use-cases.

## 12. Risks and Mitigations
- Risk: Provider-specific behavior drift between SQLite and MongoDB.
  - Mitigation: Keep repository contracts stable and shared use-case tests per provider.
- Risk: Date parsing ambiguity from client input format.
  - Mitigation: Enforce and document YYYY-MM-DD usage in API docs.
- Risk: Environment misconfiguration in local setups.
  - Mitigation: Maintain .env template and startup logs for active provider.

## 13. Future Enhancements
- Add authentication and per-user data partitioning.
- Add migration utility from SQLite to MongoDB.
- Add integration and contract tests per endpoint/provider.
- Add paginated transaction listing and sorting options.
