import { $, $$ } from './modules/whjqah';

const circle = '⚬'
const checkmark = '✓';
const x = '×';

const allExpression = $$('.expressions .expression');

allExpression.forEach((e) => {
  e.hidden = true;
  document.querySelector('.expressions .marks').appendChild(document.createTextNode(circle));
});

const generators = {
  positive: () => 1 + Math.floor(Math.random() * 100),
  number: () => -100 + Math.random() * 200,
}

const checker = (expression, answer) => {
  const input = expression.dataset.variables.split(',').map((s) => s.split(':'));
  const vars = input.map((x) => x[0]);
  const gens = input.map((x) => generators[x[1]]);
  const expectedFn = Function(vars, `return (${expression.dataset.expression});`);
  const gotFn = Function(vars, `return (${answer});`);

  return () => {
    const args = gens.map((g) => g());
    const expected = expectedFn(...args);
    try {
      const got = gotFn(...args);
      const passed = expected === got;
      return {args, expected, got, passed};
    } catch (e) {
      return {args, expected, e, passed: false };
    }
  }
}

let i = 0;
let current = allExpression[i];
current.hidden = false;

const nextExpression = () => {
  current.hidden = true;

  i += 1;
  if (i == allExpression.length) {
    $('#expression-input').hidden = true;
    $('#results').replaceChildren(document.createTextNode('Good job!'));
  } else {
    current = allExpression[i];
    current.hidden = false;
    $('#expression-input').value = '';
  }
};


$('#expression-input').onchange = (e) => {

  try {
    const c = checker(current, e.target.value);
    const r = Array(100).fill().map(c);

    if (r.some((x) => !x.passed)) {
      $('#results').replaceChildren(document.createTextNode("Uh, oh!"))
      document.querySelector('.expressions .marks').childNodes[i].replaceWith(document.createTextNode(x));
    } else {
      document.querySelector('.expressions .marks').childNodes[i].replaceWith(document.createTextNode(checkmark));
      nextExpression();
    }
  } catch (e) {
    console.log(e);
    $('#results').replaceChildren(document.createTextNode(`Uh, oh! ${e.name}`))
  }
}
