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

const text = (t) => document.createTextNode(t);

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

const icon = (name) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  svg.classList.add('bi');
  use.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    `/img/bootstrap-icons.svg#${name}`,
  );
  svg.append(use);
  return svg;
};

const githubLoginButton = () => {
  const span = $('<span>');
  const button = $('<button>');
  button.append(icon('github'));
  button.append($('<span>', 'Log in'));
  span.className = 'github';
  span.append(button);
  return span;
};

const el = (name, text) => {
  const e = document.createElement(name);
  if (text) e.innerText = text;
  return e;
};

const a = (text, href, target) => {
  const e = el('a', text);
  e.setAttribute('href', href);
  if (target) e.setAttribute('target', target);
  return e;
};

const url = (s) => {
  const e = el('a', s);
  e.href = s;
  return e;
};

export { $$, $, a, clear, fill, findDescendant, githubLoginButton, icon, text, url, withClass };
