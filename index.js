function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function isValid(json) {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

function minify(json) {
  return JSON.stringify(JSON.parse(json));
}

module.exports = {
  pretty,
  isValid,
  minify,
};
