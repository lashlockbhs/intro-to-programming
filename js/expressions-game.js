/* eslint no-new-func: "off" */

import { $, $$ } from './modules/whjqah';
import makeTable from './modules/table';

const generators = {
  positive: () => 1 + Math.floor(Math.random() * 100),
  number: () => -100 + Math.random() * 2 * 100,
};

const bootstrapIcon = (name) => {
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
    return undefined;
  }
}

class Expression {
  constructor(expressions, div, index) {
    this.expressions = expressions;
    this.div = div;
    this.index = index;

    this.name = div.querySelector('h1').innerText;
    this.marker = bootstrapIcon('circle');
    this.answer = null;

    const input = div.dataset.variables.split(',').map((s) => s.split(':'));
    this.variables = input.map((x) => x[0]);
    this.generators = input.map((x) => generators[x[1]]);
    this.expectedFn = new Function(this.variables, `return (${div.dataset.expression});`);

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
    if (this.correct) {
      this.marker.childNodes[0].setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        `/img/bootstrap-icons.svg#circle-fill`,
      );
    }
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

  problems(limit) {
    const t = makeTable();
    t.table.className = 'problems';
    this.variables.forEach((v) => t.addColumn(v, 'variable'));
    t.addColumn('Expected', 'expected');
    t.addColumn('Got', 'got');
    this.results
      .filter((r) => !r.passed)
      .slice(0, limit)
      .forEach((r) => {
        t.addRow([...r.args, r.expected, r.got ?? r.e]);
      });
    return t.table;
  }

  numWrong() {
    return this.results.filter((r) => !r.passed).length;
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
      $('#results').replaceChildren(
        $(
          '<p>',
          `Uh, oh! ${expr.numWrong()} of ${
            expr.results.length
          } test cases failed. Here’s a sample.`,
        ),
        expr.problems(5),
      );
      completed.addRow([expr.name, expr.answer, '❌']);
    } else {
      $('#expression-input').value = '';
      completed.addRow([expr.name, expr.answer, '✅']);
      const n = expressions.next();
      if (n) {
        expressions.switchTo(n);
        $('#results').replaceChildren();
      } else {
        $('#results').style.display = 'none';
        document.querySelector('.expressions .marks').style.display = 'none';
        document.querySelector('.expressions .questions').style.display = 'none';
        document.querySelector('.expressions .done').hidden = false;
      }
    }
  } catch (e) {
    console.log(e);
    $('#results').replaceChildren(document.createTextNode(`Uh, oh! ${e.name}`));
  }
};
