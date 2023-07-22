type Value = string | number | boolean;

export type PathInto<T extends Record<string, any>> = keyof {
  [K in keyof T as T extends Value[]
    ? "_item"
    : T extends Record<string, any>[]
    ? "_item" | `_item.${PathInto<T[0]>}`
    : T[K] extends Value
    ? K
    : T[K] extends Value[]
    ? `${K & string}` | `${K & string}._item`
    : T[K] extends Record<string, any>[]
    ? `${K & string}` | `${K & string}._item.${PathInto<T[K][0]>}`
    : T[K] extends Record<string, any>
    ? `${K & string}` | `${K & string}.${PathInto<T[K]> & string}`
    : never]: any;
} &
  string;

export type PathIntoValue<
  T extends Record<string | number, any>,
  K extends string
> = K extends keyof T
  ? T[K]
  : K extends "_item"
  ? T[0]
  : K extends `${infer K0}.${infer KR}`
  ? K0 extends keyof T
    ? PathIntoValue<T[K0], KR>
    : K0 extends "_item"
    ? PathIntoValue<T[0], KR>
    : never
  : never;

export type Enumerate<
  N extends number,
  Acc extends string[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, `${Acc["length"]}`]>;
