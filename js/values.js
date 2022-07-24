import { $, clear, withClass } from './modules/whjqah';
import { type, valueExpression, allTypes } from './modules/questions';
import { first } from './modules/async';
import { addToolbarButtons } from './modules/games';

// level 0: single values
// level 1: two values and an operator. Choose an operator. Choose value for the types.

//////////////////////////////////////////////////////////////////////
// HTML

const model = {
  currentQuestion: null,
  answeredCorrectly: false,
  currentFilter: 'all',
  level: 3, // N.B. we're not doing anything with this at the moment.
  correct: 0,
  asked: 0,
  tries: 0,
};

function init() {
  clear($('#results'));
  addToolbarButtons();

  $('#close_info').onclick = () => {
    $('#info').style.display = 'none';
  };
  $('#results_header').onclick = changeFilter;
  setQuestion();
}

const filters = ['all', 'pass', 'fail'];
const filterLabels = {
  all: 'All',
  pass: '✅',
  fail: '❌',
};

function changeFilter(e) {
  const f = filters[(filters.indexOf(model.currentFilter) + 1) % filters.length];
  const result = $('#results');
  for (let row = result.firstChild; row; row = row.nextSibling) {
    const c = row.className;
    row.style.display = rowVisible(f, c) ? 'table-row' : 'none';
  }
  e.target.innerText = filterLabels[f];
  model.currentFilter = f;
}

function rowVisible(filter, className) {
  return filter === 'all' || filter === className;
}

function typeTiles() {
  clear($('#answers'));
  ['number', 'string', 'boolean', 'array'].forEach((t) => {
    addTile(t);
  });
}

function maybeSetQuestion() {
  if (model.answeredCorrectly) {
    setQuestion();
  } else {
    resetQuestion();
  }
}

function setQuestion() {
  clear($('#commentary'));
  typeTiles();
  model.asked++;
  model.answeredCorrectly = false;
  const v = valueExpression(0, allTypes);
  if (typeof v.value !== 'string' && Math.random() < 0.2) v.stringify();
  model.currentQuestion = v;
  showValue(v, clear($('#question')));
}

function resetQuestion() {
  showValue(model.currentQuestion, clear($('#question')));
}

function onAnswer(e) {
  model.tries++;
  const answer = e.target.value;
  const result = processAnswer(model.currentQuestion, answer);
  if (!result.passed) {
    disableTile(e.target);
  } else {
    model.correct++;
    model.answeredCorrectly = true;
  }
  updateScore();
  animateExpression(result, $('#question'));
  logResult(result);
  maybeHideTip();
}

function plural(word, n) {
  if (n === 1) {
    return word;
  } else if (word[word.length - 1] === 'y') {
    return `${word.substring(0, word.length - 1)}ies`;
  } else {
    return `${word}s`;
  }
}

function updateScore() {
  const a = model.asked;
  const c = model.correct;
  const t = model.tries;
  const accuracy = Math.round((100 * c) / t);

  $('#score').innerHTML = `${accuracy}% accuracy over ${a} ${plural('question', a)}.`;
}

function maybeHideTip() {
  const tip = $('#tip');

  if (tip.style.display !== 'none') {
    let iters = 50;
    let h = tip.clientHeight;
    let w = tip.clientWidth;
    const hd = h / iters;
    const wd = w / iters;

    let id = null;
    function shrinkTip() {
      tip.innerHTML = '';
      if (iters === 0) {
        tip.style.display = 'none';
        clearInterval(id);
      } else {
        iters--;
        h -= hd;
        w -= wd;
        tip.style.height = `${h}px`;
        tip.style.width = `${w}px`;
      }
    }
    id = setInterval(shrinkTip, 10);
  }
}

function processAnswer(question, answer) {
  return {
    expr: question,
    answer,
    passed: type(question.evaluate()) === answer,
  };
}

function addCommentary(result, where, prefix) {
  const p = $('<p>');
  if (prefix) p.append(prefix);
  where.append(p);

  p.append(withClass('mono', $('<span>', result.answer)));

  if (result.passed) {
    p.append($(' is correct!'));
  } else {
    p.append($(' is not correct.'));
  }
}

function logResult(result) {
  const row = $('#results').insertRow(0);
  row.className = result.passed ? 'pass' : 'fail';

  const [ok, question, notes] = Array(3)
    .fill()
    .map(() => row.insertCell());

  ok.append($(result.passed ? '✅' : '❌'));
  showValue(result.expr, question);
  addCommentary(result, notes);
}

function animateExpression(result, where) {
  function checkmark() {
    if (result.passed) {
      where.append($(' ✅'));
    } else {
      addCommentary(result, $('#commentary'), $('❌ '));
    }
  }

  first(checkmark).after(500, maybeSetQuestion).run();
}

function showValue(value, where) {
  const s1 = withClass('mono', $('<span>'));
  value.render(s1);
  where.append(s1);
}

function addTile(v) {
  const b = $('<button>', v);
  b.value = v;
  b.onclick = onAnswer;
  $('#answers').append(b);
}

function disableTile(t) {
  t.className = 'disabled';
  t.onclick = null;
}

document.addEventListener('DOMContentLoaded', init);
