type Value = string | number | boolean;

export type PathInto<T extends Record<string, any>> = keyof {
  [K in keyof T as T[K] extends Value
    ? K
    : T[K] extends Record<string, any>
    ? `${K & string}` | `${K & string}.${PathInto<T[K]> & string}`
    : never]: any;
} &
  string;

export type PathIntoValue<
  T extends Record<string, any>,
  K extends string
> = K extends keyof T
  ? T[K]
  : K extends `${infer K0}.${infer KR}`
  ? K0 extends keyof T
    ? PathIntoValue<T[K0], KR>
    : never
  : never;
