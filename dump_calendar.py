#!/usr/bin/env python

from collections import Counter
import json
import pendulum

class Text:

    def week(self, days):
        print(weekstring(days))

    def vacation(self, days_off, d):
        print(f"\n{vacation_string(days_off, d)}\n")

class HtmlRowPerDay:

    def week(self, days):
        s = f'<tr>\n<td rowspan="{len(days)}">{weekstring(days)}</td><td>-</td></tr>'
        for _ in range(len(days) - 1):
            s += '\n<tr><td>-</td></tr>'
        print(s)

    def vacation(self, days_off, d):
        print(f'<tr><td colspan="2">{vacation_string(days_off, d)}</td></tr>')

class HtmlCellPerDay:

    def week(self, days):
        s = '<tr>\n'
        s += f'  <td>{dates_of_week(days)}</td>\n'
        if days[0].day_of_week == 2:
            days = [None] + days
        if days[-1].day_of_week == 4:
            days = days + [None]
        for d in days:
            s += f'  <td class="off"></td>\n' if d is None else '  <td></td>\n';
        s += '</tr>\n'
        print(s)

    def vacation(self, days_off, d):
        print(f'<tr><td colspan="6">{vacation_string(days_off, d)}</td></tr>')


def is_weekend(d):
    return d.day_of_week in {0, 6}


def days_of_week(days):
    return f"{days[0].format('ddd')}-{days[-1].format('ddd')}"

def dates_of_week(days):
    start = days[0]
    end = days[-1]
    m1 = start.format("MMM")
    m2 = end.format("MMM")
    d1 = start.format("D")
    d2 = end.format("D")
    #y1 = start.format("YYYY")
    #y2 = end.format("YYYY")

    if m1 == m2:
        return f"{m1} {d1}-{d2}" # , {y1}"
    elif True: # y1 == y2:
        return f"{m1} {d1}-{m2} {d2}" # , {y1}"
    else:
        #return f"{m1} {d1}, {y1}-{m2} {d2}, {y2}"
        return f"{m1} {d1}-{m2} {d2}"

def weekstring(days):
    return f"{days_of_week(days)} ({dates_of_week(days)})"



def vacation_label(d):
    if d.month == 11:
        return "THANKSGIVING BREAK"
    elif d.month == 1:
        return "WINTER BREAK"
    elif d.month == 2:
        return "PRESIDENTS’ DAY WEEKEND"
    else:
        return "SPRING BREAK"


def vacation_string(days_off, d):
    return f"{vacation_label(d)} ({days_off} days)"


if __name__ == "__main__":

    dumper = HtmlCellPerDay()

    total = 0
    weeks = Counter()

    def dump(days):
        global total
        global weeks
        total += len(days)
        weeks[len(days)] += 1
        dumper.week(days)



    with open("calendar.json") as f:
        cal = json.load(f)

        holidays = {pendulum.parse(d) for d in cal["holidays"]}

        start = pendulum.parse(cal["firstDay"])
        end = pendulum.parse(cal["lastDay"])

        days_off = 0
        d = start
        days = []
        while d <= end:
            if d not in holidays and not is_weekend(d):
                if days_off > 0:
                    dump(days)
                    days = []
                    if days_off > 3:
                        dumper.vacation(days_off, d)
                days.append(d)
                days_off = 0
            else:
                days_off += 1
            d = d.add(days=1)

        dump(days)
