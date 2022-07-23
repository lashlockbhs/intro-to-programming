/*
 * We have jQuery at home!
 */

function $(s, t) {
  if (s === undefined) {
    return $('<i>', 'undefined');
  } else if (s[0] === '#') {
    return document.getElementById(s.substring(1));
  } else if (s[0] === '<') {
    const e = document.createElement(s.substring(1, s.length - 1));
    if (t !== undefined) {
      e.append($(t));
    }
    return e;
  } else {
    return document.createTextNode(s);
  }
}

const $$ = (selector) => document.querySelectorAll(selector);


/*
 * Remove all the children from the given DOM element.
 */
function clear(e) {
  while (e.firstChild) {
    e.removeChild(e.lastChild);
  }
  return e;
}

/*
 * Decorate a DOM element with a CSS class.
 */
function withClass(className, e) {
  e.className = className;
  return e;
}

/*
 * Find a child matching a predicate.
 */
function findChild(e, fn) {
  for (const c of e.children) {
    if (fn(c)) {
      return c;
    }
  }
  return undefined;
}

/*
 * Fill an element under parent that matches selector with a number of elements.
 */
const fill = (parent, selector, ...what) => {
  const e = parent.querySelector(selector);
  e.replaceChildren(...what);
};

/*
 * Find a descendant matching a predicate.
 */
function findDescendant(e, fn) {
  for (const c of e.children) {
    if (fn(c)) {
      return c;
    } else {
      const x = findDescendant(c, fn);
      if (x !== undefined) {
        return x;
      }
    }
  }
  return undefined;
}

export { $, $$, clear, fill, findChild, findDescendant, withClass };
