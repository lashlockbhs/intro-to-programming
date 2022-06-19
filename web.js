import { Calendar } from "./calendar.js";
import { buildSyllabus, schedule } from "./syllabus.js";

const pat = /^(.*)\s+\((\d+)\)$/;

const loadData = (calendar, syllabus) => {
  Promise.all([
    fetch(calendar)
      .then(jsonOrBarf)
      .then((data) => new Calendar(data)),
    fetch(syllabus)
      .then(textOrBarf)
      .then((x) => schedule(buildSyllabus(x))),
  ]).then((values) => fillTable(...values));
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

const fillTable = (calendar, syllabus) => {
  const tbody = document.getElementById("body");

  calendar.elements.forEach((e) => {
    if ("weekstring" in e) {
      tbody.appendChild(weekRow(e, calendar, syllabus));
    } else {
      tbody.appendChild(vacationRow(e));
    }
  });
};

const weekRow = (w, calendar, syllabus) => {
  const tr = document.createElement("tr");

  if (w.isAP) {
    //tr.classList.add("ap-exams");
    const cell = td("", { class: "week" });
    cell.innerHTML = w.datesOfWeek() + "<br><span class='extra'>AP exams</span>";
    tr.appendChild(cell);
  } else {
    tr.appendChild(td(w.datesOfWeek(), { class: "week" }));
  }

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
