import type { AppType } from "@lagda/server"
import { hc } from "hono/client"

export const api = hc<AppType>("/")
