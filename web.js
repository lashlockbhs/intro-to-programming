import { Calendar } from "./calendar.js";
import { outline, schedule } from "./syllabus.js";

const loadData = async (calendar, syllabus) => {
  fillTable(await toCalendar(fetch(calendar)), await toSchedule(fetch(syllabus)));
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

const toSchedule = (fetched) => fetched.then(textOrBarf).then((x) => schedule(outline(x)));

const fillTable = (calendar, syllabus) => {
  const tbody = document.getElementById("body");

  calendar.elements.forEach((e) => {
    if (e.isWeek) {
      tbody.appendChild(weekRow(e, calendar, syllabus));
    } else {
      tbody.appendChild(vacationRow(e));
    }
  });

  document.getElementById("length").innerText = `${calendar.weeks} school weeks; ${calendar.schoolDays} school days`;
};

const weekRow = (w, calendar, syllabus) => {
  const tr = document.createElement("tr");

  tr.appendChild(dateCell(w));

  if (w.start.dayOfWeek == 2) dayOff(tr);

  let days = w.days.length;

  while (days > 0 && syllabus.length > 0) {
    const item = syllabus.shift();
    const consumed = Math.min(days, item.days);

    if (item.title) {
      scheduled(tr, item, consumed);
    } else {
      unscheduled(tr, consumed);
    }
    if (consumed < item.days) {
      syllabus.unshift(Object.assign(item, { days: item.days - consumed }));
    }
    days -= consumed;
  }
  if (days > 0) unscheduled(tr, days);
  if (w.end.dayOfWeek == 4) dayOff(tr);
  return tr;
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

const vacationRow = (v) => {
  const tr = document.createElement("tr");
  tr.setAttribute("class", "vacation");
  tr.appendChild(td(v.vacationString(), { colspan: "6" }));
  return tr;
};

const td = (text, attributes) => {
  const e = document.createElement("td");
  e.innerText = text;
  for (const name in attributes) {
    e.setAttribute(name, attributes[name]);
  }
  return e;
};

loadData("calendar.json", "outline.txt");
