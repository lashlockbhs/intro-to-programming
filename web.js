import { Calendar } from "./calendar.js";

const loadCalendar = (filename) => {
  fetch(filename)
    .then(jsonOrBarf)
    .then((data) => fillCalendar(new Calendar(data)));
};

const loadSyllabus = (filename) => {
  fetch(filename)
    .then(jsonOrBarf)
    .then((data) => fillSyllabus(data));
};

const jsonOrBarf = (r) => {
  if (!r.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return r.json();
};

const fillCalendar = (cal) => {
  const tbody = document.getElementById("body");
  cal.elements.forEach((e) => {
    if ("weekstring" in e) {
      tbody.appendChild(weekRow(e));
    } else {
      tbody.appendChild(vacationRow(e));
    }
  });
  loadSyllabus("syllabus.json");
};

const fillSyllabus = (data) => {
  const days = document.querySelectorAll("td.instruction");

  let day = 0;
  data.forEach((item) => {
    console.log(item);
    let d = "start" in item ? item.start : day;
    console.log(`adding at day ${d}`);
    days[d].innerText = item.title;
    days[d].setAttribute("colspan", item.days);
    for (let i = 0; i < item.days - 1; i++) {
      console.log(`Removing ${d + i + 1}`);
      days[d + i + 1].remove();
    }
    day = d + item.days;
  });
};

const weekRow = (w) => {
  const tr = document.createElement("tr");
  tr.appendChild(td(w.datesOfWeek(), {}));
  if (w.start.dayOfWeek == 2) {
    tr.appendChild(td("", { class: "off" }));
  }
  w.days.forEach((_) => tr.appendChild(td("", { class: "instruction" })));
  if (w.end.dayOfWeek == 4) {
    tr.appendChild(td("", { class: "off" }));
  }

  return tr;
};

const vacationRow = (v) => {
  const tr = document.createElement("tr");
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

loadCalendar("calendar.json");
