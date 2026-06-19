// Variables supplied for one signature render: a flat map of placeholder key → raw value.
// Values are always strings; HTML escaping happens at interpolation time, never here.
export type SignatureVariables = Record<string, string>

// The product of a successful render: the final, MJML-compiled signature HTML.
export type RenderedSignature = {
  html: string
}
