import { z } from "zod"
import { getErrorMessage } from "../infrastructure/getErrorMessage"

// pg-boss job name. Deploys one rendered signature to one employee's mailbox.
export const DEPLOY_SIGNATURE_JOB = "deploy-signature"

export const deploySignaturePayloadSchema = z.object({
  employeeEmail: z.string().email(),
  html: z.string().min(1),
  syncRunId: z.string().min(1),
})

export type DeploySignaturePayload = z.infer<typeof deploySignaturePayloadSchema>

// The outcome to record for this employee in the sync run's deployments.
export type DeploymentRecord = {
  employeeEmail: string
  syncRunId: string
}

// Dependencies are injected so the handler is decoupled and unit-testable: the parent
// wires the real connector deploy + the deployment recorder in apps/server.
export type DeploySignatureDeps = {
  deploySignature: (employeeEmail: string, html: string) => Promise<void>
  recordDeployment: (record: DeploymentRecord) => Promise<void>
}

export const createDeploySignatureHandler =
  (deps: DeploySignatureDeps) =>
  async (payload: DeploySignaturePayload): Promise<void> => {
    const { deploySignature, recordDeployment } = deps
    const { employeeEmail, html, syncRunId } = deploySignaturePayloadSchema.parse(payload)

    try {
      await deploySignature(employeeEmail, html)
    } catch (error) {
      throw new Error(`Failed to deploy signature to ${employeeEmail} for sync run ${syncRunId}: ${getErrorMessage(error)}`)
    }

    await recordDeployment({ employeeEmail, syncRunId })
  }
