import {
  FormState,
  Validations,
  FieldState,
  FormValidationConfig,
  FormStateValues,
  DeepPathInto,
  AllPathInto,
} from "./interface";
import {
  generateFormState,
  getAllPaths,
  getDeepPaths,
  getValueByPath,
  isAnyFieldTrue,
  setValueByPath,
} from "./utils";

export class FormValidation<T extends Record<string, any>> {
  private _formState: FormState<T>;
  private _formEl: () => HTMLFormElement;
  private _validations?: Validations<T>;
  private _validateOnChange: boolean;
  private _validateOnBlur: boolean;
  private _getDeepPaths: () => {
    paths: DeepPathInto<T>[];
    flatObject: Record<DeepPathInto<T>, any>;
  };
  private _getAllPaths: () => {
    paths: AllPathInto<T>[];
    flatObject: Record<AllPathInto<T>, any>;
  };
  private _onSubmit: (values: T) => void;
  private _onChange?: (instance: FormValidation<T>) => void;
  private _onBlur?: (instance: FormValidation<T>) => void;
  private _renderFunction: () => void;

  constructor(options: FormValidationConfig<T>) {
    this._formEl = () =>
      document.getElementById(options.formId) as HTMLFormElement;
    this._formState = generateFormState(options.initialValues, options.watch);
    this._validations = options.validations;
    this._validateOnChange = options.validateOnChange ?? true;
    this._validateOnBlur = options.validateOnBlur ?? true;
    this._getDeepPaths = () => getDeepPaths(this.formState.values);
    this._getAllPaths = () => getAllPaths(this.formState.values);
    this._onSubmit = options.onSubmit;
    this._onChange = options.onChange;
    this._onBlur = options.onBlur;
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
    this.renderFormValue(options.initialValues);
  }

  private _handleOnInput() {
    this.formElement.addEventListener("input", (e) => {
      const field = (e.target as HTMLInputElement).name;
      const value = (e.target as HTMLInputElement).value;
      if (this._isDeepPath(field)) {
        this.setFieldTouched({ field, touched: true });
        this.setFieldValue({ field, value });

        // validate on input change
        this._validateOnChange && this.validateField(field);

        this._renderFunction();
      }
      this._onChange?.(this);
    });
  }

  public get isFormValid() {
    for (const field in this.formState.errors) {
      if (this.formState.errors[field]) return false;
    }
    return true;
  }

  private _shouldFormPreventDefault() {
    this._setAllFieldsTouched();
    this.validateForm();
    this._onChange?.(this);
    const action = this.formElement.getAttribute("action");
    if (action === null) return true;
    return !this.isFormValid;
  }

  private _handleOnSubmit() {
    this.formElement.addEventListener("submit", (e) => {
      if (this._shouldFormPreventDefault()) e.preventDefault();

      this._renderFunction?.();

      if (this.isFormValid) this._onSubmit(this.formValues);
    });
  }

  private _handleOnBlur() {
    const inputs = this._getInputElements();
    const formInstance = this;
    inputs.forEach((input) => {
      input.addEventListener("blur", function () {
        const field = this.name;
        if (formInstance._isAllPath(field)) {
          // set field touched on blur
          formInstance.setFieldTouched({
            field,
            touched: true,
          });

          // validate field on blur
          formInstance._validateOnBlur && formInstance.validateField(field);

          formInstance._renderFunction();
          formInstance._onBlur?.(formInstance);
          formInstance._onChange?.(formInstance);
        }
      });
    });
  }

  private _isDeepPath(
    key: string | number | symbol
  ): key is DeepPathInto<FormStateValues<T>> {
    for (const field of this._getDeepPaths().paths) {
      if (field === key) return true;
    }
    return false;
  }

  private _isAllPath(
    key: string | number | symbol
  ): key is AllPathInto<FormStateValues<T>> {
    for (const field of this._getAllPaths().paths) {
      if (field === key) return true;
    }
    return false;
  }

  private _getInputElementByName(
    name: DeepPathInto<T>
  ): HTMLInputElement | undefined {
    const inputs = Array.from(this.formElement.getElementsByTagName("input"));
    return inputs.filter((input) => input.name === name)?.[0];
  }

  private _getInputElements(): HTMLInputElement[] {
    return Array.from(this.formElement.getElementsByTagName("input")).filter(
      (input) => input.type !== "submit"
    );
  }

  private _getErrorElements() {
    return Array.from(
      this.formElement.querySelectorAll('[role="error-message"]')
    ) as HTMLElement[];
  }

  public get formState() {
    return this._formState;
  }

  public get formElement() {
    return this._formEl();
  }

  public validateField(field: AllPathInto<T>) {
    // no validate if field is not touched or no validation provided
    if (!this._validations) return;
    let validation: keyof Validations<T>;
    for (validation in this._validations) {
      const validateFn = this._validations[validation];

      if (validation.endsWith("_item")) {
        const newValidation = validation.substring(
          0,
          validation.lastIndexOf("._item")
        ) as keyof Validations<T>;
        const value = this.getFieldValue(newValidation);
        if (!Array.isArray(value)) continue;
        for (let i = 0; i < value.length; i++) {
          const newField = `${newValidation}.${i}` as keyof Validations<T>;
          if (!this.getFieldTouched(newField)) continue;
          const error = validateFn(value[i]);
          this.setFieldError({
            field: newField,
            error,
          });
        }
        continue;
      }
      if (!this.getFieldTouched(validation)) continue;
      if (!field.startsWith(validation)) continue;
      const value = this.getFieldValue(validation);
      const error = validateFn(value);
      this.setFieldError({ field: validation, error });
    }
  }

  public validateForm() {
    for (const field of this._getAllPaths().paths) this.validateField(field);
  }

  public get formValues() {
    return this.formState.values;
  }

  public get formErrors() {
    return this.formState.values;
  }

  public setFormValue = (value: T) => {
    const { paths, flatObject } = getDeepPaths(value);

    for (const path of paths) {
      this.setFieldValue({ field: path, value: flatObject[path] });
    }
  };

  public renderFormValue = (value: T) => {
    const { paths, flatObject } = getDeepPaths(value);

    for (const path of paths) {
      const element = this._getInputElementByName(path);
      if (!element) continue;
      element.value = flatObject[path];
    }
  };

  public getFieldValue(field: AllPathInto<T>) {
    return getValueByPath(field, this.formState.values);
  }

  public setFieldValue(param: {
    field: DeepPathInto<T>;
    value: FieldState["value"];
  }) {
    const { field, value } = param;
    setValueByPath(field, this._formState.values, value);
  }

  public setFieldTouched(param: {
    field: AllPathInto<T>;
    touched: FieldState["touched"];
  }) {
    const { field, touched } = param;
    setValueByPath(field, this._formState.touched, touched);
  }

  public getFieldTouched(field: AllPathInto<T>) {
    const value = getValueByPath(field, this.formState.touched);
    return isAnyFieldTrue(value);
  }

  private _setAllFieldsTouched() {
    for (const field of this._getDeepPaths().paths)
      this.setFieldTouched({ field, touched: true });
  }

  public getFieldError(field: AllPathInto<T>) {
    return this._formState.errors[field];
  }

  public setFieldError(param: {
    field: AllPathInto<T>;
    error?: FieldState["error"];
  }) {
    const { field, error } = param;
    this._formState.errors[field] = error;

    this._internalRenderError();
  }

  private _internalRenderError() {
    const errorElements = this._getErrorElements();
    for (const errorEl of errorElements) {
      const name = errorEl.getAttribute("name");
      if (!name) continue;
      if (this._isAllPath(name)) {
        errorEl.innerText = this.formState.errors[name] ?? "";
      }
    }
  }
}
