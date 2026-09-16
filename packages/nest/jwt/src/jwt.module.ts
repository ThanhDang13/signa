import { DynamicModule, Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { APP_GUARD } from "@nestjs/core";

import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtIdentityGuard, JwtProtectedGuard } from "./guards/jwt.guard";
import { JwtAdapter } from "./adapters/jwt.adapter";

import { TOKEN_SERVICE } from "./ports/token-service.port";

import {
  NEST_JWT_OPTIONS,
  NestJwtOptions,
  NestJwtModuleAsyncOptions,
  NestJwtOptionsFactory
} from "./jwt.module-options";

@Global()
@Module({})
export class NestJwtModule {
  static registerAsync(options: NestJwtModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: NEST_JWT_OPTIONS,
      useFactory: async (factory: NestJwtOptionsFactory) => {
        return factory.create();
      },
      inject: [options.useClass]
    };

    const optionsModule: DynamicModule = {
      module: class JwtOptionsModule {},
      imports: options.imports,
      providers: [
        {
          provide: options.useClass,
          useClass: options.useClass
        },
        optionsProvider
      ],
      exports: [NEST_JWT_OPTIONS]
    };

    const jwtAdapterProvider = {
      provide: TOKEN_SERVICE,
      useClass: JwtAdapter
    };

    const passportModule = PassportModule.register({
      defaultStrategy: "jwt"
    });

    const jwtCoreModule = JwtModule.registerAsync({
      imports: [optionsModule],
      inject: [NEST_JWT_OPTIONS],
      useFactory: async (opts: NestJwtOptions) => ({
        secret: opts.secret,
        signOptions: {
          expiresIn: opts.expiresIn
        }
      })
    });

    const identityGuardProvider = {
      provide: APP_GUARD,
      useClass: JwtIdentityGuard
    };

    return {
      module: NestJwtModule,

      imports: [passportModule, jwtCoreModule, ...(options.imports ?? [])],

      providers: [
        options.useClass,
        optionsProvider,
        JwtStrategy,
        jwtAdapterProvider,
        identityGuardProvider,
        JwtIdentityGuard,
        JwtProtectedGuard
      ],

      exports: [JwtIdentityGuard, JwtProtectedGuard, TOKEN_SERVICE, JwtModule]
    };
  }
}
