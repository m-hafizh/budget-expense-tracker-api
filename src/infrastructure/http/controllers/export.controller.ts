import { Request, Response } from "express";
import {
  ExportQueryInput,
  ParsedTransactionExportQuery,
} from "../../../application/dto/ExportTransactionQueryDTO";
import { SupportedExportFormat, TransactionExportFilters } from "../../../domain/entities/Export";
import { Category, TransactionType } from "../../../domain/entities/Transaction";
import {
  getExportUseCases,
} from "../../../main/container";
import { getAuthUserIdOrRespond } from "./controller-auth.util";

const VALID_TYPES: TransactionType[] = ["income", "expense"];
const VALID_CATEGORIES: Category[] = ["needs", "wants", "savings"];
const VALID_FORMATS: SupportedExportFormat[] = ["csv", "xlsx"];
const exportUseCases = getExportUseCases();

function pickOne(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function parseTransactionExportQuery(query: ExportQueryInput): ParsedTransactionExportQuery {
  const filters: TransactionExportFilters = {};
  const errors: string[] = [];

  const startDate = pickOne(query.startDate);
  const endDate = pickOne(query.endDate);
  const type = pickOne(query.type);
  const category = pickOne(query.category);
  const format = pickOne(query.format);

  if (startDate) {
    if (!isValidDate(startDate)) {
      errors.push("startDate must be a valid date string (YYYY-MM-DD)");
    } else {
      filters.startDate = startDate;
    }
  }

  if (endDate) {
    if (!isValidDate(endDate)) {
      errors.push("endDate must be a valid date string (YYYY-MM-DD)");
    } else {
      filters.endDate = endDate;
    }
  }

  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    errors.push("startDate cannot be greater than endDate");
  }

  if (type) {
    if (!VALID_TYPES.includes(type as TransactionType)) {
      errors.push("type must be one of: income, expense");
    } else {
      filters.type = type as TransactionType;
    }
  }

  if (category) {
    if (!VALID_CATEGORIES.includes(category as Category)) {
      errors.push("category must be one of: needs, wants, savings");
    } else {
      filters.category = category as Category;
    }
  }

  let parsedFormat: SupportedExportFormat | undefined;
  if (format) {
    if (!VALID_FORMATS.includes(format as SupportedExportFormat)) {
      errors.push("format must be one of: csv, xlsx");
    } else {
      parsedFormat = format as SupportedExportFormat;
    }
  }

  return { filters, errors, format: parsedFormat };
}

function getBaseUrl(req: Request): string {
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto ? forwardedProto.split(",")[0].trim() : req.protocol;
  const host = req.get("host") ?? "localhost:3000";
  return `${protocol}://${host}`;
}

export async function handleExportTransactions(req: Request, res: Response): Promise<void> {
  const userId = getAuthUserIdOrRespond(req, res);
  if (userId === null) {
    return;
  }

  const { filters, errors, format } = parseTransactionExportQuery(req.query as ExportQueryInput);

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  const baseUrl = getBaseUrl(req);
  const links = exportUseCases.getTransactionExportLinks.execute(baseUrl, filters);

  try {
    if (!format) {
      res.json({
        success: true,
        data: {
          filters: links.filters,
          downloads: {
            csv: { url: links.csvUrl },
            xlsx: { url: links.xlsxUrl },
          },
        },
      });
      return;
    }

    if (format === "csv") {
      const file = await exportUseCases.exportTransactionsCsv.execute(filters, userId);
      res.setHeader("Content-Type", file.contentType);
      res.setHeader("Content-Disposition", `attachment; filename=\"${file.fileName}\"`);
      res.setHeader("Content-Location", links.csvUrl);
      res.send(file.content);
      return;
    }

    const file = await exportUseCases.exportTransactionsXlsx.execute(filters, userId);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `attachment; filename=\"${file.fileName}\"`);
    res.setHeader("Content-Location", links.xlsxUrl);
    res.send(file.content);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
}
