import { FormValidation } from "./class";
import { AllPathInto, DeepPathInto, FormState, Watch } from "./interface";

export const generateFormState = <T extends Record<string, any>>(
  initialValues: T,
  renderDebug: () => void,
  watch?: Watch<T>
) => {
  let object = { errors: {}, touched: {}, values: {} } as FormState<T>;

  object.values = deepCopy(initialValues);
  object.touched = setAllKeysTo(deepCopy(initialValues), false);

  const carry = (parentKey = []) => {
    return {
      get(obj, key) {
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
          const handler =
            watch?.[[...parentKey, key].slice().splice(1).join(`.`)];
          handler?.(value, "", false);
        }
        renderDebug();
        return true;
      },
    };
  };

  return new Proxy<FormState<T>>(object, carry());
};

const setAllKeysTo = <T extends Record<string, any>>(object: T, value: any) => {
  for (const key in object) {
    if (typeof object[key] !== "object") {
      object[key] = value;
    } else {
      object[key] = setAllKeysTo(object[key], value);
    }
  }
  return object;
};

const isValidField = <T extends Record<string, any>>(
  key: string | number | symbol,
  object: T
): key is keyof T => {
  if (key in object) return true;
  return false;
};

const getPaths = <T extends Record<string, any>>(
  obj: T,
  prevKey: string = "",
  prevObj: Record<string, any> = {}
) => {
  const paths: string[] = [];
  const flatObject: Record<string, any> = prevObj as Record<string, any>;
  for (const key in obj) {
    if (!isValidField(key, obj)) return { paths, flatObject };
    const keyToPush = prevKey ? `${prevKey}.${key}` : key;
    if (typeof obj[key] !== "object") {
      paths.push(keyToPush);
      flatObject[keyToPush] = obj[key];
    } else {
      paths.push(keyToPush, ...getPaths(obj[key], keyToPush, flatObject).paths);
    }
  }
  return { paths, flatObject };
};

export const getDeepPaths = <T extends Record<string, any>>(obj: T) => {
  const { paths, flatObject } = getPaths(obj);
  const result: DeepPathInto<T>[] = [];
  const object: Record<DeepPathInto<T>, any> = {} as Record<
    DeepPathInto<T>,
    any
  >;
  for (const path of paths) {
    if (isDeepPath(path, obj)) {
      result.push(path);
      object[path] = flatObject[path];
    }
  }
  return { paths: result, flatObject: object };
};

export const getAllPaths = <T extends Record<string, any>>(obj: T) => {
  const { paths, flatObject } = getPaths(obj);
  const result: AllPathInto<T>[] = [];
  const object: Record<AllPathInto<T>, any> = {} as Record<AllPathInto<T>, any>;
  for (const path of paths) {
    if (isAllPath(path, obj)) {
      result.push(path);
      object[path] = flatObject[path];
    }
  }
  return { paths: result, flatObject: object };
};

export const getValueByPath = <T extends Record<string, any>>(
  path: string,
  object: T
): any => {
  if (!path) return object;
  const keys = path.split(".");
  let result = object;
  for (const key of keys) {
    if (!isValidField(key, result)) throw new Error("invalid key!");
    result = result[key];
  }
  return result;
};

export const setValueByPath = <T extends Record<string, any>>(
  path: string,
  object: T,
  value: any
) => {
  if (!path) throw new Error("invalid key");
  const keys = path.split(".");
  const last = keys.splice(-1);
  const itemToChange = getValueByPath(keys.join("."), object);
  itemToChange[last[0]] = value;
};

export const isDeepPath = <T extends Record<string, any>>(
  path: string,
  object: T
): path is DeepPathInto<T> => {
  try {
    const value = getValueByPath(path, object);
    if (typeof value !== "object") return true;
    return false;
  } catch {
    return false;
  }
};

export const isAllPath = <T extends Record<string, any>>(
  path: string,
  object: T
): path is AllPathInto<T> => {
  try {
    getValueByPath(path, object);
    return true;
  } catch {
    return false;
  }
};

export function deepCopy<T>(instance: T): T {
  if (instance == null) {
    return instance;
  }

  // handle Dates
  if (instance instanceof Date) {
    return new Date(instance.getTime()) as any;
  }

  // handle Array types
  if (instance instanceof Array) {
    const cloneArr = [] as any[];
    (instance as any[]).forEach((value) => {
      cloneArr.push(value);
    });
    // for nested objects
    return cloneArr.map((value: any) => deepCopy<any>(value)) as any;
  }
  // handle objects
  if (instance instanceof Object) {
    const copyInstance = { ...(instance as { [key: string]: any }) } as {
      [key: string]: any;
    };
    for (const attr in instance) {
      if ((instance as Object).hasOwnProperty(attr))
        copyInstance[attr] = deepCopy<any>(instance[attr]);
    }
    return copyInstance as T;
  }
  // handling primitive data types
  return instance;
}

export const isAnyFieldTrue = (value: any) => {
  if (typeof value === "boolean") return value;
  for (const key in value) {
    if (isAnyFieldTrue(value[key])) return true;
  }
  return false;
};

export const handleAdjustWidth = (
  adjustEle: HTMLElement,
  leftEle: HTMLElement,
  rightEle: HTMLElement,
  width: number
) => {
  let mousedown = false;
  let lastMouseDownX;
  adjustEle.addEventListener("mousedown", (e) => {
    mousedown = true;
    if (!lastMouseDownX) lastMouseDownX = e.clientX;
  });

  document.addEventListener("mouseup", (e) => {
    mousedown = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!mousedown) return;

    const bodyWidth = window.innerWidth;
    const rightElWidth = bodyWidth - e.clientX;
    rightEle.style.width = rightElWidth + "px";
  });
};
