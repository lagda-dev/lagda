// The optional `Idempotency-Key` header every POST accepts (§4). The server treats it as optional, but
// the typed `hc<AppType>` client still expects the header object to be present on routes that declare it,
// so every create call spreads this empty header. Declared once here and reused by the resource modules.
export const noIdempotencyHeader = { header: {} } as const
