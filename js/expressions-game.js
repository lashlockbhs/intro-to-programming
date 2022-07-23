import { $, $$ } from './modules/whjqah';
import makeTable from './modules/table';

const circle = '⚬';
const checkmark = '✓';
const x = '×';

const generators = {
  positive: () => 1 + Math.floor(Math.random() * 100),
  number: () => -100 + Math.random() * 2 * 100,
};

class Expressions {
  constructor(divs, marks) {
    this.expressions = Array.from(divs).map((div, i) => new Expression(this, div, i));
    this.answers = {};
    this.i = 0;
    this.current = this.expressions[this.i];
    this.expressions.forEach((e) => {
      e.hide();
      marks.appendChild(e.marker);
    });
  }

  switchTo(exp) {
    this.current.hide();
    this.current = exp;
    this.current.show();
  }

  next() {
    const currentIndex = this.current.index;
    for (let i = 0; i < this.expressions.length; i++) {
      const j = (i + currentIndex + 1) % this.expressions.length;
      const exp = this.expressions[j];
      if (!exp.correct) {
        return exp;
      }
    }
    return void 0;
  }
}

class Expression {
  constructor(expressions, div, index) {
    this.expressions = expressions;
    this.div = div;
    this.index = index;

    this.name = div.querySelector('h1').innerText;
    this.marker = $('<span>', circle);
    this.answer = null;

    const input = div.dataset.variables.split(',').map((s) => s.split(':'));
    this.variables = input.map((x) => x[0]);
    this.generators = input.map((x) => generators[x[1]]);
    this.expectedFn = Function(this.variables, `return (${div.dataset.expression});`);

    this.marker.onclick = () => expressions.switchTo(this);
  }

  hide() {
    this.div.hidden = true;
  }

  show() {
    this.div.hidden = false;
  }

  check(answer) {
    this.answer = answer;
    this.results = Array(100).fill().map(this.checker(answer));
    this.correct = this.results.every((r) => r.passed);
    this.marker.replaceChildren(document.createTextNode(this.correct ? checkmark : x));
    return this.correct;
  }

  checker(answer) {
    const fn = Function(this.variables, `return (${answer});`);

    return () => {
      const args = this.generators.map((g) => g());
      const expected = this.expectedFn(...args);
      try {
        const got = fn(...args);
        const passed = equal(expected, got);
        return { args, expected, got, passed };
      } catch (e) {
        return { args, expected, e, passed: false };
      }
    };
  }
}

const equal = (a, b) => {
  if (Number.isInteger(a) && Number.isInteger(b)) {
    return a === b;
  } else {
    // Check non integers by relative tolerance.
    const relError = Math.abs(a - b) / Math.abs((a + b) / 2);
    // This is probably way too conservative
    return relError <= 0.00001;
  }
};

const completedTable = () => {
  const t = makeTable();
  t.addColumn('Problem', 'problem');
  t.addColumn('Answer', 'answer');
  t.addColumn('Ok?', 'ok');
  return t;
};

const problems = (expr) => {
  const t = makeTable();
  t.table.className = 'problems';
  expr.variables.forEach((v) => t.addColumn(v, 'variable'));
  t.addColumn('Expected', 'expected');
  t.addColumn('Got', 'got');
  expr.results.forEach((r) => {
    if (!r.passed) {
      t.addRow([...r.args, r.expected, r.got ?? r.e]);
    }
  });
  return t.table;
};

const completed = completedTable();

$('#completed').replaceChildren(completed.table);

const expressions = new Expressions(
  $$('.expressions .expression'),
  document.querySelector('.expressions .marks'),
);

expressions.current.show();

$('#expression-input').onchange = (e) => {
  const expr = expressions.current;

  try {
    expr.check(e.target.value);

    if (!expr.correct) {
      $('#results').replaceChildren($('<p>', 'Uh, oh!'), problems(expr));
      completed.addRow([expr.name, expr.answer, '❌']);
    } else {
      $('#expression-input').value = '';
      completed.addRow([expr.name, expr.answer, '✅']);
      const n = expressions.next();
      if (n) {
        expressions.switchTo(n);
        $('#results').replaceChildren();
      } else {
        expr.hide();
        $('#expression-input').hidden = true;
        $('#results').replaceChildren(document.createTextNode('Good job!'));
      }
    }
  } catch (e) {
    console.log(e);
    $('#results').replaceChildren(document.createTextNode(`Uh, oh! ${e.name}`));
  }
};
