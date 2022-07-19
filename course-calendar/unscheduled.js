import fs from "fs";
import { unscheduled, outline } from "./outline.js";

fs.readFile("outline.txt", "utf8", (err, data) => {
  if (err) throw err;
  console.log(JSON.stringify(unscheduled(outline(data)), null, 2));
});
