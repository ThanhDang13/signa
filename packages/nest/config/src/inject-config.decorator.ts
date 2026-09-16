import { Inject } from "@nestjs/common";
import type { ConfigToken } from "@signa/dsl-config";

export function InjectConfig<T>(token: ConfigToken<T>): ParameterDecorator {
  return Inject(token);
}
