import { Global, Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@signa/nest-cache";
import { CacheConfigService } from "@signa/api/core/cache/cache.config";

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useClass: CacheConfigService
    })
  ],
  exports: [NestCacheModule]
})
export class CacheModule {}
