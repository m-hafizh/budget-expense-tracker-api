import { Category, TransactionType } from "../../domain/entities/Transaction";

const VALID_TYPES: TransactionType[] = ["income", "expense"];
const VALID_CATEGORIES: Category[] = ["needs", "wants", "savings"];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface TransactionInput {
  date?: unknown;
  type?: unknown;
  category?: unknown;
  amount?: unknown;
}

export function validateTransaction(body: TransactionInput): ValidationResult {
  const errors: string[] = [];

  // date — required, ISO string
  if (!body.date || typeof body.date !== "string") {
    errors.push("date is required and must be a string (YYYY-MM-DD)");
  } else if (isNaN(Date.parse(body.date))) {
    errors.push("date must be a valid date string");
  }

  // type — required
  if (!body.type || !VALID_TYPES.includes(body.type as TransactionType)) {
    errors.push(`type is required and must be one of: ${VALID_TYPES.join(", ")}`);
  }

  // amount — required, positive number
  if (body.amount === undefined || typeof body.amount !== "number" || body.amount <= 0) {
    errors.push("amount is required and must be a number greater than 0");
  }

  // category — required for expenses, optional for income
  if (body.type === "expense") {
    if (!body.category || !VALID_CATEGORIES.includes(body.category as Category)) {
      errors.push(
        `category is required for expenses and must be one of: ${VALID_CATEGORIES.join(", ")}`
      );
    }
  }

  // if category is provided at all it must be valid
  if (body.category && !VALID_CATEGORIES.includes(body.category as Category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}
