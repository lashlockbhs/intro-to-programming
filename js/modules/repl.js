import * as acorn from 'acorn';

// NOTES:

// 1. The Shift and Alt key (at least) are both modifiers but also change the
// value of `key` in the Keyboard Event. Therefore some syntactically correct
// bindings such as Alt-d are impossible because the Alt turns the d into ∂.
// Similarly a binding like Shift-a would never happen because only Shift-A can
// occur. (Probably for Shift at least we should just not include it in
// bindings.)

// TODO:

// - History on up and down arrow.
// - Shift movement for selection.
// - Token colorizing.

const OPTS = { ecmaVersion: 2022 };

const textNode = (s) => document.createTextNode(s);

const pretty = (v) => {
  // This could be a lot better but I'd have to write an actual recursive pretty
  // printer.
  if (v === null || v === undefined) {
    return String(v);
  }

  switch (v.constructor.name) {
    case 'Boolean':
    case 'Function':
    case 'Number':
    case 'String':
    case 'Array':
    case 'Object':
      // ideally we'd use Javascript syntax (i.e. no quotes on properties that
      // don't need them but this will do for now.
      return JSON.stringify(v);

    default:
      return `${v.constructor.name} ${JSON.stringify(v)}`;
  }
};

const isExpression = (code) => {
  try {
    const p = acorn.parseExpressionAt(code, 0, OPTS);
    if (p.end === code.length) {
      return true;
    }
  } catch (e) {
    // Fallthru to next way
  }

  try {
    const p = acorn.parse(code, OPTS);
    return p.body.length === 1 && p.body[0].type === 'ExpressionStatement';
  } catch (e) {
    return false;
  }
};

const span = (clazz, html) => {
  const s = document.createElement('span');
  s.classList.add(clazz);
  if (html !== undefined) s.innerHTML = html;
  return s;
};

class Repl {
  constructor(id) {
    this.console = new Console((text) => this.log(text));

    this.evaluate = () => {
      throw new Error('Must set repl.evaluate');
    };

    this.div = document.getElementById(id);
    this.div.setAttribute('autofocus', true);
    this.div.setAttribute('tabindex', 0);
    this.cursor = span('cursor', '&nbsp;');
    this.keybindings = new Keybindings();
    this.current = null;
    this.history = [];
    this.historyPosition = 0;

    this.keybindings.bind({
      Backspace: this.backspace,
      Enter: this.enter,
      ArrowLeft: this.left,
      ArrowRight: this.right,
      ArrowUp: this.backInHistory,
      ArrowDown: this.forwardInHistory,
      'Control-a': this.bol,
      'Control-e': this.eol,
      '(': (x) => this.openBracket(x, 'paren'),
      ')': (x) => this.closeBracket(x, 'paren'),
      '[': (x) => this.openBracket(x, 'square'),
      ']': (x) => this.closeBracket(x, 'square'),
      '{': (x) => this.openBracket(x, 'curly'),
      '}': (x) => this.closeBracket(x, 'curly'),
    });

    this.keybindings.bindDefault(this.selfInsert);

    this.div.onkeydown = (e) => {
      // Extract the bits we care about.
      const { key, ctrlKey, metaKey, altKey } = e;
      const x = { key, ctrlKey, metaKey, altKey };
      const b = this.keybindings.getBinding(x);

      if (b) {
        this.clearHighlights();
        b.call(this, x);
        this.maybeHighlightBracket();
        e.stopPropagation();
        e.preventDefault();
      }
    };

    this.div.onpaste = (e) => {
      const data = e.clipboardData.getData('text/plain');
      [...data].forEach((c) => {
        const x = { key: c, ctrlKey: false, metaKey: false, altKey: false };
        const b = this.keybindings.getBinding(x);
        if (b) {
          b.call(this, x);
        }
      });
    };
  }

  restart() {
    this.div.replaceChildren();
    this.newPrompt();
    this.div.focus();
  }

  /*
   * Output a log line in the repl div.
   */
  log(text) {
    this.toRepl(text, 'log');
  }

  /*
   * Make the div containing a prompt and the cursor.
   */
  newPrompt() {
    const div = newDivAndPrompt();
    this.addCursor(div);
    this.div.append(div);
    this.current = div;
    this.cursor.scrollIntoView();
  }

  /*
   * Emit a message to the repl.
   */
  message(text) {
    this.toRepl(textNode(text), 'message');
  }

  /*
   * Emit an error to the repl.
   */
  error(text) {
    this.toRepl(textNode(text), 'error');
    this.newPrompt();
  }

  /*
   * Output a value to the repl.
   */
  print(value) {
    const span = document.createElement('span');
    const arrow = document.createElement('span');
    arrow.classList.add('output');
    arrow.append(textNode('⇒ '));
    span.append(arrow);
    span.append(textNode(pretty(value)));
    this.toRepl(span, 'value');
    this.newPrompt();
  }

  /*
   * Output to the repl with a particular CSS class.
   */
  toRepl(text, clazz) {
    const div = document.createElement('div');
    div.classList.add(clazz);
    div.append(text);
    this.div.append(div);
  }

  addCursor(div) {
    const eol = div.querySelector('.eol');
    eol.parentElement.insertBefore(this.cursor, eol);
  }

  clearHighlights() {
    this.cursor.parentElement.querySelectorAll('.highlight').forEach((e) => {
      e.classList.remove('highlight');
      e.classList.remove('wrong-bracket');
    });
  }

  maybeHighlightBracket() {
    const before = this.cursor.previousSibling;
    const after = this.cursor.nextSibling;
    if (isClose(before)) {
      let closed = 0;
      for (let n = before; !isBol(n); n = n.previousSibling) {
        if (isClose(n)) {
          closed++;
        } else if (isOpen(n)) {
          closed--;
        }
        if (closed === 0) {
          before.classList.add('highlight');
          n.classList.add('highlight');
          if (bracketKind(before) !== bracketKind(n)) {
            n.classList.add('wrong-bracket');
          }
          break;
        }
      }
    }
    if (isOpen(after)) {
      let open = 0;
      for (let n = after; !isEol(n); n = n.nextSibling) {
        if (isOpen(n)) {
          open++;
        } else if (isClose(n)) {
          open--;
        }
        if (open === 0) {
          after.classList.add('highlight');
          n.classList.add('highlight');
          if (bracketKind(after) !== bracketKind(n)) {
            n.classList.add('wrong-bracket');
          }
          break;
        }
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Commands

  selfInsert(x) {
    this.cursor.parentElement.insertBefore(document.createTextNode(x.key), this.cursor);
  }

  openBracket(x, kind) {
    const p = span('open', x.key);
    p.classList.add(kind);
    this.cursor.parentElement.insertBefore(p, this.cursor);
  }

  closeBracket(x, kind) {
    const p = span('close', x.key);
    p.classList.add(kind);
    this.cursor.parentElement.insertBefore(p, this.cursor);
  }

  backspace() {
    const e = this.cursor.previousSibling;
    if (!isBol(e)) {
      if (e.nodeType === 3 || e.nodeType === 1) {
        e.parentElement.removeChild(e);
      }
    }
  }

  enter() {
    this.cursor.parentElement.removeChild(this.cursor);
    this.history.push(this.current);
    this.historyPosition = this.history.length; // after end of history.

    let text = this.current.querySelector('.text').innerText;

    if (isExpression(text.trim())) {
      while (text.endsWith(';')) {
        text = text.substring(0, text.length - 1);
      }
      this.evaluate(`repl.print(\n${text}\n)`, 'repl');
    } else {
      this.evaluate(`\n${text}\nrepl.message("Ok.");`, 'repl');
      this.newPrompt();
    }
  }

  left() {
    const e = this.cursor.previousSibling;
    if (!isBol(e)) {
      if (e.nodeType === 3 || e.nodeType === 1) {
        e.parentElement.insertBefore(this.cursor, e);
      }
    }
  }

  right() {
    const e = this.cursor.nextSibling;
    if (!isEol(e)) {
      if (e.nodeType === 3 || e.nodeType === 1) {
        e.parentElement.insertBefore(this.cursor, e.nextSibling);
      }
    }
  }

  backInHistory() {
    if (this.historyPosition > 0) {
      this.goToHistory(this.historyPosition - 1);
    }
  }

  forwardInHistory() {
    if (this.historyPosition < this.history.length - 1) {
      this.goToHistory(this.historyPosition + 1);
    } else if (this.historyPosition < this.history.length) {
      this.historyPosition++;
      this.makeCurrent(newDivAndPrompt());
    }
  }

  goToHistory(pos) {
    this.historyPosition = pos;
    this.makeCurrent(this.history[this.historyPosition].cloneNode(true));
  }

  makeCurrent(div) {
    this.current.replaceWith(div);
    this.current = div;
    this.addCursor(this.current);
  }

  bol() {
    const bol = this.cursor.parentElement.querySelector('.bol');
    this.cursor.parentElement.insertBefore(this.cursor, bol.nextSibling);
  }

  eol() {
    const eol = this.cursor.parentElement.querySelector('.eol');
    this.cursor.parentElement.insertBefore(this.cursor, eol);
  }
}

/*
 * A fake console.
 */
class Console {
  constructor(logFn) {
    this.logFn = logFn;
  }

  log(...text) {
    this.logFn(stringify(text));
  }

  info(...text) {
    this.logFn(`INFO: ${stringify(text)}`);
  }

  warn(...text) {
    this.logFn(`WARN: ${stringify(text)}`);
  }

  error(...text) {
    this.logFn(`ERROR: ${stringify(text)}`);
  }

  debug(...text) {
    this.logFn(`DEBUG: ${stringify(text)}`);
  }
}

const stringify = (args) => args.map(String).join(' ');

////////////////////////////////////////////////////////////////////////////////
// Bindings

class Keybindings {
  static descriptor(x) {
    const keys = [];
    // Note: Alt and Meta are likely different on different OSes.
    // If we actually use bindings for either of those may need to
    // provide an option to flip their meaning.
    if (x.ctrlKey) keys.push('Control');
    if (x.altKey) keys.push('Alt');
    if (x.metaKey) keys.push('Meta');
    if (keys.indexOf(x.key) === -1) keys.push(x.key);
    return keys.join('-');
  }

  bind(bindings) {
    this.bindings = bindings;
  }

  bindDefault(defaultBinding) {
    this.defaultBinding = defaultBinding;
  }

  getBinding(e) {
    const descriptor = Keybindings.descriptor(e);

    if (descriptor in this.bindings) {
      // console.log(`${descriptor} is bound`);
      return this.bindings[descriptor];
    }
    if (!(e.ctrlKey || e.altKey || e.metaKey) && [...e.key].length === 1) {
      // console.log(`Using default binding for ${descriptor}`);
      return this.defaultBinding;
    }
    // console.log(`No binding for ${descriptor}`);
    return false;
  }
}

const hasClass = (n, clazz) => n.classList && n.classList.contains(clazz);

const isBol = (n) => hasClass(n, 'bol');

const isEol = (n) => hasClass(n, 'eol');

const isClose = (n) => hasClass(n, 'close');

const isOpen = (n) => hasClass(n, 'open');

const bracketKind = (n) => ['paren', 'square', 'curly'].find((k) => hasClass(n, k));

const newDivAndPrompt = () => {
  const div = document.createElement('div');
  div.append(span('prompt', '»'));

  const text = span('text');
  text.append(span('bol'));
  text.append(span('eol'));
  div.append(text);
  return div;
};

const replize = (id) => new Repl(id);

export default replize;
