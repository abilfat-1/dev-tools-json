"use strict";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const escapePointerToken = (token) =>
  String(token).replace(/~/g, "~0").replace(/\//g, "~1");

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) || isRecord(a)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }
  return Number.isNaN(a) && Number.isNaN(b);
};

/** Formats any JSON-serializable value as a pretty-printed string with 2-space indentation. */
const pretty = (value) => JSON.stringify(value, null, 2);

/** Returns true when the given string is valid JSON, false otherwise. */
const isValid = (json) => {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
};

/** Minifies a JSON string by removing all insignificant whitespace; throws on invalid input. */
const minify = (json) => JSON.stringify(JSON.parse(json));

/** Computes an RFC 6902 JSON Patch (add/remove/replace with escaped JSON Pointers) between two values. */
const diff = (before, after, base = "", out = []) => {
  if (deepEqual(before, after)) return out;

  const bothRecords = isRecord(before) && isRecord(after);
  const bothArrays = Array.isArray(before) && Array.isArray(after);

  if (bothRecords) {
    for (const key of Object.keys(before)) {
      const pointer = `${base}/${escapePointerToken(key)}`;
      if (!(key in after)) out.push({ op: "remove", path: pointer });
      else diff(before[key], after[key], pointer, out);
    }
    for (const key of Object.keys(after)) {
      if (!(key in before)) {
        out.push({ op: "add", path: `${base}/${escapePointerToken(key)}`, value: after[key] });
      }
    }
    return out;
  }

  if (bothArrays) {
    const shared = Math.min(before.length, after.length);
    for (let i = 0; i < shared; i++) diff(before[i], after[i], `${base}/${i}`, out);
    for (let i = before.length - 1; i >= after.length; i--) {
      out.push({ op: "remove", path: `${base}/${i}` });
    }
    for (let i = before.length; i < after.length; i++) {
      out.push({ op: "add", path: `${base}/${i}`, value: after[i] });
    }
    return out;
  }

  out.push(
    base === ""
      ? { op: "replace", path: "", value: after }
      : { op: "replace", path: base, value: after }
  );
  return out;
};

/** Lists every JSONPath (e.g. `$.items[1].k`) reachable in the given value, including intermediate nodes. */
const paths = (value, prefix = "$") => {
  const collected = [];
  const walk = (node, pointer) => {
    collected.push(pointer);
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${pointer}[${index}]`));
    } else if (isRecord(node)) {
      for (const key of Object.keys(node)) walk(node[key], `${pointer}.${key}`);
    }
  };
  walk(value, prefix);
  return collected;
};

/** Parses JSON without throwing, returning `{ ok: true, data }` or `{ ok: false, error }`. */
const safeJson = (text) => {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
};

/** Infers a minimal JSON Schema (`type`, `properties`, `required`, `items`) from a concrete value. */
const schemaFromValue = (value) => {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    return value.length > 0
      ? { type: "array", items: schemaFromValue(value[0]) }
      : { type: "array", items: {} };
  }
  if (isRecord(value)) {
    const properties = {};
    for (const [key, child] of Object.entries(value)) properties[key] = schemaFromValue(child);
    return { type: "object", properties, required: Object.keys(properties) };
  }
  return { type: typeof value };
};

module.exports = {
  pretty,
  isValid,
  minify,
  diff,
  paths,
  safeJson,
  schemaFromValue,
};
