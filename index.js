import fs from "fs";

import { Calendar } from "./calendar.js";

class Dumper {
  // Visitor pattern
  dump(e) {
    e.dump(this);
  }
}

class Text extends Dumper {
  week(w) {
    console.log(w.weekstring());
  }

  vacation(v) {
    console.log(`\n${v.vacationString()}\n`);
  }
}

class Html extends Dumper {
  week(w) {
    let s = "<tr>\n";
    let days = w.days.map((_) => "  <td></td>\n");
    s += `  <td>${w.datesOfWeek()}</td>\n`;
    if (w.start.dayOfWeek == 2) {
      days = ['  <td class="off"></td>\n'].concat(days);
    }
    if (w.end.dayOfWeek == 4) {
      days = days.concat(['  <td class="off"></td>\n']);
    }
    s += days.join("");
    s += "</tr>\n";
    console.log(s);
  }

  vacation(v) {
    console.log(`<tr><td colspan="6">${v.vacationString()}</td></tr>\n`);
  }
}

const showCalendar = (datafile, dumper) => {
  fs.readFile(datafile, (err, data) => {
    if (err) throw err;
    const calendar = new Calendar(JSON.parse(data));
    calendar.elements.forEach((e) => dumper.dump(e));
  });
};

showCalendar("calendar.json", new Html());
