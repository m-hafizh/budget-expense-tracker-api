export type TransactionType = "income" | "expense";

export type Category = "needs" | "wants" | "savings";

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  category: Category | null;
  amount: number;
}

export interface CreateTransactionInput {
  date: string;
  type: TransactionType;
  category?: Category;
  amount: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: {
    needs: number;
    wants: number;
    savings: number;
  };
  transactionCount: number;
}