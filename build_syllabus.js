import fs from "fs";
import { buildSyllabus, schedule } from "./syllabus.js";

const loadOutline = (datafile) => {
  fs.readFile(datafile, "utf8", (err, data) => {
    if (err) throw err;
    console.log(JSON.stringify(schedule(buildSyllabus(data)), null, 2));
  });
};

loadOutline("outline.txt");
