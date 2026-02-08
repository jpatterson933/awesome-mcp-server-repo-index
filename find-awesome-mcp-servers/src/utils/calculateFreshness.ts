import { TimePeriodType } from "../types/badges.js";

export function calculateTimePeriod(pushedAt: string): TimePeriodType {
  const pushedDate = new Date(pushedAt);
  const now = new Date();
  const diffMs = now.getTime() - pushedDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  const diffMonths = diffDays / 30;

  if (diffHours < 24) return "one_day";
  if (diffDays < 7) return "one_week";
  if (diffDays < 30) return "one_month";
  if (diffMonths < 6) return "six_months";
  return "one_year";
}
