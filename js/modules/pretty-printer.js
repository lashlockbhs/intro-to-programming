const pretty = (value) => {
  if (value === null || value === undefined) {
    return String(value);
  }

  switch (value.constructor.name) {
    case 'Boolean':
    case 'Function':
    case 'Number':
      return String(value);

    case 'Array':
      return prettyArray(value);

    case 'Object':
      return prettyObject(value);

    case 'String':
      return prettyString(value);

    default:
      return prettyInstance(value);
  }
};

const prettyArray = (a) => {
  return `[${a.map(pretty).join(', ')}]`;
};

const prettyObject = (o) => {
  const pair = ([k, v]) => `${asName(k)}: ${pretty(v)}`;

  return `{ ${Object.entries(o).map(pair).join(', ')} }`;
};

const prettyString = (s) => {
  return `'${[...s].map((cp) => maybeEscape(cp)).join('')}'`;
};

const prettyInstance = (i) => {
  return `${i.constructor.name} ${prettyObject(i)}`;
};

const maybeEscape = (c) => {
  switch (c) {
    case "'":
      return "\\'";
    case '\\':
      return '\\\\';
    case '\b':
      return '\\b';
    case '\f':
      return '\\f';
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\t':
      return '\\t';
    case '\v':
      return '\\v';
    default:
      return c;
  }
};

const asName = (n) => (n.match(/^\w+$/) ? n : prettyString(n));

export default pretty;
