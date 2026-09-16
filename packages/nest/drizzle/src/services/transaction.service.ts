import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE_DATABASE } from "../tokens";
import type { AppDatabase } from "../types";

@Injectable()
export class TransactionService<TSchema extends Record<string, unknown> = Record<string, never>> {
  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: AppDatabase<TSchema>
  ) {}

  async run<T>(fn: (tx: AppDatabase<TSchema>) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }
}
