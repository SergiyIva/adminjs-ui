export function dateToEpoch(date: Date) {
  const time = date.getTime();
  return time - (time % 86400000);
}