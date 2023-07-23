import { FormState, PathInto, Value, Watch } from "./interface";

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
            watch[[...parentKey, key].slice().splice(1).join(`.`)];
          handler?.(value, "", false);
        }

        return true;
      },
    };
  };

  return new Proxy<FormState<T>>(object, carry());
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
  prevKey: string = ""
) => {
  const paths: string[] = [];
  for (const key in obj) {
    if (!isValidField(key, obj)) return [];
    const keyToPush = prevKey ? `${prevKey}.${key}` : key;
    if (typeof obj[key] !== "object") {
      paths.push(keyToPush);
    } else {
      paths.push(...getPaths(obj[key], keyToPush));
    }
  }
  if (prevKey) return paths;

  const result: PathInto<T, true>[] = [];
  for (const path of paths) {
    if (isDeepPath(path, obj)) result.push(path);
  }
  return result;
};

export const getDeepPaths = <T extends Record<string, any>>(obj: T) => {
  const paths = getPaths(obj);
  const result: PathInto<T, true>[] = [];
  for (const path of paths) {
    if (isDeepPath(path, obj)) result.push(path);
  }
  return result;
};

const getValueByPath = <T extends Record<string, any>>(
  path: string,
  object: T
): any => {
  if (!path) throw new Error("invalid key");
  const keys = path.split(".");
  let result = object;
  for (const key of keys) {
    if (!isValidField(key, result)) throw new Error("invalid key");
    result = result[key];
  }
  return result;
};

const isDeepPath = <T extends Record<string, any>>(
  path: string,
  object: T
): path is PathInto<T, true> => {
  try {
    if (getValueByPath(path, object)) return true;
    return false;
  } catch {
    return false;
  }
};
