//
// Two implementations of the Fisher-Yates shuffle.
//
// In place algorithm based on pseudo code at:
//
//   https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
//
// Shuffled copy based on pseudo code at:
//
//   https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_%22inside-out%22_algorithm
//

/*
 * Shuffle the given array in place and return it.
 */
const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};

/*
 * Return a shufled copy of the given array.
 */
const shuffled = (xs) => {
  const shuffled = [];
  for (let i = 0; i < xs.length; i++) {
    const j = Math.floor(Math.random() * (i + 1)); // 0 <= j <= i
    if (j !== i) {
      // if j != i then j < i so this is safe.
      shuffled[i] = shuffled[j];
    }
    shuffled[j] = xs[i];
  }
  return shuffled;
};

/*
 * Flip a coin.
 */
const flip = () => Math.random() < 0.5;

const choice = (xs) => xs[Math.floor(Math.random() * xs.length)];

export { shuffle, shuffled, flip, choice };
