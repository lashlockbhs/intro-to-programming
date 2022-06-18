const peek = (stack) => stack[stack.length - 1];

const lines = (data) => data.split(/\r?\n/).filter((s) => s.length > 0);

const parseLine = (s) => {
  const match = s.match(/^(\s*)-\s+(.*?)(?: \(((?:0\.)?\d+)\))?\s*$/);
  if (match) {
    const [_, indent, text, days] = match;
    const parsed = {
      level: indent.length,
      text: text,
    };
    if (days) {
      parsed.days = Number.parseFloat(days, 10);
    }
    return parsed;
  }
};

const buildSyllabus = (text) => {
  let indent = 0;

  // Stack contains the objects currenly being built with their level of
  // indentation. When we see a new line if it is more deeply indented we add it
  // as a child of the item at the top of the stack and then push it on the
  // stack. When we see a new line with less then or the same indentation is the
  // current top of the stack, we pop items off the stack until the top of the
  // stack is less indented than the current line, and add it as a child to the
  // item now at the top of the stack and push it on the stack.

  // Dummy item that is less indented than all actual lines.
  let stack = [{ level: -1, item: { children: [] } }];

  lines(text).forEach((line) => {
    const p = parseLine(line);

    while (peek(stack).level >= p.level) {
      stack.pop();
    }
    const item = { title: p.text, days: p.days };
    const top = peek(stack).item;
    if (!("children" in top)) {
      top.children = [];
    }
    top.children.push(item);
    stack.push({ level: p.level, item: item });
  });

  while (peek(stack).level >= 0) {
    stack.pop();
  }

  return peek(stack).item.children;
};

export { buildSyllabus };
