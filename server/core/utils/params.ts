export function requireParam(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function requireIntParam(value: string | undefined, name: string): number {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  const num = Number(value);

  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`${name} must be a valid positive integer`);
  }

  return num;
}
