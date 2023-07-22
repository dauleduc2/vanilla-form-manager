// Import stylesheets

import { FormValidation } from "./class";

export default { FormValidation };

const myForm = new FormValidation({
  formId: "myForm",
  initialValues: { fname: "", lname: "", a: { b: { c: "1" } } },
  validations: {
    fname: (value) => (!!value ? "" : "required"),
    lname: (value) => (!!value ? "" : "required"),
  },
  onSubmit: (values) => {
    console.log("form submitted", values);
  },
  watch: {
    fname: (value) => {
      console.log("fname changes to ", value);
    },
    a: (value) => {
      console.log(value);
    },
  },
});
