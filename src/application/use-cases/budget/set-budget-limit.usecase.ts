import { IBudgetRepository } from "../../../domain/repositories/IBudgetRepository";
import { SetBudgetLimitInput } from "../../../domain/entities/Budget";

export class SetBudgetLimitUseCase {
  constructor(private readonly repository: IBudgetRepository) {}

  async execute(input: SetBudgetLimitInput, userId: number): Promise<void> {
    await this.repository.upsertBudgetLimit(input.period, input.category, input.limitAmount, userId);
  }
}
