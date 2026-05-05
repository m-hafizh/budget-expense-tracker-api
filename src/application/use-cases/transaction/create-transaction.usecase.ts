import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import {
  CreateTransactionInput,
  Transaction,
} from "../../../domain/entities/Transaction";

export class CreateTransactionUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(input: CreateTransactionInput, userId: number): Promise<Transaction> {
    if (input.type === "income") {
      const { category: _ignoredCategory, ...sanitized } = input;
      return this.repository.create(sanitized, userId);
    }

    return this.repository.create(input, userId);
  }
}
