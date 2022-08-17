import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

// N.B. This is a super quick and dirty and only expected to deal with the cases
// in the expressions problem sets. I have not thought through at all rigorously
// how do to this 100% correctly.

const ACORN_OPTS = { ecmaVersion: 2022 };

const binaryOperandTypes = {
  '+': { left: 'number', right: 'number' },
  '-': { left: 'number', right: 'number' },
  '*': { left: 'number', right: 'number' },
  '/': { left: 'number', right: 'notZero' },
  '%': { left: 'number', right: 'notZero' },
  '**': { left: 'number', right: 'number' },
};

const knownFunctions = {
  'Math.abs': ['number'],
  'Math.sqrt': ['number'],
};

const showAncestors = (expr) => {
  walk.ancestor(expr, {
    Identifier(n, ancestors) {
      console.log(`Identifier ${n.name}`);
      const prev = n;
      for (let i = ancestors.length - 2; i >= 0; i--) {
        const a = ancestors[i];
        console.log(`checking ${a.type}`);
        if (a.type === 'BinaryExpression') {
          const expected = binaryOperandTypes[a.operator];
          if (expected) {
            if (a.left === prev) {
              console.log(expected.left);
            } else if (a.right === prev) {
              console.log(expected.right);
            }
          }
        } else if (a.type === 'CallExpression') {
          console.log(calleeToString(a.callee));
        }
      }
      // console.log(ancestors.map((a) => a.type));
      // console.log('Ancestors');
      // ancestors.forEach(console.log);
      console.log('-----');
    },
  });
};

const inferTypes = (text) => {
  const expr = acorn.parseExpressionAt(text, 0, ACORN_OPTS);

  if (expr.type === 'Literal') {
    return {};
  } else if (expr.type === 'LogicalExpression') {
    const variables = {};
    walk.simple(expr, {
      Identifier(node) {
        variables[node.name] = 'boolean';
      },
    });
    return variables;
  } else if (expr.type === 'BinaryExpression') {
    const variables = {};
    const types = binaryOperandTypes[expr.operator];
    expect(expr.left, types.left, variables);
    expect(expr.right, types.right, variables);
    return variables;
  } else if (expr.type === 'CallExpression') {
    // Something here.
    return null;
  } else {
    return null;
  }
};

// this almost certainly wrong.
const expect = (node, type, variables) => {
  walk.simple(node, {
    Identifier(n) {
      variables[n.name] = type;
    },
  });
};

const calleeToString = (callee) => {
  let name;
  walk.simple(callee, {
    Identifier(n) {
      name = n.name;
    },
    MemberExpression(n) {
      name = `${n.object.name}.${n.property.name}`;
    },
  });
  return name;
};

export { inferTypes };
