export type Eval<T> = { [K in keyof T]: T[K] } & {};
