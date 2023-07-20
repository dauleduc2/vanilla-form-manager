export interface FieldState {
  value: any;
  touched: boolean;
  error?: string;
}
export type FormState<T extends object> = { [key in keyof T]: FieldState };
export const generateFormData = <T extends object>(
  initialValues: T
): { [key in keyof T]: FieldState } => {
  let object: { [key in keyof T]: FieldState } = {} as {
    [key in keyof T]: FieldState;
  };

  for (const key of Object.keys(initialValues) as (keyof T)[]) {
    object[key] = { touched: false, value: initialValues[key] };
  }

  return object;
};

export type Validations<T extends object> = {
  [key in keyof T]?: (value: any) => string;
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
}

export type FormErrors<T extends object> = {
  [key in keyof T]?: string;
};
