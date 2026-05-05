import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import { TransactionExportFilters } from "../../../domain/entities/Export";
import { Transaction } from "../../../domain/entities/Transaction";

export const EXPORT_COLUMNS = ["id", "date", "type", "category", "amount"] as const;

export function toSafeFileTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

export function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function applyFilters(
  transactions: Transaction[],
  filters: TransactionExportFilters
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.category && t.category !== filters.category) return false;
    return true;
  });
}

export function findFilteredTransactions(
  repository: ITransactionRepository,
  filters: TransactionExportFilters,
  userId: number
): Promise<Transaction[]> {
  return repository.findAll(userId).then((all) => applyFilters(all, filters));
}

export function normalizeRows(transactions: Transaction[]): Array<Record<(typeof EXPORT_COLUMNS)[number], string | number>> {
  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    category: t.category ?? "",
    amount: t.amount,
  }));
}
