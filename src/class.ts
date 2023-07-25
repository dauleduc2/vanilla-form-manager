import {
  FormState,
  Validations,
  FieldState,
  FormValidationConfig,
  FormStateValues,
  DeepPathInto,
  AllPathInto,
  FormStateTouched,
  FormStateErrors,
  Watch,
} from "./interface";
import {
  deepCopy,
  generateFormState,
  getAllPaths,
  getDeepPaths,
  getValueByPath,
  handleAdjustWidth,
  isAnyFieldTrue,
  setValueByPath,
} from "./utils";

export class FormValidation<T extends Record<string, any>> {
  public initialValues: T;
  private _debug: boolean;
  private _formState: FormState<T>;
  private _watch: Watch<T>;
  private _formEl: () => HTMLFormElement;
  private _validations?: Validations<T>;
  private _validateOnChange: boolean;
  private _validateOnBlur: boolean;
  private _allPaths: AllPathInto<T>[];
  private _deepPaths: DeepPathInto<T>[];
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
  private _renderFunction?: () => void;

  constructor(options: FormValidationConfig<T>) {
    this.initialValues = deepCopy(options.initialValues);
    this._formEl = () =>
      document.getElementById(options.formId) as HTMLFormElement;
    this._debug = options.debug ?? false;
    this._formState = generateFormState(
      options.initialValues,
      this._renderDebug,
      options.watch
    );
    this._watch = options.watch;
    this._validations = options.validations;
    this._validateOnChange = options.validateOnChange ?? true;
    this._validateOnBlur = options.validateOnBlur ?? true;
    this._getDeepPaths = () => getDeepPaths(this.formState.values);
    this._getAllPaths = () => getAllPaths(this.formState.values);
    this._allPaths = this._getAllPaths().paths;
    this._deepPaths = this._getDeepPaths().paths;
    this._onSubmit = options.onSubmit;
    this._onChange = options.onChange;
    this._onBlur = options.onBlur;
    this._renderFunction = options.renderError
      ? () => {
          options.renderError?.(
            this.formState,
            this.formElement,
            this._getInputElements()
          );
        }
      : undefined;

    this._handleOnInput();
    this._handleOnBlur();
    this._handleOnSubmit();
    this.renderFormValue(options.initialValues);
    this._renderDebug();
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

      if (this.isFormValid) this._onSubmit(this.formValues);
    });
  }

  private _handleBlurCb = (e: FocusEvent) => {
    const field = (e.target as HTMLInputElement).name;
    if (this._isAllPath(field)) {
      // set field touched on blur
      this.setFieldTouched({
        field,
        touched: true,
      });

      // validate field on blur
      this._validateOnBlur && this.validateField(field);

      this._onBlur?.(this);
      this._onChange?.(this);
    }
  };

  private _handleOnBlur() {
    const inputs = this._getInputElements();
    inputs.forEach((input) =>
      input.removeEventListener("blur", this._handleBlurCb)
    );
    inputs.forEach((input) =>
      input.addEventListener("blur", this._handleBlurCb)
    );
  }

  private _renderDebug = () => {
    if (!this._debug) return;
    const defaultWidth = 300;
    const debugWrapperId = "vanilla-form-manager-debugger";
    const debugContentId = "vanilla-form-manager-debugger-content";
    const debugAdjustId = "vanilla-form-manager-debugger-adjust";
    const debugEl = document.getElementById(debugWrapperId);
    const content = `<pre>${JSON.stringify(this.formState, null, 2)}</pre>`;
    if (debugEl) {
      debugEl.querySelector(`#${debugContentId}`).innerHTML = content;
    } else {
      const debugWrapperEl = document.createElement("div");
      const debugContentEl = document.createElement("div");
      const debugAdjustEl = document.createElement("div");
      const debugCloseEl = document.createElement("button");
      debugWrapperEl.id = debugWrapperId;
      debugContentEl.id = debugContentId;
      debugAdjustEl.id = debugAdjustId;
      debugWrapperEl.appendChild(debugContentEl);
      debugWrapperEl.appendChild(debugAdjustEl);
      debugWrapperEl.appendChild(debugCloseEl);
      handleAdjustWidth(
        debugAdjustEl,
        document.body,
        debugContentEl,
        defaultWidth
      );
      debugWrapperEl.setAttribute(
        "style",
        `
        position: fixed;
        height: 100vh;
        right: 0;
        top: 0;
        box-sizing: border-box
        `
      );
      debugAdjustEl.setAttribute(
        "style",
        `
        position: absolute;
        left: 0;
        top: 0;
        width: 5px;
        height: 100%;
        background: #cf0e56;
        cursor: col-resize
        `
      );
      debugContentEl.setAttribute(
        "style",
        `
        color: white;
        width: 300px;
        padding-left: 20px;
        height: 100%;
        background-color: #ec5990;
        box-sizing: border-box;
        display: flex;
      `
      );
      debugCloseEl.setAttribute(
        "style",
        `
      position: fixed;
      bottom: 10px;
      right: 10px;
      `
      );
      debugContentEl.innerHTML = content;
      debugCloseEl.innerHTML = "Form Manager Debug";
      document.body.appendChild(debugWrapperEl);
      debugCloseEl.addEventListener("click", () => {
        const display = debugContentEl.style.display;
        if (display === "flex") return (debugContentEl.style.display = "none");
        debugContentEl.style.display = "flex";
      });
    }
  };

  private _isDeepPath(
    key: string | number | symbol
  ): key is DeepPathInto<FormStateValues<T>> {
    for (const field of this._deepPaths) {
      if (field === key) return true;
    }
    return false;
  }

  private _isAllPath(
    key: string | number | symbol
  ): key is AllPathInto<FormStateValues<T>> {
    for (const field of this._allPaths) {
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
    for (const field of this._allPaths) this.validateField(field);
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

  public resetForm = () => {
    this._formState = generateFormState(
      deepCopy(this.initialValues),
      this._renderDebug,
      this._watch
    );
    this.renderFormValue(this.initialValues);
    this._internalRenderError();
  };

  public renderFormValue = (value: T) => {
    const { paths, flatObject } = getDeepPaths(value);

    for (const path of paths) {
      const element = this._getInputElementByName(path);
      if (!element) continue;
      element.value = flatObject[path];
    }
  };

  private _updatePaths = () => {
    this._allPaths = this._getAllPaths().paths;
    this._deepPaths = this._getDeepPaths().paths;
    this._handleOnBlur();
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
    if (!this._allPaths.includes(field)) this._updatePaths();
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
    for (const field of this._deepPaths)
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
    if (this._renderFunction) return this._renderFunction();
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
