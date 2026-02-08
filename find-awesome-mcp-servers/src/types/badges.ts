import { z } from "zod";

export const TimePeriodSchema = z.enum([
  "one_day",
  "one_week",
  "one_month",
  "six_months",
  "one_year",
]);

export type TimePeriodType = z.infer<typeof TimePeriodSchema>;
