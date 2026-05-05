import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import { ExportFileResult, TransactionExportFilters } from "../../../domain/entities/Export";
import {
  escapeCsvCell,
  EXPORT_COLUMNS,
  findFilteredTransactions,
  normalizeRows,
  toSafeFileTimestamp,
} from "./export.common";

export class ExportTransactionsCsvUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(filters: TransactionExportFilters, userId: number): Promise<ExportFileResult> {
    const transactions = await findFilteredTransactions(this.repository, filters, userId);
    const rows = normalizeRows(transactions);

    const header = EXPORT_COLUMNS.join(",");
    const bodyLines = rows.map((row) =>
      EXPORT_COLUMNS.map((col) => escapeCsvCell(row[col])).join(",")
    );

    const csv = `\uFEFF${[header, ...bodyLines].join("\n")}`;

    return {
      fileName: `transactions-${toSafeFileTimestamp()}.csv`,
      contentType: "text/csv; charset=utf-8",
      content: csv,
    };
  }
}
