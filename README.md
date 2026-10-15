# dev-tools-json

A tiny JavaScript utility for formatting, validating, diffing and introspecting JSON.

## Features

- Pretty-print JSON (`pretty`)
- Validate JSON strings (`isValid`)
- Minify JSON (`minify`)
- RFC 6902 JSON Patch diff (`diff`)
- JSONPath listing (`paths`)
- Non-throwing JSON parsing (`safeJson`)
- Minimal JSON Schema inference (`schemaFromValue`)

## Installation

```bash
npm install
```

## Usage

```js
const { pretty, isValid, minify, diff, paths, safeJson, schemaFromValue } = require("./index");
```

### pretty / isValid / minify

```js
console.log(pretty({ hello: "world" }));
// {
//   "hello": "world"
// }

console.log(isValid('{"name":"John"}')); // true
console.log(isValid("{bad"));            // false

console.log(minify('{ "a": 1, "b": 2 }')); // {"a":1,"b":2}
```

### diff

Computes an [RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902) JSON Patch between two values. Paths are JSON Pointers, with `~` escaped as `~0` and `/` as `~1`. Objects are compared structurally, so key order does not matter.

```js
diff(
  { name: "Ivan", age: 30, tags: ["a", "b"] },
  { name: "Ivan", age: 31, tags: ["a"] }
);
// [{ op: "replace", path: "/age", value: 31 }, { op: "remove", path: "/tags/1" }]

diff({ "a~b": "x", "c/d": "y" }, { "a~b": "z" });
// [{ op: "replace", path: "/a~0b", value: "z" }, { op: "remove", path: "/c~1d" }]

diff({ a: 1, b: 2 }, { b: 2, a: 1 }); // [] — key order is irrelevant
```

### paths

Lists every reachable path in a value, including intermediate nodes.

```js
paths({ user: { name: "Ivan" }, items: [1, { k: 2 }] });
// ["$", "$.user", "$.user.name", "$.items", "$.items[0]", "$.items[1]", "$.items[1].k"]
```

### safeJson

Parses JSON without throwing — returns `{ ok: true, data }` or `{ ok: false, error }`.

```js
safeJson('{"a":1}');  // { ok: true, data: { a: 1 } }
safeJson("{bad");     // { ok: false, error: SyntaxError }
safeJson(undefined);  // { ok: false, error: Error } — never throws
```

### schemaFromValue

Infers a minimal JSON Schema (`type`, `properties`, `required`, `items`) from a concrete value.

```js
schemaFromValue({ id: 1, name: "x" });
// { type: "object", properties: { id: { type: "number" }, name: { type: "string" } }, required: ["id", "name"] }

schemaFromValue([]);   // { type: "array", items: {} }
schemaFromValue(null); // { type: "null" }
```

## Tests

```bash
npm test
```

## License

MIT
