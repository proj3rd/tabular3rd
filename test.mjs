import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "./dist/index.js";

const exampleDir = "examples";
const examplePath = join(exampleDir, "38463-g90-crop.docx");
const exampleFile = readFileSync(examplePath);
parse(exampleFile)
  .then((definitions) => {
    console.log(definitions);
  })
  .catch((reason) => console.error(reason));
