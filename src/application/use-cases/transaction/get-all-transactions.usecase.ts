import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import { Transaction } from "../../../domain/entities/Transaction";

export class GetAllTransactionsUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(userId: number): Promise<Transaction[]> {
    return this.repository.findAll(userId);
  }
}
