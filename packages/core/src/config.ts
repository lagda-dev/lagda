import { z } from "zod"

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const

export const configSchema = z.object({
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  DATABASE_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
})

export type Config = z.infer<typeof configSchema>

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = configSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Invalid configuration: ${issues}`)
  }
  return parsed.data
}
