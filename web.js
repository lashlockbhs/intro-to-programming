import { Calendar } from "./calendar.js";
import { outline, units } from "./outline.js";

// Hack to adjust position when we go to an internal link so it's not so ugly.
window.onhashchange = () => window.scrollTo(window.pageXOffset, window.pageYOffset - 20);

const loadData = async (calendar, outline) => {
  fillTable(await toCalendar(fetch(calendar)), await toOutline(fetch(outline, { cache: "no-cache" })));

  // Hack to prevent highlighting the A element when we load the page. Maybe better fixed via CSS?
  document.querySelectorAll("a").forEach(
    (a) =>
      (a.onfocus = (e) => {
        e.preventDefault();
        e.currentTarget.blur();
      })
  );

  if (window.location.hash) {
    // Need to reset location now that the anchors are defined.
    window.location = window.location;
    window.onhashchange();
  }
};

const jsonOrBarf = (r) => {
  if (!r.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return r.json();
};

const textOrBarf = (r) => {
  if (!r.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return r.text();
};

const toCalendar = (fetched) => fetched.then(jsonOrBarf).then((x) => new Calendar(x));

const toOutline = (fetched) => fetched.then(textOrBarf).then((x) => outline(x));

const fillTable = (calendar, outline) => {
  const weeks = [...calendar.elements];

  units(outline).forEach((unit) => {
    let tbody = element("tbody");

    let toFill = [];
    let count = 0;
    while (count < unit.weeks) {
      const w = weeks.shift();
      if (w.isWeek) count++;
      toFill.push(w);
    }

    const lessons = [...unit.children];

    let first = true;
    toFill.forEach((e, i) => {
      if (e.isWeek) {
        if (first) {
          tbody.appendChild(unitRow(unit));
        }
        tbody.appendChild(weekRow(e, calendar, lessons));
        first = false;
      } else {
        if (tbody.children.length > 0) {
          document.getElementById("table").appendChild(tbody);
          tbody = element("tbody");
        }
        tbody.appendChild(vacationRow(e));
        document.getElementById("table").appendChild(tbody);
        tbody = element("tbody");
      }
    });

    if (lessons.length > 0) {
      alert(`Overflow in unit ${unit.number}: ${JSON.stringify(lessons)}`);
    }
    document.getElementById("table").appendChild(tbody);
  });

  const { schoolWeeks, schoolDays } = calendar;

  document.getElementById("length").innerText = `${schoolWeeks} school weeks; ${schoolDays} school days`;
};

const unitRow = (unit) => {
  const name = `unit-${unit.number}`;
  const href = `#${name}`;
  const content = element("a", `Unit ${unit.number}: ${unit.title}`, { name, href });
  return tr(td(content, { colspan: "6" }), { class: "unit" });
};

const weekRow = (w, calendar, lessons) => {
  const row = tr(dateCell(w));

  if (w.start.dayOfWeek == 2) dayOff(row);

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
      lessons.unshift(Object.assign(item, { days: item.days - consumed }));
    }
    days -= consumed;
  }
  if (days > 0) unscheduled(row, days);
  if (w.end.dayOfWeek == 4) dayOff(row);
  return row;
};

const dateCell = (w) => {
  if (w.isAP) {
    const cell = td("", { class: "week" });
    cell.innerHTML = w.datesOfWeek() + "<br><span class='extra'>AP exams</span>";
    return cell;
  } else {
    return td(w.datesOfWeek(), { class: "week" });
  }
};

const dayOff = (tr) => {
  tr.appendChild(td("No school", { class: "off" }));
};

const scheduled = (tr, item, days) => {
  const c = "scheduled" + ("type" in item ? ` ${item.type}` : "");
  tr.appendChild(td(item.title, { class: c, colspan: days }));
};

const unscheduled = (tr, days) => {
  tr.appendChild(td("Unscheduled", { class: "unscheduled", colspan: days }));
};

const vacationRow = (v) => tr(td(v.vacationString(), { colspan: "6" }), { class: "vacation" });

const td = (content, attributes) => element("td", content, attributes);

const tr = (content, attributes) => element("tr", content, attributes);

const element = (tag, content, attributes = {}) => {
  const e = document.createElement(tag);
  if (content) {
    if (typeof content === "string") {
      e.innerText = content;
    } else {
      e.appendChild(content);
    }
  }
  for (const name in attributes) {
    e.setAttribute(name, attributes[name]);
  }
  return e;
};

loadData("calendar.json", "outline.txt");
