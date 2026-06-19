// Maps each HTML-significant character to its entity. Escaping these prevents an
// employee variable value from breaking out of its element/attribute context (injection).
const HTML_ENTITY_BY_CHARACTER: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

const HTML_SIGNIFICANT_CHARACTERS = /[&<>"']/g

// Escapes the five HTML-significant characters so untrusted text is safe to embed in markup.
// `&` is handled by the same pass (it is part of the character class), so existing entities are
// double-escaped on purpose — the input is treated as plain text, not as pre-formed HTML.
// The regex only ever matches keys of the entity map, so the lookup is always defined; the
// cast avoids an unreachable `?? character` fallback branch while keeping noUncheckedIndexedAccess.
export const escapeHtml = (value: string): string => value.replace(HTML_SIGNIFICANT_CHARACTERS, (character) => HTML_ENTITY_BY_CHARACTER[character] as string)
