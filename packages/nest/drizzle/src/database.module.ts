import { Global, Module, DynamicModule } from "@nestjs/common";
import { DrizzlePGModule } from "@knaadh/nestjs-drizzle-pg";
import { DrizzleModuleAsyncOptions, DrizzleConfigFactory } from "./database.module-options";
import { TransactionService } from "./services/transaction.service";
import { DRIZZLE_DATABASE } from "./tokens";

@Global()
@Module({})
export class DrizzleModule {
  static registerAsync(options: DrizzleModuleAsyncOptions): DynamicModule {
    const tag = options.tag || DRIZZLE_DATABASE;

    return {
      module: DrizzleModule,
      imports: [
        DrizzlePGModule.registerAsync({
          tag,
          useClass: options.useClass as never,
          useFactory: options.useFactory as never,
          inject: options.inject as never,
          imports: options.imports
        })
      ],
      providers: [TransactionService],
      exports: [DrizzlePGModule, TransactionService]
    };
  }
}
