import {
  FormState,
  Validations,
  FieldState,
  FormValidationConfig,
  FormErrors,
  PathInto,
  FormStateValues,
} from "./interface";
import { generateFormState, getDeepPaths } from "./utils";

export class FormValidation<T extends Record<string, any>> {
  private _formState: FormState<T>;
  private _formEl: HTMLFormElement;
  private _validations?: Validations<T>;
  private _validateOnChange: boolean;
  private _validateOnBlur: boolean;
  private _getFieldPaths: () => PathInto<FormStateValues<T>, true>[];
  private _onSubmit: (values: T) => void;
  private _renderFunction: () => void;

  constructor(options: FormValidationConfig<T>) {
    this._formEl = document.getElementById(options.formId) as HTMLFormElement;
    this._formState = generateFormState(options.initialValues, options.watch);
    this._getFieldPaths = () => getDeepPaths(this.formState.values);
    this._validations = options.validations;
    this._validateOnChange = options.validateOnChange ?? true;
    this._validateOnBlur = options.validateOnBlur ?? true;
    this._onSubmit = options.onSubmit;
    this._renderFunction = () => {
      options.renderError?.(
        this.formState,
        this.formElement,
        this._getInputElements()
      );
    };

    this._handleOnInput();
    this._handleOnBlur();
    this._handleOnSubmit();
  }

  private _handleOnInput() {
    this._formEl.addEventListener("input", (e) => {
      const field = (e.target as HTMLInputElement).name;
      const value = (e.target as HTMLInputElement).value;
      if (this._isValidFieldPath(field)) {
        this.setFieldTouched({ field, touched: true });
        this.setFieldValue({ field, value });

        // validate on input change
        this._validateOnChange && this.validateField(field);

        this._renderFunction();
      }
    });
  }

  public get isFormValid() {
    for (const field in this.formState) {
      if (this.formState[field].error) return false;
    }
    return true;
  }

  private _shouldFormPreventDefault() {
    this._setAllFieldsTouched();
    this.validateForm();
    const action = this._formEl.getAttribute("action");
    console.log(action);

    if (action === null) return true;
    return !this.isFormValid;
  }

  private _handleOnSubmit() {
    this._formEl.addEventListener("submit", (e) => {
      this._setAllFieldsTouched();
      if (this._shouldFormPreventDefault()) e.preventDefault();

      this._renderFunction?.();

      if (this.isFormValid) this._onSubmit(this.getFormValues());
    });
  }

  private _handleOnBlur() {
    const inputs = this._getInputElements();
    const formInstance = this;
    inputs.forEach((input) => {
      input.addEventListener("blur", function () {
        const field = this.name;
        if (formInstance._isValidFieldPath(field)) {
          // set field touched on blur
          formInstance.setFieldTouched({
            field,
            touched: true,
          });

          // validate field on blur
          formInstance._validateOnBlur && formInstance.validateField(field);

          formInstance._renderFunction();
        }
      });
    });
  }

  private _isValidFieldPath(
    key: string | number | symbol
  ): key is PathInto<FormStateValues<T>, true> {
    for (const field of this._getFieldPaths()) {
      if (field === key) return true;
    }
    return false;
  }

  private _getInputElementByName(name: keyof T): HTMLInputElement | undefined {
    const inputs = Array.from(this._formEl.getElementsByTagName("input"));
    return inputs.filter((input) => input.name === name)?.[0];
  }

  private _getInputElements(): HTMLInputElement[] {
    return Array.from(this._formEl.getElementsByTagName("input")).filter(
      (input) => input.type !== "submit"
    );
  }

  private _getErrorElements() {
    return Array.from(
      this._formEl.querySelectorAll('[role="error-message"]')
    ) as HTMLElement[];
  }

  public get formState() {
    return this._formState;
  }

  public get formElement() {
    return this._formEl;
  }

  public validateField(field: PathInto<T>) {
    // no validate if field is not touched or no validation provided
    if (!this.getFieldTouched(field) || !this._validations) return;

    const validateFn = this._validations[field];
    // no validate if no validation provided for the specific field
    if (!validateFn) return;

    const value = this.getFieldValue(field);
    const error = validateFn(value);

    this.setFieldError({ field, error });
  }

  public validateForm() {
    for (const field in this.formState.values) this.validateField(field);
  }

  public getFormValues() {
    const object = {} as T;
    for (const item in this.formState) {
      object[item] = this.formState[item].value;
    }
    return object;
  }

  public getFormErrors() {
    const object = {} as FormErrors<T>;
    for (const item in this.formState) {
      object[item] = this.formState[item].error;
    }
    return object;
  }

  public getFieldValue(field: keyof T) {
    return this._formState.values[field];
  }

  public setFieldValue(param: { field: keyof T; value: FieldState["value"] }) {
    const { field, value } = param;
    this._formState.values[field] = value;
  }

  public setFieldTouched(param: {
    field: keyof T;
    touched: FieldState["touched"];
  }) {
    const { field, touched } = param;
    this._formState.touched[field] = touched;
  }

  public getFieldTouched(field: keyof T) {
    return this._formState.touched[field];
  }

  private _setAllFieldsTouched() {
    for (const field in this.formState.values)
      this.setFieldTouched({ field, touched: true });
  }

  public getFieldError(field: keyof T) {
    return this._formState.errors[field];
  }

  public setFieldError(param: { field: keyof T; error?: FieldState["error"] }) {
    const { field, error } = param;
    this._formState.errors[field] = error;

    this._internalRenderError();
  }

  private _internalRenderError() {
    const errorElements = this._getErrorElements();
    for (const errorEl of errorElements) {
      const name = errorEl.getAttribute("name");
      if (!name) continue;
      if (this._isValidFieldPath(name)) {
        errorEl.innerText = this.formState.errors[name] ?? "";
      }
    }
  }
}
