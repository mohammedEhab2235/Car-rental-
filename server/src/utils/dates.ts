export function parseISODateOnly(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error("تاريخ غير صالح");
  return d;
}

export function diffDaysInclusive(startISO: string, endISO: string): number {
  const start = parseISODateOnly(startISO);
  const end = parseISODateOnly(endISO);
  const ms = end.getTime() - start.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(days, 0);
}

export function isRangeValid(startISO: string, endISO: string): boolean {
  const start = parseISODateOnly(startISO);
  const end = parseISODateOnly(endISO);
  return end.getTime() >= start.getTime();
}

export function isOverlapping(
  aStartISO: string,
  aEndISO: string,
  bStartISO: string,
  bEndISO: string
): boolean {
  const aStart = parseISODateOnly(aStartISO).getTime();
  const aEnd = parseISODateOnly(aEndISO).getTime();
  const bStart = parseISODateOnly(bStartISO).getTime();
  const bEnd = parseISODateOnly(bEndISO).getTime();
  return aStart <= bEnd && bStart <= aEnd;
}

