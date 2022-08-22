import { $ } from './modules/whjqah';
import { shuffled, flip } from './modules/shuffle';

import {
  Variable,
  BooleanAnd,
  BooleanOr,
  BooleanEquals,
  BooleanNotEquals,
  BooleanNot,
} from './modules/booleans';

const xAndNotX = (x) => [x, new BooleanNot(x)];

const CHOICES = [BooleanAnd, BooleanOr, BooleanEquals, BooleanNotEquals].flatMap((op) =>
  xAndNotX(new Variable('a')).flatMap((left) =>
    xAndNotX(new Variable('b')).map((right) => new op(left, right)),
  ),
);

class Bingo {
  constructor(size, choices, board, score, question) {
    this.size = size;
    this.choices = choices;
    this.board = board;
    this.score = score;
    this.question = question;
    this.bingos = 0;
    this.cells = [];
  }

  newGame() {
    this.rows = Array(this.size).fill(0);
    this.columns = Array(this.size).fill(0);
    this.diagonals = Array(2).fill(0);
    this.cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.cells.push(new Cell(r, c, this.choices[r * 4 + c], this));
      }
    }
    bingo.fillBoard();
    bingo.updateScore();
    bingo.nextQuestion();
  }

  bingo(num) {
    const label = num === 2 ? 'Double Bingo!' : num === 3 ? 'Triple Bingo!' : 'Bingo!';

    const h1 = document.createElement('h1');
    h1.appendChild(document.createTextNode(label));
    this.question.replaceChildren(document.createTextNode('You win!'));
    this.board.replaceChildren(h1);

    this.bingos += num;
    this.updateScore();
    setTimeout(() => this.newGame(), 1000);
  }

  track(row, col) {
    this.rows[row]++;
    this.columns[col]++;
    if (row === col) {
      this.diagonals[0]++;
    }
    if (col + row === 3) {
      this.diagonals[1]++;
    }
  }

  hasBingo() {
    const full = (x) => x === this.size;

    const bingos =
      this.rows.filter(full).length +
      this.columns.filter(full).length +
      this.diagonals.filter(full).length;

    if (bingos > 0) {
      this.bingo(bingos);
      return true;
    } else {
      return false;
    }
  }

  fillBoard() {
    this.board.replaceChildren();
    for (let r = 0; r < this.size; r++) {
      const row = $('<div>');
      for (let c = 0; c < this.size; c++) {
        row.appendChild(this.cells[r * 4 + c].html);
      }
      this.board.appendChild(row);
    }
  }

  updateScore() {
    this.score.replaceChildren(document.createTextNode(`Bingos: ${this.bingos}`));
  }

  nextQuestion() {
    const q = { a: flip(), b: flip() };
    const values = this.cells.filter((c) => c.open).map((c) => c.evaluate(q));

    const trues = values.reduce((acc, v) => acc + (v ? 1 : 0), 0);
    const falses = values.length - trues;
    this.currentQuestion = { ...q, want: want(trues, falses, this.bingos < 4) };
    this.renderQuestion();
  }

  renderQuestion() {
    const q = this.currentQuestion;
    const ab = $('<p>');
    const v = $('<p>');
    ab.innerHTML = `<code>a</code> is <code>${q.a}</code>; <code>b</code> is <code>${q.b}</code>`;
    v.innerHTML = `Looking for <code>${q.want}</code>.`;
    this.question.replaceChildren(ab, v);
  }
}

const want = (trues, falses, easy) => {
  if (trues === 0) {
    // If there are no trues, gotta use false, even in hard mode.
    return false;
  } else if (falses === 0) {
    // And vice versa.
    return true;
  } else if (trues === falses) {
    // No preference. Flip a coin.
    return flip();
  } else {
    return easy === trues > falses;
  }
};

class Cell {
  constructor(row, col, expr, bingo) {
    this.row = row;
    this.col = col;
    this.expr = expr;
    this.bingo = bingo;
    this.open = true;

    this.html = $('<span>');
    this.html.classList.add('box');
    this.html.innerText = expr.code();
    this.html.onclick = () => this.clicked();
  }

  evaluate(q) {
    return this.expr.evaluate(q);
  }

  clicked() {
    if (this.open) {
      const q = this.bingo.currentQuestion;
      const v = this.evaluate(q);
      if (v === q.want || true) {
        this.open = false;
        this.html.classList.add('correct');
        this.bingo.track(this.row, this.col);
        if (!this.bingo.hasBingo()) {
          this.bingo.nextQuestion();
        }
      } else {
        shake(this.html);
      }
    }
  }
}

const shake = (cell) => {
  const parent = cell.parentElement;
  const rect = cell.getBoundingClientRect();

  const spacer = $('<span>');
  spacer.classList.add('spacer');
  parent.insertBefore(spacer, cell);

  makeAbsolute(cell, rect);

  let ts = Date.now();
  const startTs = ts;
  const start = rect.x;
  let pos = start;
  let goingLeft = true;
  const pxPerMilli = 0.1;

  const move = () => {
    const now = Date.now();
    const elapsed = now - ts;
    ts = now;

    pos += (goingLeft ? -1 : 1) * elapsed * pxPerMilli;
    cell.style.left = `${pos}px`;
    if (Math.abs(pos - start) >= 2) {
      goingLeft = !goingLeft;
    }
    if (now - startTs < 500) {
      requestAnimationFrame(move);
    } else {
      makeUnabsolute(cell);
      parent.replaceChild(cell, spacer);
    }
  };
  requestAnimationFrame(move);
};

const makeAbsolute = (e, rect) => {
  e.style.setProperty('position', 'absolute');
  e.style.setProperty('left', `${rect.x}px`);
  e.style.setProperty('top', `${rect.y}px`);
};

const makeUnabsolute = (e) => {
  e.style.removeProperty('position');
  e.style.removeProperty('left');
  e.style.removeProperty('top');
};

const bingo = new Bingo(4, shuffled(CHOICES), $('#board'), $('#score'), $('#question'));
bingo.newGame();
