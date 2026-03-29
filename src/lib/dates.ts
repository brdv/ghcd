export function formatTooltipDate(dateStr: string): { dayName: string; formatted: string } {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
  const formatted = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { dayName, formatted };
}
