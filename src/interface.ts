import { PathInto } from "./utils";

export interface FieldState {
  value: any;
  touched: boolean;
  error?: string;
}

type FormStateValues<T> = { [key in keyof T]: any };
type FormStateTouched<T> = { [key in keyof T]: boolean };
type FormStateErrors<T> = { [key in keyof T]: string };

type FormStateChildren<T> =
  | FormStateValues<T>
  | FormStateTouched<T>
  | FormStateErrors<T>;
export interface FormState<T extends object> {
  values: FormStateValues<T>;
  touched: FormStateTouched<T>;
  errors: FormStateErrors<T>;
}

type ObjectKey = string | Symbol | number;

export const generateFormState = <T extends object>(
  initialValues: T,
  watch: Watch<T>
) => {
  let object = { errors: {}, touched: {}, values: {} } as FormState<T>;

  for (const key of Object.keys(initialValues) as (keyof T)[]) {
    object.values[key] = null;
    object.touched[key] = false;
    object.errors[key] = "";
  }

  const carry = (parentKey?: (keyof FormState<T> | ObjectKey)[]) => {
    return {
      get(obj, key: keyof FormState<T>) {
        const currentTarget = obj[key];
        // handle in case the target is Object
        if (typeof currentTarget === "object" && obj[key] !== null)
          return new Proxy(currentTarget, carry([...parentKey, key]));

        return currentTarget;
      },
      // key can be nested object key
      set(obj, key, value) {
        obj[key] = value;
        if (parentKey[0] === "values") {
          const handler = watch[parentKey.slice().splice(1).join(".")];
          handler?.(value, "", false);
        }

        return true;
      },
    };
  };

  return new Proxy<FormState<T>>(object, carry());
};

export type Validations<T extends object> = {
  [key in keyof T]?: (value: any) => string;
};

type Watch<T extends object> = {
  [k in PathInto<T>]?: (values: any, error: string, touched: boolean) => void;
};

export interface FormValidationConfig<T extends object> {
  formId: string;
  initialValues: T;
  validations: Validations<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit: (values: T) => void;
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
