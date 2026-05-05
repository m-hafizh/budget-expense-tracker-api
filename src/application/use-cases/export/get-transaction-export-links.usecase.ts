import { TransactionExportFilters } from "../../../domain/entities/Export";

export interface TransactionExportLinks {
  csvUrl: string;
  xlsxUrl: string;
  filters: TransactionExportFilters;
}

export class GetTransactionExportLinksUseCase {
  execute(baseUrl: string, filters: TransactionExportFilters): TransactionExportLinks {
    const makeUrl = (format: "csv" | "xlsx") => {
      const params = new URLSearchParams();
      params.set("format", format);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.type) params.set("type", filters.type);
      if (filters.category) params.set("category", filters.category);

      return `${baseUrl}/exports/transactions?${params.toString()}`;
    };

    return {
      csvUrl: makeUrl("csv"),
      xlsxUrl: makeUrl("xlsx"),
      filters,
    };
  }
}
