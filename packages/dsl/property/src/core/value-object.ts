export abstract class ValueObject<T> {
  protected constructor(protected readonly _value: T) {}

  get value(): T {
    return this._value;
  }

  toString(): string {
    return String(this._value);
  }

  equals(other: this): boolean {
    return this._value === other._value;
  }
}
