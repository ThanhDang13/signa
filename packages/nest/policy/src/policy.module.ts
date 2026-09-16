import { Global, Module } from "@nestjs/common";
import { PolicyGuard } from "./policy.guard";
import { NestContextProvider } from "./context/nest-context-provider";

@Global()
@Module({
  imports: [],
  providers: [PolicyGuard, NestContextProvider],
  exports: [PolicyGuard, NestContextProvider]
})
export class PolicyModule {}
