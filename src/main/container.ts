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
import { Argon2PasswordHasher } from "../infrastructure/security/Argon2PasswordHasher";
import { JwtAuthTokenService } from "../infrastructure/security/JwtAuthTokenService";

const provider = getDatabaseProvider();

let transactionRepository: ITransactionRepository;
let budgetRepository: IBudgetRepository;
let awarenessRepository: IAwarenessRepository;
let userRepository: IUserRepository;
let refreshTokenRepository: IRefreshTokenRepository;

if (provider === "mongodb") {
  const { MongoTransactionRepository } = require("../infrastructure/database/repositories/MongoTransactionRepository") as {
    MongoTransactionRepository: new () => ITransactionRepository;
  };
  const { MongoBudgetRepository } = require("../infrastructure/database/repositories/MongoBudgetRepository") as {
    MongoBudgetRepository: new () => IBudgetRepository;
  };
  const { MongoAwarenessRepository } = require("../infrastructure/database/repositories/MongoAwarenessRepository") as {
    MongoAwarenessRepository: new () => IAwarenessRepository;
  };
  const { MongoUserRepository } = require("../infrastructure/database/repositories/MongoUserRepository") as {
    MongoUserRepository: new () => IUserRepository;
  };
  const { MongoRefreshTokenRepository } = require("../infrastructure/database/repositories/MongoRefreshTokenRepository") as {
    MongoRefreshTokenRepository: new () => IRefreshTokenRepository;
  };

  transactionRepository = new MongoTransactionRepository();
  budgetRepository = new MongoBudgetRepository();
  awarenessRepository = new MongoAwarenessRepository();
  userRepository = new MongoUserRepository();
  refreshTokenRepository = new MongoRefreshTokenRepository();
} else {
  const { SqliteTransactionRepository } = require("../infrastructure/database/repositories/SqliteTransactionRepository") as {
    SqliteTransactionRepository: new () => ITransactionRepository;
  };
  const { SqliteBudgetRepository } = require("../infrastructure/database/repositories/SqliteBudgetRepository") as {
    SqliteBudgetRepository: new () => IBudgetRepository;
  };
  const { SqliteAwarenessRepository } = require("../infrastructure/database/repositories/SqliteAwarenessRepository") as {
    SqliteAwarenessRepository: new () => IAwarenessRepository;
  };
  const { SqliteUserRepository } = require("../infrastructure/database/repositories/SqliteUserRepository") as {
    SqliteUserRepository: new () => IUserRepository;
  };
  const { SqliteRefreshTokenRepository } = require("../infrastructure/database/repositories/SqliteRefreshTokenRepository") as {
    SqliteRefreshTokenRepository: new () => IRefreshTokenRepository;
  };

  transactionRepository = new SqliteTransactionRepository();
  budgetRepository = new SqliteBudgetRepository();
  awarenessRepository = new SqliteAwarenessRepository();
  userRepository = new SqliteUserRepository();
  refreshTokenRepository = new SqliteRefreshTokenRepository();
}

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
