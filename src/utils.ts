type Value = string | number | boolean;

export type PathInto<T extends Record<string, any>> = keyof {
  [K in keyof T as T[K] extends Value
    ? K
    : T[K] extends Record<string, any>
    ? `${K & string}` | `${K & string}.${PathInto<T[K]> & string}`
    : never]: any;
};
