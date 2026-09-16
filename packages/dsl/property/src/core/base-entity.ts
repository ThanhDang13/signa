import { Accessor } from "./accessor";

export abstract class BaseEntity {
  protected __initializing = true;

  protected finishInitialization() {
    this.__initializing = false;
    return this;
  }

  @Accessor({ touchOnSet: true, readonly: true })
  createdAt!: Date;

  @Accessor({ touchOnSet: true })
  updatedAt!: Date;

  protected constructor(isNew = true) {
    if (isNew) {
      const now = new Date();
      this.createdAt = now;
      this.updatedAt = now;
    }
  }

  protected touch(): void {
    this.updatedAt = new Date();
  }

  toPrimitives(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      const value = (this as Record<string, unknown>)[key];
      if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (value && typeof value === "object" && "toString" in value) {
        result[key] = value.toString();
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
