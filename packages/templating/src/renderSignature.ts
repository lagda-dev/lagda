import mjml2html from "mjml"
import { getErrorMessage } from "@lagda/core"
import { interpolate } from "./interpolate"
import type { RenderedSignature, SignatureVariables } from "./types"

// Turns an MJML signature template plus a set of employee variables into final signature HTML.
// Order matters: we interpolate FIRST (so variable values are HTML-escaped plain text), THEN
// compile the resulting MJML. Compiling first would let MJML treat substituted values as markup.
export const renderSignature = async (mjmlSource: string, variables: SignatureVariables): Promise<RenderedSignature> => {
  const interpolatedSource = interpolate(mjmlSource, variables)

  try {
    const { html, errors } = await mjml2html(interpolatedSource)
    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => error.formattedMessage).join("; ")
      throw new Error(`MJML reported errors: ${formattedErrors}`)
    }
    return { html }
  } catch (error) {
    throw new Error(`Failed to render signature: ${getErrorMessage(error)}`)
  }
}
