import fs from "fs";
import { buildSyllabus } from "./syllabus.js";

const loadOutline = (datafile) => {
  fs.readFile(datafile, "utf8", (err, data) => {
    if (err) throw err;
    console.log(JSON.stringify(buildSyllabus(data), null, 2));
  });
};

loadOutline("outline.txt");
