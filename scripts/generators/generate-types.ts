import fs from "fs";
import path from "path";

const IGNORE = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vscode",
  ".idea",
  "coverage",
  ".DS_Store",
  "scripts/output",
]);

type TypeFile = {
  name: string;
  path: string;
};

// Recursively collect type files
function collectTypeFiles(dir: string): TypeFile[] {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORE.has(e.name));
  let results: TypeFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectTypeFiles(fullPath));
    } else if (entry.isFile() && /(\.types\.ts|types\.ts)$/i.test(entry.name)) {
      results.push({ name: entry.name, path: fullPath });
    }
    console.log("Scanning:", dir);
  }

  return results;
}

// Generate JSON and TXT outputs
export function generateTypes(rootDir: string, outputDir: string) {
  const typeFiles = collectTypeFiles(rootDir);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // JSON output
  const jsonPath = path.join(outputDir, "type-files.json");
  fs.writeFileSync(jsonPath, JSON.stringify(typeFiles, null, 2), "utf-8");

  // TXT output with code
  const txtPath = path.join(outputDir, "type-files.txt");
  const txtContent = typeFiles
    .map((f) => {
      const code = fs.readFileSync(f.path, "utf-8");
      return `// ===== ${f.path} =====\n${code}\n\n`;
    })
    .join("");
  fs.writeFileSync(txtPath, txtContent, "utf-8");
}
