import type { DynamicModule, InjectionToken } from "@nestjs/common";
import { Global, Module, type Provider } from "@nestjs/common";
import type { ConfigFactory } from "@signa/dsl-config";
import { ConfigRegistry } from "@signa/dsl-config";
import type { z } from "zod";

export interface ConfigModuleOptions {
  factories: Array<ConfigFactory<z.ZodTypeAny>>;
  env?: Record<string, string | undefined>;
}

@Global()
@Module({})
export class ConfigModule {
  static register(options: ConfigModuleOptions): DynamicModule {
    const registry = new ConfigRegistry();

    for (const factory of options.factories) {
      registry.register(factory);
    }

    registry.load(options.env ?? process.env);

    const providers: Provider[] = options.factories.map((factory) => ({
      provide: factory.token,
      useValue: registry.get(factory.token)
    }));

    providers.push({
      provide: ConfigRegistry,
      useValue: registry
    });

    return {
      module: ConfigModule,
      providers,
      exports: [...options.factories.map((f) => f.token), ConfigRegistry]
    };
  }

  static registerAsync(options: {
    useFactory: (...args: never[]) => ConfigModuleOptions | Promise<ConfigModuleOptions>;
    inject?: InjectionToken[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: "CONFIG_MODULE_OPTIONS",
        useFactory: options.useFactory,
        inject: options.inject ?? []
      },
      {
        provide: ConfigRegistry,
        useFactory: (moduleOptions: ConfigModuleOptions) => {
          const registry = new ConfigRegistry();
          for (const factory of moduleOptions.factories) {
            registry.register(factory);
          }
          registry.load(moduleOptions.env ?? process.env);
          return registry;
        },
        inject: ["CONFIG_MODULE_OPTIONS"]
      }
    ];

    return {
      module: ConfigModule,
      providers,
      exports: [ConfigRegistry]
    };
  }
}
