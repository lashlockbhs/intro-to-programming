const peek = (stack) => stack[stack.length - 1];

/*
 * Translate raw lines into virtual lines that allow for wrapped lines indented
 * the way Emacs indents them.
 */
function* lines(data) {
  let current = null;
  let m = null;
  let continuationPat = null;

  const raw = data.split(/\r?\n/).filter((s) => s.length > 0);

  for (let line of raw) {
    if ((m = line.match(/^(\s*)-\s+(.*?)\s*$/))) {
      // Matches the beginning of an item
      if (current !== null) yield current;
      const [_, indent, text] = m;
      current = `${indent}- ${text}`;
      continuationPat = new RegExp(String.raw`^${indent} ( \S.*)\s*$`);
    } else if (continuationPat !== null && (m = line.match(continuationPat))) {
      // Matches a continuation of the current item.
      const [_, text] = m;
      current += text;
    }
    // Everything else is ignored.
  }
  if (current !== null) yield current;
}

/*
 * Parse a virtual line returned by lines into an item.
 */
const parseLine = (s) => {
  const match = s.match(/^(\s*)-\s+(.*?)(?: \(((?:0\.)?\d+(?: (weeks))?)\))?\s*$/);
  if (match) {
    const [_, indent, text, days, weeks] = match;
    const parsed = {
      level: indent.length,
      text: text,
    };
    if (days) {
      if (weeks) {
        parsed.weeks = Number.parseFloat(days, 10);
      } else {
        parsed.days = Number.parseFloat(days, 10);
      }
    }
    return parsed;
  }
};

/*
 * Build the full outline by parsing the given text.
 */
const outline = (text) => {
  let indent = 0;

  // Stack contains the objects currenly being built with their level of
  // indentation. When we see a new line we want to add it to the first item on
  // the stack that is less indented than the current line. So we pop items off
  // the stack until the top of the stack meets that criteria and then add the
  // item representing the current line as a child of the current top of the
  // stack and then push this item (with it's indentation) onto the stack.

  // Dummy item that is less indented than all actual lines.
  let stack = [{ level: -1, item: { children: [] } }];

  let unitNum = 1;

  for (const line of lines(text)) {
    const p = parseLine(line);

    while (peek(stack).level >= p.level) {
      stack.pop();
    }

    const newItem = { title: p.text, days: p.days, weeks: p.weeks };
    if (newItem.title.match(/^Project: /)) {
      newItem.type = "project";
      newItem.title = newItem.title.substring("Project: ".length);
    }

    if (newItem.title.match(/^Unit: /)) {
      newItem.type = "unit";
      newItem.number = unitNum++;
      newItem.title = newItem.title.substring("Unit: ".length);
    }

    const top = peek(stack).item;
    if (!("children" in top)) {
      top.children = [];
    }
    top.children.push(newItem);
    stack.push({ level: p.level, item: newItem });
  }

  // Close all open items by clearing the stack back down to dummy item.
  while (peek(stack).level >= 0) {
    stack.pop();
  }
  return peek(stack).item.children;
};

/*
 * From a list of items build a schedule of those items with days specified.
 */
const schedule = (items) => {
  const withDays = (item, prefix) =>
    item.days
      ? [addPrefix(item, prefix)]
      : item.children
      ? item.children.flatMap((x) => withDays(x, prefixed(prefix, item.title)))
      : [];

  return items.flatMap((x) => withDays(x, ""));
};

/*
 * Get the top-level units and their scheduled children.
 */
const units = (full) => {
  return full.filter((u) => u.type == "unit").map((unit) => ({ ...unit, children: schedule(unit.children || []) }));
};

/*
 * Strip the tree down to only those items that are not scheduled. An item is
 * considered scheduled if it has days assigned or if all its children are
 * scheduled, recursively.
 */
const unscheduled = (nodes) => {
  const removeScheduledChildren = (n) => {
    if ("children" in n) {
      const children = unscheduled(n.children);
      return children.length > 0 ? [{ ...n, children }] : [];
    } else {
      return [n];
    }
  };

  return nodes.flatMap((n) => (n.days ? [] : removeScheduledChildren(n)));
};

const addPrefix = (item, prefix) => ({ ...item, title: prefixed(prefix, item.title) });

const prefixed = (prefix, text) => (prefix ? `${prefix}: ${text}` : text);

export { outline, schedule, units, unscheduled };
