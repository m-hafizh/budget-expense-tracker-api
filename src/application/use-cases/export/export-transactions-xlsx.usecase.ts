import ExcelJS from "exceljs";
import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import { ExportFileResult, TransactionExportFilters } from "../../../domain/entities/Export";
import {
  findFilteredTransactions,
  normalizeRows,
  toSafeFileTimestamp,
} from "./export.common";

export class ExportTransactionsXlsxUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(filters: TransactionExportFilters, userId: number): Promise<ExportFileResult> {
    const transactions = await findFilteredTransactions(this.repository, filters, userId);
    const rows = normalizeRows(transactions);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transactions");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Date", key: "date", width: 14 },
      { header: "Type", key: "type", width: 12 },
      { header: "Category", key: "category", width: 14 },
      { header: "Amount", key: "amount", width: 14 },
    ];

    rows.forEach((row) => sheet.addRow(row));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    sheet.getColumn("amount").numFmt = "#,##0.00";

    sheet.columns.forEach((column) => {
      let max = 10;
      if (!column.eachCell) return;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > max) max = len;
      });
      column.width = Math.min(max + 2, 30);
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return {
      fileName: `transactions-${toSafeFileTimestamp()}.xlsx`,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content: buffer,
    };
  }
}
