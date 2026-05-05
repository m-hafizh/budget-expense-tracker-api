import { ITransactionRepository } from "../../../domain/repositories/ITransactionRepository";
import { Category, WeeklySummary } from "../../../domain/entities/Transaction";

function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun … 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

export class GetWeeklySummaryUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(userId: number): Promise<WeeklySummary> {
    const { start, end } = getCurrentWeekRange();
    const rows = await this.repository.findByDateRange(start, end, userId);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = { needs: 0, wants: 0, savings: 0 };

    for (const row of rows) {
      if (row.type === "income") {
        totalIncome += row.amount;
      } else {
        totalExpenses += row.amount;
        if (row.category) {
          categoryBreakdown[row.category as Category] += row.amount;
        }
      }
    }

    return {
      weekStart: start,
      weekEnd: end,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      categoryBreakdown,
      transactionCount: rows.length,
    };
  }
}
