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

const span = (clazz, html) => {
  const s = document.createElement('span');
  s.classList.add(clazz);
  if (html !== undefined) s.innerHTML = html;
  return s;
};

class Repl {
  constructor(div) {
    this.div = div;
    this.cursor = span('cursor', '&nbsp;');
    this.keybindings = new Keybindings();

    this.keybindings.bind({
      Backspace: this.backspace,
      Enter: this.enter,
      ArrowLeft: this.left,
      ArrowRight: this.right,
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
        b.call(this, x);
        this.maybeHighlightBracket();
        e.stopPropagation();
        e.preventDefault();
      }
    };

    this.div.onpaste = (e) => {
      const data = e.clipboardData.getData('text/plain');
      data.forEach((c) => {
        const x = { key: c, ctrlKey: false, metaKey: false, altKey: false };
        const b = this.keybindings.getBinding(x);
        if (b) {
          b.call(this, x);
        }
      });
    };
  }

  start() {
    this.divAndPrompt();
    this.div.focus();
  }

  /*
   * Make the div containing a prompt and the cursor.
   */
  divAndPrompt() {
    const div = document.createElement('div');
    div.append(span('prompt', '»'));
    div.append(span('bol'));
    div.append(this.cursor);
    div.append(span('eol'));
    this.div.append(div);
  }

  maybeHighlightBracket() {
    this.cursor.parentElement.querySelectorAll('.highlight').forEach((e) => {
      e.classList.remove('highlight');
      e.classList.remove('wrong-bracket');
    });

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
    this.divAndPrompt();
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

  bol() {
    const bol = this.cursor.parentElement.querySelector('.bol');
    this.cursor.parentElement.insertBefore(this.cursor, bol.nextSibling);
  }

  eol() {
    const eol = this.cursor.parentElement.querySelector('.eol');
    this.cursor.parentElement.insertBefore(this.cursor, eol);
  }
}

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
    if (descriptor.length === 1) {
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

new Repl(document.getElementById('repl')).start();
