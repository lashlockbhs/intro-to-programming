import { Temporal } from "@js-temporal/polyfill";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const dayName = (d) => DAY_NAMES[d.dayOfWeek - 1];

const monthName = (d) => MONTH_NAMES[d.month - 1];

class Calendar {
  constructor(data) {
    this.firstDay = Temporal.PlainDate.from(data.firstDay);
    this.lastDay = Temporal.PlainDate.from(data.lastDay);
    this.startOfSummer = this.lastDay.add({ days: 1 });
    this.holidays = new Set(
      data.holidays.map((d) => Temporal.PlainDate.from(d).toString())
    );
    this.elements = this.parseYear();
  }

  parseYear() {
    let daysOff = 0;
    let days = [];
    let d = this.firstDay;
    let startOfSummer = this.lastDay.add({ days: 1 });

    let elements = [];

    while (!d.equals(startOfSummer)) {
      if (this.isSchoolday(d)) {
        if (daysOff > 0) {
          elements.push(new Week(days));
          days = [];
          if (daysOff > 3) {
            elements.push(new Vacation(daysOff, d));
          }
        }
        days.push(d);
        daysOff = 0;
      } else {
        daysOff++;
      }
      d = d.add({ days: 1 });
    }
    elements.push(new Week(days));
    return elements;
  }

  isHoliday(d) {
    return this.holidays.has(d.toString());
  }

  isWeekend(d) {
    return d.dayOfWeek > 5;
  }

  isSchoolday(d) {
    return !(this.isHoliday(d) || this.isWeekend(d));
  }
}

class Week {
  constructor(days) {
    this.days = days;
    this.start = days[0];
    this.end = days[days.length - 1];
  }

  weekstring(days) {
    return `${this.daysOfWeek(days)} (${this.datesOfWeek(days)})`;
  }

  daysOfWeek(days) {
    return `${dayName(this.start)}-${dayName(this.end)}`;
  }

  datesOfWeek(days) {
    return this.start.month === this.end.month
      ? `${monthName(this.start)} ${this.start.day}-${this.end.day}`
      : `${monthName(this.start)} ${this.start.day}-${monthName(this.end)} ${
          this.end.day
        }`;
  }
  dump(dumper) {
    dumper.week(this);
  }
}

class Vacation {
  constructor(daysOff, dayAfter) {
    this.daysOff = daysOff;
    this.dayAfter = dayAfter;
    this.isWeek = false;
  }

  vacationString() {
    return `${this.vacationLabel()} (${this.daysOff} days)`;
  }

  vacationLabel() {
    switch (this.dayAfter.month) {
      case 11:
        return "THANKSGIVING BREAK";
      case 1:
        return "WINTER BREAK";
      case 2:
        return "PRESIDENTS’ DAY WEEKEND";
      default:
        return "SPRING BREAK";
    }
  }

  dump(dumper) {
    dumper.vacation(this);
  }
}

export { Calendar };
