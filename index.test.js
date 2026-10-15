import { describe, it, expect } from "vitest";
import lib from "./index.js";

const { pretty, isValid, minify, diff, paths, safeJson, schemaFromValue } = lib;

describe("pretty", () => {
  it("formats values with 2-space indentation", () => {
    expect(pretty({ hello: "world" })).toBe('{\n  "hello": "world"\n}');
  });
});

describe("isValid", () => {
  it("returns true for valid JSON", () => {
    expect(isValid('{"name":"John"}')).toBe(true);
  });

  it("returns false for broken JSON", () => {
    expect(isValid("{bad")).toBe(false);
  });
});

describe("minify", () => {
  it("removes insignificant whitespace", () => {
    expect(minify('{ "a": 1, "b": 2 }')).toBe('{"a":1,"b":2}');
  });

  it("throws on invalid input", () => {
    expect(() => minify("{bad")).toThrow();
  });
});

describe("diff", () => {
  it("produces RFC 6902 patches with pointer paths", () => {
    expect(
      diff(
        { name: "Ivan", age: 30, tags: ["a", "b"] },
        { name: "Ivan", age: 31, tags: ["a"] }
      )
    ).toEqual([
      { op: "replace", path: "/age", value: 31 },
      { op: "remove", path: "/tags/1" },
    ]);
  });

  it("emits add operations for new keys", () => {
    expect(diff({ a: 1, b: 2 }, { a: 1, b: 2, c: 4 })).toEqual([
      { op: "add", path: "/c", value: 4 },
    ]);
  });

  it("escapes ~ and / in pointer tokens (~0 / ~1)", () => {
    expect(diff({ "a~b": "x", "c/d": "y" }, { "a~b": "z" })).toEqual([
      { op: "replace", path: "/a~0b", value: "z" },
      { op: "remove", path: "/c~1d" },
    ]);
  });

  it("treats objects equal regardless of key order (deepEqual)", () => {
    expect(diff({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([]);
  });

  it("compares arrays element-wise including length changes", () => {
    expect(diff([1, 2, 3], [1, 5])).toEqual([
      { op: "replace", path: "/1", value: 5 },
      { op: "remove", path: "/2" },
    ]);
    expect(diff([1], [1, 2, 3])).toEqual([
      { op: "add", path: "/1", value: 2 },
      { op: "add", path: "/2", value: 3 },
    ]);
  });

  it("replaces the root when types differ", () => {
    expect(diff({ a: 1 }, [1])).toEqual([{ op: "replace", path: "", value: [1] }]);
  });

  it("throws RangeError on circular references", () => {
    const before = {};
    before.self = before;
    const after = {};
    after.self = after;
    expect(() => diff(before, after)).toThrow(RangeError);
  });
});

describe("paths", () => {
  it("collects nested object and array paths", () => {
    expect(paths({ user: { name: "Ivan" }, items: [1, { k: 2 }] })).toEqual([
      "$",
      "$.user",
      "$.user.name",
      "$.items",
      "$.items[0]",
      "$.items[1]",
      "$.items[1].k",
    ]);
  });

  it("returns just the root for primitives", () => {
    expect(paths(42)).toEqual(["$"]);
  });

  it("supports a custom prefix", () => {
    expect(paths({ a: 1 }, "root")).toEqual(["root", "root.a"]);
  });

  it("throws RangeError on circular references", () => {
    const cyc = {};
    cyc.self = cyc;
    expect(() => paths(cyc)).toThrow(RangeError);
  });
});

describe("safeJson", () => {
  it("returns ok:true with parsed data", () => {
    expect(safeJson('{"a":1}')).toEqual({ ok: true, data: { a: 1 } });
  });

  it("returns ok:false with an Error for broken JSON", () => {
    const result = safeJson("{bad");
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });

  it("never throws on undefined input", () => {
    const result = safeJson(undefined);
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

describe("schemaFromValue", () => {
  it("infers object schema with properties and required", () => {
    expect(schemaFromValue({ id: 1, name: "x" })).toEqual({
      type: "object",
      properties: { id: { type: "number" }, name: { type: "string" } },
      required: ["id", "name"],
    });
  });

  it("maps null to { type: 'null' }", () => {
    expect(schemaFromValue(null)).toEqual({ type: "null" });
  });

  it("uses empty schema for items of an empty array", () => {
    expect(schemaFromValue([])).toEqual({ type: "array", items: {} });
  });

  it("infers item schema from the first element", () => {
    expect(schemaFromValue([1, 2])).toEqual({
      type: "array",
      items: { type: "number" },
    });
  });

  it("recurses into nested objects", () => {
    expect(schemaFromValue({ meta: { age: 30 } })).toEqual({
      type: "object",
      properties: {
        meta: {
          type: "object",
          properties: { age: { type: "number" } },
          required: ["age"],
        },
      },
      required: ["meta"],
    });
  });
});
