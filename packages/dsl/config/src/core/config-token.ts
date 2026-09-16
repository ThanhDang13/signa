export type ConfigToken<T = unknown> = symbol & { __type?: T };

export function createConfigToken<T>(key: string): ConfigToken<T> {
  return Symbol(key) as ConfigToken<T>;
}
