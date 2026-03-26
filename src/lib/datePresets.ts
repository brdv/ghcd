function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function startOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function endOfYear(): string {
  return `${new Date().getFullYear()}-12-31`;
}

export interface DatePreset {
  id: string;
  label: string;
  from: string;
  to: string;
}

export function getDatePresets(): DatePreset[] {
  const now = new Date();
  const today = fmt(now);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const quarterAgo = new Date(now);
  quarterAgo.setDate(quarterAgo.getDate() - 90);

  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  return [
    { id: "7d", label: "7 days", from: fmt(weekAgo), to: today },
    { id: "30d", label: "30 days", from: fmt(monthAgo), to: today },
    { id: "90d", label: "90 days", from: fmt(quarterAgo), to: today },
    { id: "ytd", label: "YTD", from: startOfYear(), to: today },
    { id: "year", label: "This year", from: startOfYear(), to: endOfYear() },
    { id: "1y", label: "Last 12 months", from: fmt(yearAgo), to: today },
  ];
}
