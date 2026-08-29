import { z } from "zod";

const MetricSchema = z.enum([
  "size",
  "stargazers_count",
  "forks_count",
  "open_issues_count",
  "subscribers_count",
]);

export type MetricType = z.infer<typeof MetricSchema>;

export const GithubRepoSchema = z.object({
  name: z.string(),
  html_url: z.url(),
  owner: z.object({
    login: z.string(),
    html_url: z.url(),
  }),
  description: z.string().nullable(),
  fork: z.boolean(),
  topics: z.array(z.string()),
  size: z.number(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  created_at: z.string(),
  pushed_at: z.string(),
  license: z
    .object({
      name: z.string(),
    })
    .nullable(),
});

export type GithubRepo = z.infer<typeof GithubRepoSchema>;

export const EnrichedRepoSchema = GithubRepoSchema.extend({
  subscribers_count: z.number(),
});

export type EnrichedRepo = z.infer<typeof EnrichedRepoSchema>;
