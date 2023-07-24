// Import stylesheets

import { FormValidation } from "./class";

export default { FormValidation };

const formStateEl = document.querySelector("#form-state");

const showFormState = (state: any) => {
  formStateEl.innerHTML = JSON.stringify(state, null, 2);
};

const initialValues = {
  fname: "",
  age: "",
  address: {
    city: "",
    country: "",
  },
  scores: [{ math: "" }, { physics: "" }],
  hobbies: [""],
};

const myForm = new FormValidation({
  formId: "myForm",
  initialValues,
  validations: {
    fname: (value) => (!!value ? "" : "required"),
    age: (value) => (!!value ? "" : "required"),
    hobbies: (value) => (value.length > 1 ? "" : "at least 2 hobbies"),
    "hobbies._item": (value) => (!!value ? "" : "Required"),
  },
  onSubmit: (values) => {
    console.log("form submitted", values);
  },
  onChange: (instance) => {
    showFormState(instance.formState);
  },
  onBlur: (instance) => {
    showFormState(instance.formState);
    console.log(instance.formState.touched);
  },
  validateOnBlur: false,
  validateOnChange: false,
});

showFormState(myForm.formState);

document.getElementById("add-hobby").addEventListener("click", () => {
  const hobbiesWrapper = document.getElementById("hobbies");
  const hobbies = hobbiesWrapper.getElementsByTagName("input");
  const name: any = `hobbies.${hobbies.length}`;

  const inputEl = document.createElement("input");
  inputEl.setAttribute("name", name);
  inputEl.setAttribute("type", "text");
  inputEl.setAttribute("placeholder", `hobby ${hobbies.length}`);

  const errorEl = document.createElement("div");
  errorEl.setAttribute("class", "error");
  errorEl.setAttribute("role", "error-message");
  errorEl.setAttribute("name", name);
  hobbiesWrapper.appendChild(inputEl);
  hobbiesWrapper.appendChild(errorEl);

  myForm.setFieldValue({ field: name, value: "" });
  myForm.setFieldTouched({ field: name, touched: false });
  myForm.validateField(name);
  showFormState(myForm.formState);
});
