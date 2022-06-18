import { Calendar } from "./calendar.js";

const loadData = (calendar, syllabus) => {
  Promise.all([
    fetch(calendar).then(jsonOrBarf),
    fetch(syllabus).then(jsonOrBarf),
  ]).then((values) => fillTable(...values));
};

const jsonOrBarf = (r) => {
  if (!r.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return r.json();
};

const fillTable = (calendar, syllabus) => {
  console.log(calendar);
  console.log(syllabus);

  const tbody = document.getElementById("body");

  new Calendar(calendar).elements.forEach((e) => {
    if ("weekstring" in e) {
      tbody.appendChild(weekRow(e, syllabus));
    } else {
      tbody.appendChild(vacationRow(e));
    }
  });
};

const weekRow = (w, syllabus) => {
  const tr = document.createElement("tr");

  tr.appendChild(td(w.datesOfWeek(), {}));

  if (w.start.dayOfWeek == 2) dayOff(tr);

  let days = w.days.length;

  while (days > 0 && syllabus.length > 0) {
    const item = syllabus.shift();
    const consumed = Math.min(days, item.days);

    if (item.title) {
      scheduled(tr, item.title, consumed);
    } else {
      unscheduled(tr, consumed);
    }
    if (consumed < item.days) {
      syllabus.unshift({ title: item.title, days: item.days - consumed });
    }
    days -= consumed;
  }
  if (days > 0) unscheduled(tr, days);
  if (w.end.dayOfWeek == 4) dayOff(tr);
  return tr;
};

const dayOff = (tr) => {
  tr.appendChild(td("", { class: "off" }));
};

const scheduled = (tr, title, days) => {
  tr.appendChild(td(title, { class: "scheduled", colspan: days }));
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

loadData("calendar.json", "syllabus.json");
