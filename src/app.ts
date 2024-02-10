// Import stylesheets

import { FormValidation } from "./class";

export default { FormValidation };

const initialValues = {
  fname: "Duc",
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
  onChange: (instance) => {},
  onBlur: (instance) => {},
  debug: true,
});

// Add event listener for add hobby button
document.getElementById("add-hobby").addEventListener("click", () => {
  const field = "hobbies";
  // add item to array and update UI
  myForm.addArrayItem(
    {
      field,
      value: "",
    },
    () => {
      const hobbiesWrapper = document.getElementById("hobbies-wrapper");
      const hobbies = hobbiesWrapper.querySelectorAll(
        `input[name*='${field}.']`
      );
      console.log(hobbies);
      const name = `${field}.${hobbies.length}`;
      const wrapperEl = document.createElement("div");
      wrapperEl.setAttribute("role", "array-item");
      wrapperEl.setAttribute("style", "display: flex; gap: 10px");

      const inputEl = document.createElement("input");
      inputEl.setAttribute("name", name);
      inputEl.setAttribute("type", "text");
      inputEl.setAttribute("placeholder", `Your hobby...`);

      const errorEl = document.createElement("div");
      errorEl.setAttribute("class", "error");
      errorEl.setAttribute("role", "error-message");
      errorEl.setAttribute("name", name);

      const removeButton = document.createElement("button");
      removeButton.setAttribute("type", "button");
      removeButton.setAttribute("role", "remove-item-button");
      removeButton.setAttribute("data-index", `${hobbies.length}`);
      removeButton.innerText = "Remove";
      addDeleteItemListener(removeButton);
      wrapperEl.appendChild(inputEl);
      wrapperEl.appendChild(errorEl);
      wrapperEl.appendChild(removeButton);

      hobbiesWrapper.appendChild(wrapperEl);
    }
  );
});

// Add event listener for remove hobby button
const addDeleteItemListener = (el: Element) =>
  el.addEventListener("click", () => {
    const removeIndex = parseInt(el.getAttribute("data-index"));

    // remove item from array and update UI
    myForm.removeArrayItem(
      {
        field: `hobbies`,
        index: removeIndex,
      },
      (removeIndex) => {
        // remove & reassign index
        console.log(document.querySelectorAll("[role='array-item']"));
        document
          .querySelectorAll("[role='array-item']")
          .forEach((el, index) => {
            if (index === removeIndex) {
              el.remove();
            }

            if (index > removeIndex) {
              el.querySelector(`input[name='hobbies.${index}']`).setAttribute(
                "name",
                `hobbies.${index - 1}`
              );

              el.querySelector("[role='remove-item-button']").setAttribute(
                "data-index",
                `${index - 1}`
              );
            }
          });
      }
    );
  });

document.querySelectorAll("[role='remove-item-button']").forEach((el) => {
  addDeleteItemListener(el);
});

document.getElementById("reset").addEventListener("click", () => {
  myForm.resetForm();
});
