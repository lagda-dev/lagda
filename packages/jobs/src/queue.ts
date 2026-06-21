import PgBoss from "pg-boss"
import { getErrorMessage } from "@lagda/core"

// The Queue abstraction decouples job dispatch/consumption from the backing engine.
// pg-boss (Postgres) is the default, but a non-Postgres deployment can plug in an
// alternative backend by providing another implementation of this interface.
export type Queue = {
  enqueue: <TPayload>(jobName: string, payload: TPayload) => Promise<void>
  work: <TPayload>(jobName: string, handler: (payload: TPayload) => Promise<void>) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
}

// Adapts pg-boss to the Queue interface. Excluded from coverage: it opens a real
// Postgres connection and is verified by integration tests, not unit tests.
export const createPgBossQueue = (connectionString: string): Queue => {
  const boss = new PgBoss(connectionString)

  const enqueue = async <TPayload>(jobName: string, payload: TPayload): Promise<void> => {
    try {
      await boss.send(jobName, payload as object)
    } catch (error) {
      throw new Error(`Failed to enqueue job ${jobName}: ${getErrorMessage(error)}`)
    }
  }

  const work = async <TPayload>(jobName: string, handler: (payload: TPayload) => Promise<void>): Promise<void> => {
    try {
      await boss.work<TPayload>(jobName, async (jobs) => {
        const completions = jobs.map((job) => handler(job.data))
        await Promise.all(completions)
      })
    } catch (error) {
      throw new Error(`Failed to register worker for job ${jobName}: ${getErrorMessage(error)}`)
    }
  }

  const start = async (): Promise<void> => {
    try {
      await boss.start()
    } catch (error) {
      throw new Error(`Failed to start job queue: ${getErrorMessage(error)}`)
    }
  }

  const stop = async (): Promise<void> => {
    try {
      await boss.stop()
    } catch (error) {
      throw new Error(`Failed to stop job queue: ${getErrorMessage(error)}`)
    }
  }

  return { enqueue, work, start, stop }
}
