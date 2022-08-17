import { inferTypes } from './modules/type-inference';

// The whole point of this code is to use Function() to evaluate code, so:
/* eslint no-new-func: "off" */

import Login from './modules/login';
import makeTable from './modules/table';
import { $, $$, icon } from './modules/whjqah';

const randomGenerators = {
  positive: () => 1 + Math.floor(Math.random() * 100),
  number: () => -100 + Math.random() * 2 * 100,
  notZero: () => (1 + Math.floor(Math.random() * 100)) * (Math.random() < 0.5 ? 1 : -1),
  boolean: () => Math.random() < 0.5,
};

const allValues = {
  boolean: [true, false],
};

/*
 * Generate (at most) n test cases. For some combinations of types we can
 * exhaustively generate all possible sets of arguments otherwise we generate a
 * set of n random cases.
 */
const testCases = (types, n) => {
  if (types.every((t) => t in allValues) && cardinality(types) <= n) {
    return exhaustive(types);
  } else {
    return Array(n)
      .fill()
      .map(() => generateRandom(types));
  }
};

const cardinality = (types) => types.reduce((acc, t) => acc * allValues[t].length, 1);

const exhaustive = (types) => {
  if (types.length === 0) {
    return [];
  } else if (types.length === 1) {
    return allValues[types[0]].map((v) => [v]);
  } else {
    const rest = exhaustive(types.slice(1));
    return allValues[types[0]].flatMap((v) => rest.map((r) => [v, ...r]));
  }
};

const generateRandom = (types) => types.map((t) => randomGenerators[t]());

const parseVariables = (s) =>
  s ? Object.fromEntries(s.split(',').map((s) => s.split(':'))) : null;

// End type inference
////////////////////////////////////////////////////////////////////////////////

class Expressions {
  constructor(divs, marks) {
    this.expressions = Array.from(divs).map((div, i) => new Expression(this, div, i));
    this.answers = [];
    this.i = 0;
    this.current = this.expressions[this.i];
    this.expressions.forEach((e) => {
      e.hide();
      marks.appendChild(e.marker);
    });
    this.storage = null;
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
    return this.answers.some(({ name, correct }) => correct && name === expr.name);
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
        this.switchToNext(false);
      }
    } catch (e) {
      console.log(e);
      $('#results').replaceChildren(document.createTextNode(`Uh, oh! ${e.name}`));
    }
  }

  addAnswer(expr, answer, correct) {
    const { name } = expr;
    this.answers.push({ name, answer, correct });
  }

  saveAnswers() {
    if (this.storage.repo) {
      this.storage.saveToGithubOnBranch(
        'expressions.json',
        JSON.stringify(this.answers, null, 2),
        'main',
      );
    }
  }

  async loadAnswers(completed) {
    try {
      const text = await this.storage.loadFromGithubOnBranch('expressions.json', 'main');
      this.answers = JSON.parse(text);
      this.showAllAnswers(completed);
      this.switchToNext(true);
    } catch {
      console.log('No answers to load.');
    }
  }

  showAllAnswers(completed) {
    completed.clearAllRows();
    this.answers.forEach(({ name, answer, correct }) => {
      completed.addRow([name, answer, correct ? '✅' : '❌']);
    });
    this.expressions.forEach((expr) => {
      if (this.answeredCorrectly(expr)) {
        expr.fillMarker();
      }
    });
  }

  switchToNext(justLoaded) {
    const n = this.next();
    if (n) {
      this.switchTo(n);
      $('#results').replaceChildren();
    } else {
      $('#results').style.display = 'none';
      document.querySelector('.expressions .marks').style.display = 'none';
      document.querySelector('.expressions .questions').style.display = 'none';
      document.querySelector('.expressions .done').hidden = false;
      if (!justLoaded) this.saveAnswers();
    }
  }
}

class Expression {
  constructor(expressions, div, index) {
    this.expressions = expressions;
    this.div = div;
    this.index = index;

    this.name = div.querySelector('h1').innerText;
    this.canonical = div.dataset.expression;

    const vars = parseVariables(div.dataset.variables) ?? inferTypes(this.canonical);

    if (vars === null) {
      throw new Error(
        `No explicit variable declaration and can't infer types from ${this.canonical}`,
      );
    }

    this.variables = Object.keys(vars);
    this.types = Object.values(vars);
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
    this.results = testCases(this.types, 1024).map(this.checker(answer));
    const correct = this.results.every((r) => r.passed);

    if (correct) {
      this.fillMarker();
    }
    return correct;
  }

  fillMarker() {
    this.marker.childNodes[0].setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      `/img/bootstrap-icons.svg#circle-fill`,
    );
  }

  checker(answer) {
    const fn = Function(this.variables, `return (${answer});`);

    return (args) => {
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
  if (a === b) {
    // Actually the same, we're good.
    return true;
  } else if (typeof a !== typeof b) {
    // We're strict about types.
    return false;
  } else if (isFloat(a) || isFloat(b)) {
    // Check non integers by relative tolerance.
    const relError = Math.abs(a - b) / Math.abs((a + b) / 2);
    return relError <= 0.00001; // This may be way too conservative
  } else {
    return false;
  }
};

const isFloat = (n) => typeof n === 'number' && !Number.isInteger(n);

const completedTable = () => {
  const t = makeTable();
  t.addColumn('Problem', 'problem');
  t.addColumn('Answer', 'answer');
  t.addColumn('Ok?', 'ok');
  return t;
};

const login = new Login();

// FIXME: should really have a toolbar module with an addButton method.
const addSaveButton = (saveAnswers) => {
  const toolbarButtons = document.querySelector('.itp-toolbar .buttons');
  const saveButton = icon('save');
  saveButton.onclick = saveAnswers;
  toolbarButtons.append(saveButton);
};

const setup = async () => {
  const completed = completedTable();
  $('#completed').replaceChildren(completed.table);

  const expressions = new Expressions(
    $$('.expressions .expression'),
    document.querySelector('.expressions .marks'),
  );
  expressions.current.show();

  expressions.storage = await login.makeStorage();

  const onAttachToGithub = async () => {
    console.log("Just attached to github. Should merge any answers in memory with what's in git.");
    expressions.loadAnswers(completed);
  };

  login.setupToolbar(onAttachToGithub);
  addSaveButton(() => expressions.saveAnswers());

  if (expressions.storage.repo !== null) {
    console.log('Have storage. Could grab answers.');
    expressions.loadAnswers(completed);
  } else {
    console.log('No storage.');
  }

  $('#expression-input').onchange = (e) => {
    expressions.checkAnswer(e.target.value, completed);
  };
};

setup();
