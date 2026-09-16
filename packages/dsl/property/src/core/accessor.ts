import { createError } from "@signa/dsl-error";
import { PROPERTY_NOT_INITIALIZED, PROPERTY_READONLY } from "./error-codes";

export interface AccessorOptions<T, V> {
  touchOnSet?: boolean;
  onSet?: (value: V, instance: T) => void;
  onGet?: (value: V | undefined, instance: T) => void;
  allowUndefined?: boolean;
  readonly?: boolean;
}

export function Accessor<T extends object, V>(options?: AccessorOptions<T, V>) {
  const values = new WeakMap<T, V>();

  return function (target: T, propertyKey: string | symbol): void {
    Object.defineProperty(target, propertyKey, {
      get(this: T): V | undefined {
        const value = values.get(this);
        if (value === undefined && !options?.allowUndefined) {
          throw createError(PROPERTY_NOT_INITIALIZED.code, {
            context: { propertyKey: String(propertyKey) }
          });
        }
        options?.onGet?.(value, this);
        return value;
      },
      set(this: T, value: V): void {
        const isInitializing =
          "__initializing" in this && (this as { __initializing: boolean }).__initializing;

        if (options?.readonly && !isInitializing) {
          throw createError(PROPERTY_READONLY.code, {
            context: { propertyKey: String(propertyKey) }
          });
        }

        options?.onSet?.(value, this);
        values.set(this, value);

        if (
          options?.touchOnSet &&
          !isInitializing &&
          "touch" in this &&
          typeof (this as { touch(): void }).touch === "function"
        ) {
          (this as { touch(): void }).touch();
        }
      },
      enumerable: true,
      configurable: true
    });
  };
}
