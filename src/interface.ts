import { FormValidation } from "./class";

export interface FieldState {
  value: any;
  touched: boolean;
  error?: string;
}

export type FormStateValues<T> = T;
export type FormStateTouched<T> = { [key in keyof T]: boolean };
export type FormStateErrors<T extends Record<string, any>> = {
  [K in AllPathInto<T>]: string;
};

export type FormStateChildren<T> =
  | FormStateValues<T>
  | FormStateTouched<T>
  | FormStateErrors<T>;
export interface FormState<T extends object> {
  values: FormStateValues<T>;
  touched: FormStateTouched<T>;
  errors: FormStateErrors<T>;
}

export type Validations<T extends object> = {
  [K in AllPathInto<T>]?: (value: PathIntoValue<T, K>) => string;
};

export type Watch<T extends object> = {
  [K in PathInto<T>]?: (
    values: PathIntoValue<T, K>,
    error: string,
    touched: boolean
  ) => void;
};

export interface FormValidationConfig<T extends object> {
  formId: string;
  initialValues: T;
  validations: Validations<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit: (values: T) => void;
  onChange?: (instance: FormValidation<T>) => void;
  onBlur?: (instance: FormValidation<T>) => void;
  renderError?: (
    formState: FormState<T>,
    formEl: HTMLFormElement,
    formInputs: HTMLInputElement[]
  ) => void;
  watch?: Watch<T>;
}

export type FormErrors<T extends object> = {
  [key in keyof T]?: string;
};

export type Value = string | number | boolean;

type ArrayItem = "_item";

export type PathInto<
  T extends Record<string, any>,
  Deep extends boolean = false
> = keyof {
  [K in keyof T as T extends Value[]
    ? ArrayItem
    : T extends Record<string, any>[]
    ?
        | (Deep extends true ? never : ArrayItem)
        | `${ArrayItem}.${PathInto<T[0], Deep>}`
    : T[K] extends Value
    ? K
    : T[K] extends Value[]
    ?
        | (Deep extends true ? never : `${K & string}`)
        | `${K & string}.${ArrayItem}`
    : T[K] extends Record<string, any>[]
    ?
        | (Deep extends true ? never : `${K & string}`)
        | (Deep extends true ? never : `${K & string}.${ArrayItem}`)
        | `${K & string}.${ArrayItem}.${PathInto<T[K][0], Deep>}`
    : T[K] extends Record<string, any>
    ?
        | (Deep extends true ? never : `${K & string}`)
        | `${K & string}.${PathInto<T[K], Deep> & string}`
    : never]: any;
} &
  string;

export type DeepPathInto<T extends Record<string, any>> = PathInto<T, true>;

export type AllPathInto<T extends Record<string, any>> =
  | DeepPathInto<T>
  | PathInto<T>;

export type PathIntoValue<
  T extends Record<string | number, any>,
  K extends string
> = K extends keyof T
  ? T[K]
  : K extends ArrayItem
  ? T[0]
  : K extends `${infer K0}.${infer KR}`
  ? K0 extends keyof T
    ? PathIntoValue<T[K0], KR>
    : K0 extends ArrayItem
    ? PathIntoValue<T[0], KR>
    : never
  : never;

export type Enumerate<
  N extends number,
  Acc extends string[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, `${Acc["length"]}`]>;
