import { Category, Transaction, TransactionType } from "./Transaction";

export interface TransactionExportFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: Category;
}

export interface ExportFileResult {
  fileName: string;
  contentType: string;
  content: Buffer | string;
}

export type SupportedExportFormat = "csv" | "xlsx";

export interface TransactionExportRow {
  id: Transaction["id"];
  date: Transaction["date"];
  type: Transaction["type"];
  category: Transaction["category"];
  amount: Transaction["amount"];
}