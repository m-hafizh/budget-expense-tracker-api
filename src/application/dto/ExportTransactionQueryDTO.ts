import { SupportedExportFormat, TransactionExportFilters } from "../../domain/entities/Export";

export interface ExportQueryInput {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  category?: unknown;
  format?: unknown;
}

export interface ParsedTransactionExportQuery {
  filters: TransactionExportFilters;
  errors: string[];
  format?: SupportedExportFormat;
}
