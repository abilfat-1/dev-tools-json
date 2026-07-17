# dev-tools-json

A tiny JavaScript utility for formatting, validating and minifying JSON.

## Features

- Pretty-print JSON
- Validate JSON strings
- Minify JSON

## Installation

```bash
npm install
```

## Usage

```js
const { pretty, isValid, minify } = require("./index");

console.log(pretty({ hello: "world" }));

console.log(isValid('{"name":"John"}'));

console.log(minify('{ "a": 1, "b": 2 }'));
```

## License

MIT
