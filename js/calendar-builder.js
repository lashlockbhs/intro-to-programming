import Calendar from './modules/calendar';
import { outline, units } from './modules/outline';
import { jsonIfOk, textIfOk } from './modules/fetch-helpers';

const ITEM = Symbol('item');

const details = document.getElementById('details');

const loadData = async (calendar, outline) => {
  fillTable(
    await toCalendar(fetch(calendar)),
    await toOutline(fetch(outline, { cache: 'no-cache' })),
  );

  // Hack to prevent highlighting the A element when we load the page. Maybe better fixed via CSS?
  document.querySelectorAll('a').forEach((a) => {
    a.onfocus = (e) => {
      e.preventDefault();
      e.currentTarget.blur();
    };
  });

  if (window.location.hash) {
    /* eslint-disable no-self-assign */
    // Need to reset location now that the anchors are defined.
    window.location = window.location;
    /* eslint-enable */
  }
};

const toCalendar = (fetched) => fetched.then(jsonIfOk).then((x) => new Calendar(x));

const toOutline = (fetched) => fetched.then(textIfOk).then((x) => outline(x));

const tocLink = (unit) =>
  element('a', `Unit ${unit.number}`, {
    class: 'internal-link',
    href: `#unit-${unit.number}`,
  });

const fillTable = (calendar, outline) => {
  const weeks = [...calendar.elements];
  const toc = document.getElementById('toc');
  const table = document.getElementById('table');

  units(outline).forEach((unit) => {
    toc.appendChild(tocLink(unit));

    let tbody = element('tbody');

    const toFill = [];
    let count = 0;
    while (count < unit.weeks) {
      const w = weeks.shift();
      if (w.isWeek) count++;
      toFill.push(w);
    }

    const lessons = [...unit.children];

    let first = true;
    toFill.forEach((e) => {
      if (e.isWeek) {
        if (first) {
          tbody.appendChild(unitRow(unit));
        }
        tbody.appendChild(weekRow(e, calendar, lessons));
        first = false;
      } else {
        if (tbody.children.length > 0) {
          table.appendChild(tbody);
          tbody = element('tbody');
        }
        tbody.appendChild(vacationRow(e));
        table.appendChild(tbody);
        tbody = element('tbody');
      }
    });

    if (lessons.length > 0) {
      const p = document.createElement('p');
      p.classList.add('overflow-warning');
      p.innerText = `Overflow in unit ${unit.number}: ${JSON.stringify(lessons)}`;
      table.after(p);
    }
    table.appendChild(tbody);
  });

  const { schoolWeeks, schoolDays } = calendar;
  document.getElementById(
    'length',
  ).innerText = `${schoolWeeks} school weeks; ${schoolDays} school days`;
};

const unitRow = (unit) => {
  const cell = td(unitAnchor(unit), { colspan: '100%' });
  cell.append(unitSelfLink(unit));
  cell.append(element('a', '↑', { href: '#', class: 'up' }));
  return tr(cell, { class: 'unit' });
};

const unitAnchor = (unit) => {
  const name = `unit-${unit.number}`;
  return element('a', '', { class: 'anchor', name });
};

const unitSelfLink = (unit) => {
  const href = `#unit-${unit.number}`;
  return element('a', `Unit ${unit.number}: ${unit.title}`, { class: 'internal-link', href });
};

const weekRow = (w, calendar, lessons) => {
  const row = tr(dateCell(w));

  if (w.start.dayOfWeek === 2) dayOff(row);

  let days = w.days.length;

  while (days > 0 && lessons.length > 0) {
    const item = lessons.shift();
    const consumed = Math.min(days, item.days);

    if (item.title) {
      scheduled(row, item, consumed);
    } else {
      unscheduled(row, consumed);
    }
    if (consumed < item.days) {
      lessons.unshift({ ...item, days: item.days - consumed, continuation: true });
    }
    days -= consumed;
  }
  if (days > 0) unscheduled(row, days);
  if (w.end.dayOfWeek === 4) dayOff(row);
  return row;
};

const dateCell = (w) => {
  if (w.isAP) {
    const cell = td('', { class: 'week' });
    cell.innerHTML = `${w.datesOfWeek()}<br><span class='extra'>AP exams</span>`;
    return cell;
  } else {
    return td(w.datesOfWeek(), { class: 'week' });
  }
};

const dayOff = (tr) => {
  tr.appendChild(td('No school', { class: 'off' }));
};

const scheduled = (tr, item, days) => {
  let c = 'scheduled';
  if ('type' in item) c += ` ${item.type}`;
  if (item.continuation) c += ' continuation';
  const cell = td(item.title, { class: c, colspan: days });
  tr.appendChild(cell);
  cell[ITEM] = item;
  if (localStorage.getItem('showOutlineDetails') === 'yes') {
    cell.onclick = showDetails;
  }
};

const fillDetails = (item, div) => {
  const h1 = document.createElement('h1');
  h1.innerText = item.title;
  div.append(h1);

  if (item.children) {
    div.append(itemsDetails(item.children));
  } else {
    const p = document.createElement('p');
    p.innerText = 'No details.';
    div.append(p);
  }
};

const itemsDetails = (items) => {
  const ul = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerText = item.title;
    if (item.children) {
      li.append(itemsDetails(item.children));
    }
    ul.appendChild(li);
  });
  return ul;
};

const unscheduled = (tr, days) => {
  tr.appendChild(td('Unscheduled', { class: 'unscheduled', colspan: days }));
};

const showDetails = (e) => {
  details.replaceChildren();
  fillDetails(e.target[ITEM], details);
  details.style.display = 'block';
  e.stopPropagation();
};

const hideDetails = (e) => {
  details.style.display = 'none';
};

const vacationRow = (v) => tr(td(v.vacationString(), { colspan: '100%' }), { class: 'vacation' });

const td = (content, attributes) => element('td', content, attributes);

const tr = (content, attributes) => element('tr', content, attributes);

const element = (tag, content, attributes = {}) => {
  const e = document.createElement(tag);
  if (content) {
    if (typeof content === 'string') {
      e.innerText = content;
    } else {
      e.appendChild(content);
    }
  }
  Object.entries(attributes).forEach(([name, value]) => {
    e.setAttribute(name, value);
  });
  return e;
};

window.document.documentElement.onclick = () => {
  console.log(`display: ${details.style.display}`);
  if (details.style.display !== 'none') {
    details.style.display = 'none';
  }
};

window.onkeydown = (e) => {
  if (e.key === 'Escape' && details.style.display !== 'none') {
    details.style.display = 'none';
  }
};

loadData('calendar.json', 'outline.txt');
