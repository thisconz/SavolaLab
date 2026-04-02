export function clsx(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
export type ClassValue = any;
export default clsx;
