import { CreateTransactionUseCase } from "../application/use-cases/transaction/create-transaction.usecase";
import { GetAllTransactionsUseCase } from "../application/use-cases/transaction/get-all-transactions.usecase";
import { GetWeeklySummaryUseCase } from "../application/use-cases/transaction/get-weekly-summary.usecase";
import { CheckBudgetUseCase } from "../application/use-cases/budget/check-budget.usecase";
import { GetBudgetInsightsUseCase } from "../application/use-cases/budget/get-budget-insights.usecase";
import { GetBudgetOverviewUseCase } from "../application/use-cases/budget/get-budget-overview.usecase";
import { SetBudgetLimitUseCase } from "../application/use-cases/budget/set-budget-limit.usecase";
import { GetMonthlyAwarenessUseCase } from "../application/use-cases/awareness/get-monthly-awareness.usecase";
import { ExportTransactionsCsvUseCase } from "../application/use-cases/export/export-transactions-csv.usecase";
import { ExportTransactionsXlsxUseCase } from "../application/use-cases/export/export-transactions-xlsx.usecase";
import { GetTransactionExportLinksUseCase } from "../application/use-cases/export/get-transaction-export-links.usecase";
import { GetCurrentUserUseCase } from "../application/use-cases/auth/get-current-user.usecase";
import { LoginUseCase } from "../application/use-cases/auth/login.usecase";
import { LogoutUseCase } from "../application/use-cases/auth/logout.usecase";
import { RefreshTokenUseCase } from "../application/use-cases/auth/refresh-token.usecase";
import { RegisterUseCase } from "../application/use-cases/auth/register.usecase";
import { IAwarenessRepository } from "../domain/repositories/IAwarenessRepository";
import { IBudgetRepository } from "../domain/repositories/IBudgetRepository";
import { IRefreshTokenRepository } from "../domain/repositories/IRefreshTokenRepository";
import { ITransactionRepository } from "../domain/repositories/ITransactionRepository";
import { IUserRepository } from "../domain/repositories/IUserRepository";
import { getDatabaseProvider } from "../infrastructure/config/persistence";
import { MongoAwarenessRepository } from "../infrastructure/database/repositories/MongoAwarenessRepository";
import { MongoBudgetRepository } from "../infrastructure/database/repositories/MongoBudgetRepository";
import { MongoRefreshTokenRepository } from "../infrastructure/database/repositories/MongoRefreshTokenRepository";
import { MongoTransactionRepository } from "../infrastructure/database/repositories/MongoTransactionRepository";
import { MongoUserRepository } from "../infrastructure/database/repositories/MongoUserRepository";
import { SqliteAwarenessRepository } from "../infrastructure/database/repositories/SqliteAwarenessRepository";
import { SqliteBudgetRepository } from "../infrastructure/database/repositories/SqliteBudgetRepository";
import { SqliteRefreshTokenRepository } from "../infrastructure/database/repositories/SqliteRefreshTokenRepository";
import { SqliteTransactionRepository } from "../infrastructure/database/repositories/SqliteTransactionRepository";
import { SqliteUserRepository } from "../infrastructure/database/repositories/SqliteUserRepository";
import { Argon2PasswordHasher } from "../infrastructure/security/Argon2PasswordHasher";
import { JwtAuthTokenService } from "../infrastructure/security/JwtAuthTokenService";

const provider = getDatabaseProvider();

const transactionRepository: ITransactionRepository =
  provider === "mongodb" ? new MongoTransactionRepository() : new SqliteTransactionRepository();
const budgetRepository: IBudgetRepository =
  provider === "mongodb" ? new MongoBudgetRepository() : new SqliteBudgetRepository();
const awarenessRepository: IAwarenessRepository =
  provider === "mongodb" ? new MongoAwarenessRepository() : new SqliteAwarenessRepository();
const userRepository: IUserRepository =
  provider === "mongodb" ? new MongoUserRepository() : new SqliteUserRepository();
const refreshTokenRepository: IRefreshTokenRepository =
  provider === "mongodb" ? new MongoRefreshTokenRepository() : new SqliteRefreshTokenRepository();

const passwordHasher = new Argon2PasswordHasher();
const authTokenService = new JwtAuthTokenService();

const transactionUseCases = {
  createTransaction: new CreateTransactionUseCase(transactionRepository),
  getAllTransactions: new GetAllTransactionsUseCase(transactionRepository),
  getWeeklySummary: new GetWeeklySummaryUseCase(transactionRepository),
};

const budgetUseCases = {
  setBudgetLimit: new SetBudgetLimitUseCase(budgetRepository),
  getBudgetOverview: new GetBudgetOverviewUseCase(budgetRepository),
  checkBudget: new CheckBudgetUseCase(budgetRepository),
  getBudgetInsights: new GetBudgetInsightsUseCase(budgetRepository),
};

const awarenessUseCases = {
  getMonthlyAwareness: new GetMonthlyAwarenessUseCase(awarenessRepository),
};

const exportUseCases = {
  exportTransactionsCsv: new ExportTransactionsCsvUseCase(transactionRepository),
  exportTransactionsXlsx: new ExportTransactionsXlsxUseCase(transactionRepository),
  getTransactionExportLinks: new GetTransactionExportLinksUseCase(),
};

const authUseCases = {
  register: new RegisterUseCase(
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    authTokenService
  ),
  login: new LoginUseCase(
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    authTokenService
  ),
  refreshToken: new RefreshTokenUseCase(
    userRepository,
    refreshTokenRepository,
    authTokenService
  ),
  logout: new LogoutUseCase(refreshTokenRepository, authTokenService),
  getCurrentUser: new GetCurrentUserUseCase(userRepository),
};

export function getTransactionUseCases() {
  return transactionUseCases;
}

export function getBudgetUseCases() {
  return budgetUseCases;
}

export function getAwarenessUseCases() {
  return awarenessUseCases;
}

export function getExportUseCases() {
  return exportUseCases;
}

export function getAuthUseCases() {
  return authUseCases;
}

export function getAuthTokenService() {
  return authTokenService;
}
