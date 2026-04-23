import fs from "fs";
import path from "path";
import { generateStructure, renderTreeText } from "./generators/generate-structure";
import { generateTypes } from "./generators/generate-types";

// ---------- CONFIG ----------
const PROJECT_ROOT = path.resolve(".");
const OUTPUT_DIR = path.resolve("./scripts/output");

// ---------- STRUCTURE GENERATION ----------
export function generateStructureScript() {
  const outputDir = path.join(OUTPUT_DIR, "projectStructure");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tree = generateStructure(PROJECT_ROOT);

  // JSON
  const jsonPath = path.join(outputDir, "structure.json");
  fs.writeFileSync(jsonPath, JSON.stringify(tree, null, 2), "utf-8");

  // TXT
  const textPath = path.join(outputDir, "structure.txt");
  fs.writeFileSync(textPath, renderTreeText(tree), "utf-8");

  console.log(`Project structure generated`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`TXT: ${textPath}`);
}

// ---------- TYPES GENERATION ----------
export function generateTypescript() {
  const outputDir = path.join(OUTPUT_DIR, "typesStructure");
  generateTypes(PROJECT_ROOT, outputDir);
  console.log(`Types structure generated in ${outputDir}`);
}

// ---------- CLI / NPM Script SUPPORT ----------
const arg = process.argv[2]; // e.g., "structure" or "types"

if (arg === "structure") {
  generateStructureScript();
} else if (arg === "types") {
  generateTypescript();
} else {
  console.log("Please specify which generator to run: 'structure' or 'types'");
  console.log("Example: npm run gen:structure OR npm run gen:types");
}
