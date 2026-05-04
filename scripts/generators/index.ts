import path from "path";
import fs from "fs";
import { generateStructure } from "./generate-structure";
import { renderTreeText } from "./generate-structure";
import { generateTypes } from "./generate-types";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base paths
const ROOT_DIR = path.resolve(__dirname, "../../");
const OUTPUT_DIR = path.resolve(__dirname, "../output");

// Generate project structure
const projectTree = generateStructure(ROOT_DIR);
const projectOutputDir = path.join(OUTPUT_DIR, "projectStructure");
if (!fs.existsSync(projectOutputDir)) fs.mkdirSync(projectOutputDir, { recursive: true });
fs.writeFileSync(path.join(projectOutputDir, "structure.json"), JSON.stringify(projectTree, null, 2));
fs.writeFileSync(path.join(projectOutputDir, "structure.txt"), renderTreeText(projectTree));
console.log("Project structure generated.");

// Generate types
const typesOutputDir = path.join(OUTPUT_DIR, "typesStructure");
generateTypes(ROOT_DIR, typesOutputDir);
console.log("Types structure generated.");
