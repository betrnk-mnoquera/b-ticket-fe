function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function transformKeys(obj, keyFn) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, keyFn));
  if (typeof obj !== "object") return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      keyFn(key),
      transformKeys(value, keyFn),
    ])
  );
}

export function toCamelCase(obj) {
  return transformKeys(obj, snakeToCamel);
}

export function toSnakeCase(obj) {
  return transformKeys(obj, camelToSnake);
}
