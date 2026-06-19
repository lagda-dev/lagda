import { escapeHtml } from "./escapeHtml"
import type { SignatureVariables } from "./types"

// Matches a `{{ key }}` placeholder, tolerating any surrounding whitespace inside the braces.
// The key itself is restricted to word characters so stray template syntax cannot match.
const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g

// Replaces every `{{ key }}` placeholder with the HTML-escaped value of `variables[key]`.
// Design choice: a MISSING variable resolves to an empty string — we neither leave the raw
// placeholder in the output (which would leak template syntax to recipients) nor throw (a
// directory often has sparse fields, and one absent value must not fail the whole render).
// Escaping each substituted value is what makes interpolation injection-safe.
export const interpolate = (template: string, variables: SignatureVariables): string =>
  template.replace(PLACEHOLDER_PATTERN, (_placeholder, key: string) => {
    const rawValue = variables[key]
    if (rawValue === undefined) return ""
    return escapeHtml(rawValue)
  })
