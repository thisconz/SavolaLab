import fs from "fs";
import path from "path";

interface TreeNode {
  name: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

const IGNORE = new Set([
  "scripts/output",
  ".qodo",
  "node_modules",
  ".git",
  ".DS_Store",
  "dist",
  "build",
  ".env",
  ".vscode",
  "coverage",
  ".idea",
]);

export function generateStructure(rootDir: string): TreeNode[] {
  function walk(dir: string): TreeNode[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !IGNORE.has(e.name));

    return entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: "directory",
          children: walk(fullPath),
        };
      }
      return { name: entry.name, type: "file" };
    });
  }

  return walk(rootDir);
}

// ---------- TEXT RENDER ----------
export function renderTreeText(nodes: TreeNode[], prefix = ""): string {
  let output = "";
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const pointer = isLast ? "└── " : "├── ";
    output += `${prefix}${pointer}${node.name}${node.type === "directory" ? "/" : ""}\n`;
    if (node.children) {
      output += renderTreeText(node.children, prefix + (isLast ? "    " : "│   "));
    }
  });
  return output;
}
