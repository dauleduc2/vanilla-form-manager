// Import stylesheets

import { FormValidation } from "./class";

const formElement = document.getElementById("myForm") as HTMLFormElement;
console.dir(formElement.getElementsByTagName("input"));

const myForm = new FormValidation({
  formId: "myForm",
  initialValues: { fname: "", lname: "" },
  validations: {
    fname: (value) => (!!value ? "" : "required"),
    lname: (value) => (!!value ? "" : "required"),
  },
  onSubmit: (values) => {
    console.log("form submitted", values);
  },
});
