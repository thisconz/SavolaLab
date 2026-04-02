export function format(date: Date | number | string, formatStr: string) {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}
export function parseISO(dateString: string) {
  return new Date(dateString);
}
export function formatDistanceToNow(date: Date | number | string) {
  return "some time ago";
}
export function isToday(date: Date | number | string) {
  return new Date(date).toDateString() === new Date().toDateString();
}
export function isYesterday(date: Date | number | string) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Date(date).toDateString() === d.toDateString();
}
export function subDays(date: Date | number | string, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
}
export function addDays(date: Date | number | string, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}
export function startOfDay(date: Date | number | string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
export function endOfDay(date: Date | number | string) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
