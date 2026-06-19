import { z } from "zod"
import { getErrorMessage } from "../infrastructure/getErrorMessage"

// pg-boss job name. Dispatches one notification to one configured channel.
// Retry and rate-limiting are the queue's concern, not the handler's.
export const NOTIFY_JOB = "notify"

// Channels are modeled generically; per-entity channels are a later step.
export const notifyChannelTypeSchema = z.enum(["slack", "email", "webhook"])

export type NotifyChannelType = z.infer<typeof notifyChannelTypeSchema>

export const notifyPayloadSchema = z.object({
  channelType: notifyChannelTypeSchema,
  event: z.string().min(1),
  message: z.string().min(1),
})

export type NotifyPayload = z.infer<typeof notifyPayloadSchema>

// Dependencies are injected so the handler is decoupled and unit-testable: the parent
// wires the real channel dispatcher in apps/server.
export type NotifyDeps = {
  send: (channelType: NotifyChannelType, event: string, message: string) => Promise<void>
}

export const createNotifyHandler =
  (deps: NotifyDeps) =>
  async (payload: NotifyPayload): Promise<void> => {
    const { send } = deps
    const { channelType, event, message } = notifyPayloadSchema.parse(payload)

    try {
      await send(channelType, event, message)
    } catch (error) {
      throw new Error(`Failed to send ${event} notification to ${channelType} channel: ${getErrorMessage(error)}`)
    }
  }
