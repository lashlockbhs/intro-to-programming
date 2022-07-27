/* eslint no-new-func: "off" */

import Login from './modules/login';
import makeTable from './modules/table';
import { $, $$, icon } from './modules/whjqah';

const generators = {
  positive: () => 1 + Math.floor(Math.random() * 100),
  number: () => -100 + Math.random() * 2 * 100,
};

class Expressions {
  constructor(divs, marks, storage) {
    this.expressions = Array.from(divs).map((div, i) => new Expression(this, div, i));
    this.answers = {};
    this.i = 0;
    this.current = this.expressions[this.i];
    this.expressions.forEach((e) => {
      e.hide();
      marks.appendChild(e.marker);
    });
    this.storage = storage;
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
      const expr = this.expressions[j];
      if (!this.answeredCorrectly(expr)) {
        return expr;
      }
    }
    return undefined;
  }

  answeredCorrectly(expr) {
    const { name } = expr;
    if (name in this.answers) {
      return this.answers[name].answers.some((a) => a.correct);
    } else {
      return false;
    }
  }

  checkAnswer(answer, completed) {
    const expr = this.current;

    try {
      const correct = expr.check(answer);

      this.addAnswer(expr, answer, correct);

      if (!correct) {
        $('#results').replaceChildren(
          $(
            '<p>',
            `Uh, oh! ${expr.numWrong()} of ${
              expr.results.length
            } test cases failed. Here’s a sample.`,
          ),
          expr.problems(5),
        );
        completed.addRow([expr.name, answer, '❌']);
      } else {
        $('#expression-input').value = '';
        completed.addRow([expr.name, answer, '✅']);
        const n = this.next();
        if (n) {
          this.switchTo(n);
          $('#results').replaceChildren();
        } else {
          $('#results').style.display = 'none';
          document.querySelector('.expressions .marks').style.display = 'none';
          document.querySelector('.expressions .questions').style.display = 'none';
          document.querySelector('.expressions .done').hidden = false;
          this.saveAnswers();
        }
      }
    } catch (e) {
      console.log(e);
      $('#results').replaceChildren(document.createTextNode(`Uh, oh! ${e.name}`));
    }
  }

  addAnswer(expr, answer, correct) {
    const { name, canonical } = expr;
    if (!(name in this.answers)) {
      this.answers[expr.name] = { name, canonical, answers: [] };
    }
    this.answers[name].answers.push({ answer, correct });
  }

  saveAnswers() {
    this.storage.saveToGithubOnBranch(
      'expressions.json',
      JSON.stringify(this.answers, null, 2),
      'main',
    );
  }
}

class Expression {
  constructor(expressions, div, index) {
    this.expressions = expressions;
    this.div = div;
    this.index = index;

    this.name = div.querySelector('h1').innerText;
    this.canonical = div.dataset.expression;

    const input = div.dataset.variables.split(',').map((s) => s.split(':'));
    this.variables = input.map((x) => x[0]);
    this.generators = input.map((x) => generators[x[1]]);
    this.expectedFn = new Function(this.variables, `return (${this.canonical});`);

    this.marker = icon('circle');
    this.marker.onclick = () => expressions.switchTo(this);
  }

  hide() {
    this.div.hidden = true;
  }

  show() {
    this.div.hidden = false;
  }

  check(answer) {
    this.results = Array(100).fill().map(this.checker(answer));
    const correct = this.results.every((r) => r.passed);

    if (correct) {
      this.marker.childNodes[0].setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        `/img/bootstrap-icons.svg#circle-fill`,
      );
    }
    return correct;
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

const login = new Login();

const setup = async () => {
  const storage = await login.makeStorage();

  const completed = completedTable();
  $('#completed').replaceChildren(completed.table);

  const expressions = new Expressions(
    $$('.expressions .expression'),
    document.querySelector('.expressions .marks'),
    storage,
  );
  expressions.current.show();

  // For when we log in to GitHub after the user has loaded the page and maybe
  // even edited the file. FIXME: this doesn't do anything with the machinery
  // (which probably isn't fully baked) for saving versions of files while
  // disconnected.
  const onAttachToGithub = async () => {
    // TODO: if there's a results file grab it and update our answers.
    console.log("Just attached to github. Should merge any answers in memory with what's in git.");
  };

  login.setupToolbar(onAttachToGithub);

  if (storage.repo !== null) {
    console.log('Have storage. Could grab answers.');
    // storage.ensureFileInBranch(filename).then(fillEditor);
  } else {
    console.log('No storage.');
    // storage.load(filename).then(fillEditor);
  }

  $('#expression-input').onchange = (e) => {
    expressions.checkAnswer(e.target.value, completed);
  };
};

setup();
