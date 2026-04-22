type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function clsx(...inputs: ClassValue[]): string {
  const result: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      result.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const inner = clsx(...input);
      if (inner) result.push(inner);
      continue;
    }

    if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) result.push(key);
      }
      continue;
    }
  }

  return result.join(" ");
}

export type { ClassValue };
export default clsx;